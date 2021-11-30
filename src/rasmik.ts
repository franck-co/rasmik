import { FilterQuery, Loaded, Reference, wrap, EntityManager, EntityClass } from '@mikro-orm/core'
import { DeleteOptions, PushData, PushDef, ReadOptions, RootEntity } from './typings'
import { ReadService } from './crud/readService'
import { DeleteService } from './crud/deleteService'
import { PushService } from './crud/pushService'
import { RasmikRouter } from './endpoints/router'
import { Router } from 'express'

interface RasmikServerConfig<S extends object> {
    services: S
    // baseUrl: string
    // axios: any
    // onError: (err: Error) => void
}


export class RasmikServer<S extends object> {

    config: RasmikServerConfig<S>
    services!:S
    private router: RasmikRouter = new RasmikRouter(this)
    em!: EntityManager<any>

    constructor(config: RasmikServerConfig<S>) {
        this.config = config
    }

    /** em is available only after MikroOrm initialisation. 1. Create the instance of class RasmikServer so other modules can reference it saely. 2. pass the em */
    public setEM(rootEM:EntityManager<any>){
        this.em = rootEM
    }
    

    public registerRoutes(router:Router){
       this.router.registerRoutes(router)
    }

    async readOne<E extends RootEntity, P extends string = never>(EntityClass: EntityClass<E>, where: FilterQuery<E>, options?: ReadOptions<E, P>, em?: EntityManager<any>): Promise<Loaded<E, P>> {
        return await new ReadService(this, EntityClass, where, options as any, em).readOne()
    }

    async readMany<E extends RootEntity, P extends string = never>(EntityClass: EntityClass<E>, where?: FilterQuery<E>, options?: ReadOptions<E, P>, em?: EntityManager<any>): Promise<Loaded<E, P>[]> {
        return await new ReadService(this, EntityClass, where, options as any, em).readMany()
    }


    async deleteOne<E extends RootEntity, P extends string = never>(EntityClass: EntityClass<E>, where: FilterQuery<E>, options?: DeleteOptions<E, P>, em?: EntityManager<any>): Promise<Loaded<E, P>> {
        return await new DeleteService(this, EntityClass, where, options as any, em).deleteOne()
    }

    async deleteMany<E extends RootEntity, P extends string = never>(EntityClass: EntityClass<E>, where: FilterQuery<E>, options?: DeleteOptions<E, P>, em?: EntityManager<any>): Promise<Loaded<E, P>[]> {
        return await new DeleteService(this, EntityClass, where, options as any, em).deleteMany()
    }

   /**
     * TIP: Code suggestion for the def works only when the def type is invalid. Add a random prop to the def while writting and remove it when you're done.
     */
    // getPushDraft<E extends RootEntity, PDef extends Readonly<PushDef<E>>>(EntityClass?: EntityClass<E>, def?: PDef, untypedData?:any): [entityOUT: EntityOUT<E, PDef>, def: PDef] {
    //     const entityOut:any = untypedData ?? def.nodeType === 'object' ? {} : []

    //     //build skeletton ?

    //     return [entityOut, def]
    // }

    typePushDef<E extends RootEntity, PDef extends Readonly<PushDef<E>>>(EntityClass: EntityClass<E>,def: PDef):PDef{return def}
    typePushData<E extends RootEntity, PDef extends Readonly<PushDef<E>>>(EntityClass: EntityClass<E>,def: PDef, data: PushData<E, PDef>){return data}

    // createPushData<E extends RootEntity, PDef extends Readonly<PushDef<E>>>(data: EntityOUT<E, PDef>){return data}


    /**
     * TIP: Code suggestion for the def works only when the def type is invalid. Add a '0 &&' before the def while writting and remove it when you're done.
     */
    push<E extends RootEntity, PDef extends Readonly<PushDef<E>>>(EntityClass: EntityClass<E>, pushDef: PDef , em?: EntityManager<any>) {

        return{
            fromPojo:async (data:PushData<E, PDef>): Promise< PDef['nodeType'] extends 'objects' ? (E & Reference<E>)[] : (E & Reference<E>)> => await new PushService(this, EntityClass,pushDef as any, data,em).push() as any,

            //TODO: ajouter typage pour la data passée à fromEntity
            fromEntity:async (data:PushData<E, PDef>): Promise< PDef['nodeType'] extends 'objects' ? (E & Reference<E>)[] : (E & Reference<E>)> => {
                const pojo =  Array.isArray (data) ?  data.map(item=> wrap(item).toPOJO()) :wrap(data).toPOJO()
                return await new PushService(this, EntityClass,pushDef as any, pojo,em).push()  as any
            }
        }
    }

}