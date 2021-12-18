import { FilterQuery, ReadOptions, Populated, ReadData, EntityClass, PushData, RootEntity, PushDef, NoExcess, DraftDef, DraftData, PickDef, PickData } from './typings';




export class RasmikError extends Error {
    constructor(error: any) {
        super(error.message)
        Object.assign(this, error)
    }
}

interface ClientConfig {
    baseUrl: string
    axios: any
    onError: (err: Error) => void
}


const services = {
    async getTeacherWithConciseLevels() { }
}


export class RasmikClient {

    config: ClientConfig

    constructor(config: ClientConfig) {

        this.config = config
    }

    services = services

    // async readOne<E extends RootEntity, ROpt extends Readonly<ReadOptions<E>> = {}>(entity:EntityClass<E>, where:FilterQuery<E>, options?:ROpt):Promise<Loaded<E,ROpt>> {
    //     return await this.request(this.config.baseUrl + '/crud/' + (entity as any).__path + '/readOne', {where,options})
    // }


    // async readMany<E extends RootEntity, ROpt extends Readonly<ReadOptions<E>> = {}>(entity:EntityClass<E>, where?:FilterQuery<E>, options?:ROpt):Promise<Loaded<E,ROpt>[]> {
    //     return await this.request(this.config.baseUrl + '/crud/' + (entity as any).__path + '/readMany', {where,options})
    // }

    // // typeReadOptions<E extends RootEntity, ROpt extends Readonly<ReadOptions<E>>>(EntityClass: EntityClass<E>,def: ROpt):ROpt{return def}
    // // typeLoaded<E extends RootEntity, ROpt extends Readonly<Pick<ReadOptions<E>,'children'|'include'|'exclude'>>>(EntityClass: EntityClass<E>,def: ROpt):Loaded<E,ROpt>{return undefined as any}



    // typePushDef<E extends RootEntity, PDef extends Readonly<PushDef<E>>>(EntityClass: EntityClass<E>,def: PDef):PDef{return def}
    // typePushData<E extends RootEntity, PDef extends Readonly<PushDef<E>>>(EntityClass: EntityClass<E>,def: PDef, data: PushData<E, PDef>){return data}


    // async push<E extends RootEntity, PDef extends Readonly<PushDef<E>>, ROpt extends Readonly<ReadOptions<E>> = {}>(entity: EntityClass<E>, pushDef:PDef, data:PushData<E,PDef>, readOptions?:ROpt | false):  Promise<Loaded<E,ROpt>[]: Loaded<E,ROpt>>{
    //     return await this.request(this.config.baseUrl + '/crud/' + (entity as any).__path + '/push', {pushDef,data, readOptions})
    // }

    // async deleteOne<E extends RootEntity, ROpt extends Readonly<ReadOptions<E>> = {}>(entity:EntityClass<E>, where:FilterQuery<E>, options?:ROpt):Promise<Loaded<E,ROpt>> {
    //     return await this.request(this.config.baseUrl + '/crud/' + (entity as any).__path + '/deleteOne', {where,options})
    // }


    // async deleteMany<E extends RootEntity, ROpt extends Readonly<ReadOptions<E>> = {}>(entity:EntityClass<E>, where?:FilterQuery<E>, options?:ROpt):Promise<Loaded<E,ROpt>[]> {
    //     return await this.request(this.config.baseUrl + '/crud/' + (entity as any).__path + '/deleteMany', {where,options})
    // }


    private async request(url: string, payload?: any) {
        try {

            const res = await this.config.axios.post(url, payload, {
                headers: {
                    // Overwrite Axios's automatically set Content-Type
                    'Content-Type': 'application/json'
                }
            })
            const data = res.data
            return data
        } catch (err: any) {

            const serverError = err.response?.data
            if (serverError?.error === true) {

                const rethrown = new RasmikError({
                    url,
                    ...serverError,
                    ...payload
                });

                this.config.onError(rethrown)
            }
            else {
                this.config.onError(err)
            }
        }
    }


    //, PDef extends Readonly<PushDef<E>>, ROpt extends Readonly<ReadOptions<E>
    // pushDef:PDef, data:PushData<E,PDef>, readOptions?:ROpt | false
    // Promise<Loaded<E,ROpt>[]: Loaded<E,ROpt>>
    //await this.request(this.config.baseUrl + '/crud/' + (entity as any).__path + '/push', {pushDef,data, readOptions})


    pushOne: PushOne = ((entity: any) => ({

        pushDef: (pushDef: any) => ({
            // get def() { return pushDef },
            // get dataShape() { return undefined as any },
            data: (data: any) => ({

                // get data() { return data },
                run: async () => await this.request(this.config.baseUrl + '/crud/' + (entity as any).__path + '/pushOne', { data, pushDef }) as any,
                readOptions: (readOptions: any) => ({

                    // get readOptions() { return readOptions },
                    run: async () => await this.request(this.config.baseUrl + '/crud/' + (entity as any).__path + '/pushOne', { data, readOptions, pushDef }) as any

                })

            }),
        })

    })) as any


    pushMany: PushMany = ((entity: any) => ({

        pushDef: (pushDef: any) => ({
            // get def() { return pushDef },
            // get dataShape() { return undefined as any },
            data: (data: any) => ({

                // get data() { return data },
                run: async () => await this.request(this.config.baseUrl + '/crud/' + (entity as any).__path + '/pushMany', { data, pushDef }) as any,
                readOptions: (readOptions: any) => ({

                    // get readOptions() { return readOptions },
                    run: async () => await this.request(this.config.baseUrl + '/crud/' + (entity as any).__path + '/pushMany', { data, readOptions, pushDef }) as any

                })

            }),
        })

    })) as any


    readOne: ReadOne = ((entity: any) => ({

        where: (where: any) => ({
            run: async () => await this.request(this.config.baseUrl + '/crud/' + (entity as any).__path + '/readOne', { where }) as any,
            options: (options: any) => ({
                // get options() { return options },
                run: async () => await this.request(this.config.baseUrl + '/crud/' + (entity as any).__path + '/readOne', { where, options }) as any
            })
        }),

        options: (options: any) => ({
            where: (where: any) => ({
                // get options() { return options },
                run: async () => await this.request(this.config.baseUrl + '/crud/' + (entity as any).__path + '/readOne', { where, options }) as any
            })
        })
    })) as any


    readMany: ReadMany = ((entity: any) => ({
        run: async () => await this.request(this.config.baseUrl + '/crud/' + (entity as any).__path + '/readMany', {}) as any,
        where: (where: any) => ({
            run: async () => await this.request(this.config.baseUrl + '/crud/' + (entity as any).__path + '/readMany', { where }) as any,
            options: (options: any) => ({
                // get options() { return options },
                run: async () => await this.request(this.config.baseUrl + '/crud/' + (entity as any).__path + '/readMany', { where, options }) as any
            })
        }),

        options: (options: any) => ({
            run: async () => await this.request(this.config.baseUrl + '/crud/' + (entity as any).__path + '/readMany', { options }) as any,
            where: (where: any) => ({
                // get options() { return options },
                run: async () => await this.request(this.config.baseUrl + '/crud/' + (entity as any).__path + '/readMany', { where, options }) as any
            })
        })
    })) as any

    deleteOne: ReadOne = ((entity: any) => ({

        where: (where: any) => ({
            run: async () => await this.request(this.config.baseUrl + '/crud/' + (entity as any).__path + '/deleteOne', { where }) as any,
            options: (options: any) => ({
                // get options() { return options },
                run: async () => await this.request(this.config.baseUrl + '/crud/' + (entity as any).__path + '/deleteOne', { where, options }) as any
            })
        }),

        options: (options: any) => ({
            where: (where: any) => ({
                // get options() { return options },
                run: async () => await this.request(this.config.baseUrl + '/crud/' + (entity as any).__path + '/deleteOne', { where, options }) as any
            })
        })
    })) as any


    deleteMany: ReadMany = ((entity: any) => ({

        where: (where: any) => ({
            run: async () => await this.request(this.config.baseUrl + '/crud/' + (entity as any).__path + '/deleteMany', { where }) as any,
            options: (options: any) => ({
                // get options() { return options },
                run: async () => await this.request(this.config.baseUrl + '/crud/' + (entity as any).__path + '/deleteMany', { where, options }) as any
            })
        }),

        options: (options: any) => ({
            run: async () => await this.request(this.config.baseUrl + '/crud/' + (entity as any).__path + '/deleteMany', { options }) as any,
            where: (where: any) => ({
                // get options() { return options },
                run: async () => await this.request(this.config.baseUrl + '/crud/' + (entity as any).__path + '/deleteMany', { where, options }) as any
            })
        })
    })) as any


    define: Define = ({
        pushDef: (entity: any) => ({
            val: (def: any) => def
        }),
        pushData: (entity: any) => ({
            def: () => ({
                val: (data: any) => data,
                shape: () => undefined
            })
        }),
        readOptions: (entity: any) => ({
            val: (def: any) => def
        }),
        readData: (entity: any) => ({
            def: () => ({
                val: (data: any) => data,
                shape: () => undefined
            })
        }),
        draftDef: (entity: any) => ({
            val: (def: any) => def
        }),
        draftData: (entity: any) => ({
            def: () => ({
                val: (data: any) => data,
                shape: () => undefined
            })
        }),
        pickDef: (entity: any) => ({
            val: (def: any) => def
        }),
        pickData: (entity: any) => ({
            def: () => ({
                val: (data: any) => data,
                shape: () => undefined
            })
        }),
    }) as any


}




type ReadOne = <E extends RootEntity>(entity: EntityClass<E>) => {

    where(where: FilterQuery<E>): {
        run(): Promise<ReadData<E>>
        options<ROpt extends ReadOptions<E>>(options: Readonly<ROpt>): HasExtraKeys<ROpt, ReadOptions<E>> extends true ? ExtraKeysMsg<ROpt, ReadOptions<E>, 'ROpt has extra properties :'> : {
            // readonly options: ROpt
            run(): Promise<ReadData<E, ROpt>>
        }
    }

    options<ROpt extends ReadOptions<E>>(options: Readonly<ROpt>): HasExtraKeys<ROpt, ReadOptions<E>> extends true ? ExtraKeysMsg<ROpt, ReadOptions<E>, 'ROpt has extra properties :'> : {
        // readonly options: ROpt
        where(where: FilterQuery<E>): {
            run(): Promise<ReadData<E, ROpt>>
        }
    }

}

type ReadMany = <E extends RootEntity>(entity: EntityClass<E>) => {

    run(): Promise<Array<ReadData<E>>>
    where(where: FilterQuery<E>): {
        run(): Promise<Array<ReadData<E>>>
        options<ROpt extends ReadOptions<E>>(options: Readonly<ROpt>): HasExtraKeys<ROpt, ReadOptions<E>> extends true ? ExtraKeysMsg<ROpt, ReadOptions<E>, 'ROpt has extra properties :'> : {
            // readonly options: ROpt
            run(): Promise<Array<ReadData<E, ROpt>>>
        }
    }

    options<ROpt extends ReadOptions<E>>(options: Readonly<ROpt>): HasExtraKeys<ROpt, ReadOptions<E>> extends true ? ExtraKeysMsg<ROpt, ReadOptions<E>, 'ROpt has extra properties :'> : {
        // readonly options: ROpt
        run(): Promise<Array<ReadData<E, ROpt>>>
        where(where: FilterQuery<E>): {
            run(): Promise<Array<ReadData<E, ROpt>>>
        }
    }

}


type PushOne = <E extends RootEntity>(entity: EntityClass<E>) => {

    pushDef<PDef extends PushDef<E>>(pushDef: Readonly<PDef>): HasExtraKeys<PDef, PushDef<E>> extends true ? ExtraKeysMsg<PDef, PushDef<E>, 'PDef has extra properties :'> : {
       
        data(data: Readonly<PushData<E, PDef>>): {
            // readonly data: Data
            run(): Promise<ReadData<E>>
            readOptions<ROpt extends ReadOptions<E>>(readOptions: Readonly<ROpt>): HasExtraKeys<ROpt, ReadOptions<E>> extends true ? ExtraKeysMsg<ROpt, ReadOptions<E>, 'ROpt has extra properties :'> : {
                // readonly readOptions: ROpt
                run(): Promise<ReadData<E, ROpt>>
            }
        }
    }
}

type PushMany = <E extends RootEntity>(entity: EntityClass<E>) => {

    pushDef<PDef extends PushDef<E>>(pushDef: Readonly<PDef>): HasExtraKeys<PDef, PushDef<E>> extends true ? ExtraKeysMsg<PDef, PushDef<E>, 'PDef has extra properties :'> : {

        //TODO: add explicit never since we can't have type parameter and so we can't check for extra properties
        data(data:Array<PushData<E, PDef>>): { //HasExtraKeys<typeof, PushData<E, PDef>> extends true ? ExtraKeysMsg<Data, PushData<E, PDef>, 'Data has extra properties :'> : {
            // readonly data: Data
            run(): Promise<ReadData<E>[]>
            readOptions<ROpt extends ReadOptions<E>>(readOptions: Readonly<ROpt>): HasExtraKeys<ROpt, ReadOptions<E>> extends true ? ExtraKeysMsg<ROpt, ReadOptions<E>, 'ROpt has extra properties :'> : {
                // readonly readOptions: ROpt
                run(): Promise<ReadData<E, ROpt>[]>
            }
        }
    }
}
type Define = {

    pushDef<E extends RootEntity>(entity: EntityClass<E>): {
        val<PDef extends PushDef<E>>(pushDef: Readonly<PDef>): HasExtraKeys<PDef, PushDef<E>> extends true ? ExtraKeysMsg<PDef, PushDef<E>, 'PDef has extra properties :'> : PDef
    }

    pushData<E extends RootEntity>(entity: EntityClass<E>): {
        def<PDef extends PushDef<E>>(pushDef: Readonly<PDef>): {
            val(data: PushData<E, PDef>):PushData<E, PDef> ; //No extend or intellissence won't work once when the type matches
            shape(): PushData<E, PDef>
        }
    }

    readOptions<E extends RootEntity>(entity: EntityClass<E>): {
        val<ROpt extends ReadOptions<E>>(options: Readonly<ROpt>): HasExtraKeys<ROpt, ReadOptions<E>> extends true ? ExtraKeysMsg<ROpt, ReadOptions<E>, 'ROpt has extra properties :'> : ROpt
    }

    readData<E extends RootEntity>(entity: EntityClass<E>): {
        def<ROpt extends ReadOptions<E>>(readOptions: Readonly<ROpt>): {
            val<Data extends ReadData<E, ROpt>>(data: Readonly<Data>): Data
            shape(): ReadData<E, ROpt>
        }
    }


    draftDef<E extends RootEntity>(entity: EntityClass<E>): {
        val<DDef extends DraftDef<E>>(draftDef: DDef): DDef
        // shape:()=>DraftDef<E>
    }

    draftData<E extends RootEntity>(entity: EntityClass<E>): {
        def<DDef extends DraftDef<E>>(draftDef: DDef): {
            val<Data extends DraftData<E, DDef>>(data: Data): Data
            shape(): DraftData<E, DDef>
        }
    }

    pickDef<E extends RootEntity>(entity: EntityClass<E>): {
        val<DDef extends PickDef<E>>(pickDef: DDef): DDef
        // shape:()=>PickDef<E>
    }

    pickData<E extends RootEntity>(entity: EntityClass<E>): {
        def<DDef extends PickDef<E>>(pickDef: DDef): {
            val<Data extends PickData<E, DDef>>(data: Data): Data
            shape(): PickData<E, DDef>
        }
    }
}


/**
 * Extra props are allowed by typsecript on the top level object
 */
type ExtraKeys<T extends object, Model extends object> = Exclude<keyof T, keyof Model>

type HasExtraKeys<T extends object, Model extends object> = ExtraKeys<T, Model> extends never ? false : true
type ExtraKeysMsg<T extends object, Model extends object, Msg extends string = 'T has extra properties'> = {
    [K in Msg | ExtraKeys<T, Model>]: never
}




// type Define=  {

//     pushDef:<E extends RootEntity>(entity: EntityClass<E>) =>{
//         val: <PDef extends PushDef<E>>(pushDef: Readonly<PDef>) => HasExtraKeys<PDef, PushDef<E>> extends true ? ExtraKeysMsg<PDef, PushDef<E>, 'PDef has extra properties :'> : PDef
//     }

//     pushData:<E extends RootEntity>(entity: EntityClass<E>) =>{
//         setDef():<PDef extends PushDef<E>>(pushDef:Readonly<PDef>)=>{
//             val:<Data extends PushData<E, PDef>>(data:Readonly<Data>) => Data
//             shape:()=>PushData<E, PDef>
//         }
//     }


//     readOptions:<E extends RootEntity>(entity: EntityClass<E>) =>{
//         val:<ROpt extends ReadOptions<E>>(options: Readonly<ROpt>): HasExtraKeys<ROpt, ReadOptions<E>> extends true ? ExtraKeysMsg<ROpt, ReadOptions<E>, 'ROpt has extra properties :'> : ROpt
//     }

//     readData:<E extends RootEntity>(entity: EntityClass<E>) =>{
//         setDef():<ROpt extends ReadOptions<E>>(readOptions:Readonly<ROpt>)=>{
//             val:<Data extends Loaded<E, ROpt>>(data:Readonly<Data>) => Data
//             shape:()=>Loaded<E, ROpt>
//         }
//     }


//     draftDef:<E extends RootEntity>(entity: EntityClass<E>) =>{
//         val:<DDef extends DraftDef<E>>(draftDef:DDef)=>DDef
//         // shape:()=>DraftDef<E>
//     }

//     draftData:<E extends RootEntity>(entity: EntityClass<E>) =>{
//         setDef():<DDef extends DraftDef<E>>(draftDef:DDef)=>{
//             val:<Data extends DraftData<E,DDef>>(data:Data)=> Data
//             shape:()=>DraftData<E,DDef>
//         }
//     }

// }


// type Define= <E extends RootEntity>(entity: EntityClass<E>) => {
//     pushDef: <PDef extends PushDef<E>>(pushDef: Readonly<PDef>) => HasExtraKeys<PDef, PushDef<E>> extends true ? ExtraKeysMsg<PDef, PushDef<E>, 'PDef has extra properties :'> : {
//         val:()=>PDef
//         pushData:<Data extends PushData<E, PDef>>(data: Readonly<Data>) HasExtraKeys<Data, PushData<E, PDef>> extends true ? ExtraKeysMsg<Data, PushData<E, PDef>, 'Data has extra properties :'> : {
//             val:()=>Data
//         }
//     }
//     readOptions: <ROpt extends ReadOptions<E>>(options: Readonly<ROpt>): HasExtraKeys<ROpt, ReadOptions<E>> extends true ? ExtraKeysMsg<ROpt, ReadOptions<E>, 'ROpt has extra properties :'> : {
//         val:()=>ROpt
//         shape:()=>Loaded<E,ROpt>
//     }

//     draftDef:<DDef extends DraftDef<E>>(draftDef:DDef)=>{
//         val:()=>DDef
//         shape:()=>DraftData<E,DDef>
//     }
//     draft:{
//         def:<DDef extends DraftDef<E>>(draftDef:DDef)=>{
//             val
//         }
//         shape:
//         data
//     }
//     // pushData: 
// }
