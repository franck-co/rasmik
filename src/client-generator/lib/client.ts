import { FilterQuery , ReadOptions, Loaded,EntityClass, PushData, RootEntity, PushDef} from './typings';


interface RasmikErrorArgs {
    message:string
    messages?: string | string[]
    usedDef?:any
    usedWhere?:any
    usedOptions?:any
    pushData?:any
}

export class RasmikError extends Error {
    constructor(error: RasmikErrorArgs) {
        super(error.message)
        Object.assign(this, error)
    }

    type?: string
    messages?: string | string[]
    usedDef?:any
    usedWhere?:any
    usedOptions?:any
    pushData?:any
}

interface ClientConfig {
    baseUrl: string
    axios: any
    onError: (err: Error) => void
}


const services = {
   async getTeacherWithConciseLevels(){}
}


export class RasmikClient {

    config: ClientConfig

    constructor(config: ClientConfig) {
        this.config = config
    }

    services = services

    async readOne<E extends RootEntity, P extends string = never>(entity:EntityClass<E>, where:FilterQuery<E>, options?:ReadOptions<E,P>):Promise<Loaded<E,P>> {
        return await this.request(this.config.baseUrl + '/crud/' + (entity as any).__path + '/readOne', {where,options})
    }


    async readMany<E extends RootEntity, P extends string = never>(entity:EntityClass<E>, where?:FilterQuery<E>, options?:ReadOptions<E,P>):Promise<Loaded<E,P>[]> {
        return await this.request(this.config.baseUrl + '/crud/' + (entity as any).__path + '/readMany', {where,options})
    }

    typePushDef<E extends RootEntity, PDef extends Readonly<PushDef<E>>>(EntityClass: EntityClass<E>,def: PDef):PDef{return def}
    typePushData<E extends RootEntity, PDef extends Readonly<PushDef<E>>>(EntityClass: EntityClass<E>,def: PDef, data: PushData<E, PDef>){return data}


    async push<E extends RootEntity, PDef extends Readonly<PushDef<E>>, P extends string = never>(entity: EntityClass<E>, pushDef:PDef, data:PushData<E,PDef>, readOptions?:ReadOptions<E,P> | false):  Promise<PDef extends false ? void : PDef['nodeType'] extends 'objects' ? Loaded<E,P>[]: Loaded<E,P>>{
        return await this.request(this.config.baseUrl + '/crud/' + (entity as any).__path + '/push', {pushDef,data, readOptions})
    }

    async deleteOne<E extends RootEntity, P extends string = never>(entity:EntityClass<E>, where:FilterQuery<E>, options?:ReadOptions<E,P>):Promise<Loaded<E,P>> {
        return await this.request(this.config.baseUrl + '/crud/' + (entity as any).__path + '/deleteOne', {where,options})
    }


    async deleteMany<E extends RootEntity, P extends string = never>(entity:EntityClass<E>, where?:FilterQuery<E>, options?:ReadOptions<E,P>):Promise<Loaded<E,P>[]> {
        return await this.request(this.config.baseUrl + '/crud/' + (entity as any).__path + '/deleteMany', {where,options})
    }


    private async request(url: string, payload?: any) {
        try {

            const res = await this.config.axios.post(url, payload,{  
                headers: {
                 // Overwrite Axios's automatically set Content-Type
                'Content-Type': 'application/json'
              }})
            const data = res.data
            return data
        } catch (err:any) {

            const serverError = err.response?.data
            if (serverError?.error === true) {

                const rethrown = new RasmikError({
                    message:serverError.msg || serverError.message,
                    messages: serverError.messages,
                    usedDef: serverError.usedDef,
                    usedOptions: serverError.usedOptions,
                    usedWhere: serverError.usedWhere,
                    pushData:payload.data
                })

                this.config.onError(rethrown)
            }
            else {
                this.config.onError(err)
            }
        }
    }
}