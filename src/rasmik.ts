import { FilterQuery, Loaded, Reference, wrap, EntityManager, EntityClass, Primary } from '@mikro-orm/core'
import { DeleteOptions,  PushData, PushDef, ReadOptions, RootEntity } from './typings'
import { ReadService } from './crud/readService'
import { DeleteService } from './crud/deleteService'
import { PushService } from './crud/pushService'
import { RasmikRouter } from './endpoints/router'
import { Router } from 'express'
import { ReadData, ReadLoaded } from './typings/readData'
import { DraftData, DraftDef } from './typings/draft'
import { PickData, PickDef } from './typings/pick'

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

    // async readOne<E extends RootEntity, ROpt extends Readonly<ReadOptions<E>>>(EntityClass: EntityClass<E>, where: FilterQuery<E>, options?: ReadOptions<E>, em?: EntityManager<any>): Promise<Loaded<E,PopulateFromDef<ROpt>>> {
    //     return await new ReadService(this, EntityClass, where, options as any, em).readOne()
    // }

    // async readMany<E extends RootEntity, ROpt extends Readonly<ReadOptions<E>>>(EntityClass: EntityClass<E>, where?: FilterQuery<E>, options?: ReadOptions<E>, em?: EntityManager<any>): Promise<Loaded<E,PopulateFromDef<ROpt>>[]> {
    //     return await new ReadService(this, EntityClass, where, options as any, em).readMany()
    // }


    // async deleteOne<E extends RootEntity, DDef extends Readonly<DeleteOptions<E>>>(EntityClass: EntityClass<E>, where: FilterQuery<E>, options?: DeleteOptions<E>, em?: EntityManager<any>): Promise<Loaded<E,PopulateFromDef<DDef>>> {
    //     return await new DeleteService(this, EntityClass, where, options as any, em).deleteOne()
    // }

    // async deleteMany<E extends RootEntity, DDef extends Readonly<DeleteOptions<E>>>(EntityClass: EntityClass<E>, where: FilterQuery<E>, options?: DeleteOptions<E>, em?: EntityManager<any>): Promise<Loaded<E,PopulateFromDef<DDef>>[]> {
    //     return await new DeleteService(this, EntityClass, where, options as any, em).deleteMany()
    // }


   
    readOne: ReadOne = ((EntityClass: any) => ({

        where: (where: any) => ({
            run: async (em: any) =>await new ReadService(this, EntityClass, where, undefined, em).readOne(),
            options: (options: any) => ({
                run: async (em: any) =>await new ReadService(this, EntityClass, where, options, em).readOne(),
            })
        }),

        options: (options: any) => ({
            where: (where: any) => ({
                run: async (em: any) =>await new ReadService(this, EntityClass, where, options, em).readOne(),
            })
        })
    })) as any


    readMany: ReadMany = ((EntityClass: any) => ({
        run: async (em: any) => await new ReadService(this, EntityClass, undefined, undefined, em).readMany() as any,
        where: (where: any) => ({
            run: async (em: any) => await new ReadService(this, EntityClass, where, undefined , em).readMany() as any,
            options: (options: any) => ({
                // get options() { return options },
                run: async (em: any) => await new ReadService(this, EntityClass, where, options, em).readMany() as any
            })
        }),

        options: (options: any) => ({
            run: async (em: any) => await new ReadService(this, EntityClass, undefined, options, em).readMany() as any,
            where: (where: any) => ({
                run: async (em: any) => await new ReadService(this, EntityClass, where, options, em).readMany() as any
            })
        })
    })) as any


    readOneEntity: ReadOneEntity = ((EntityClass: any) => ({

        where: (where: any) => ({
            run: async (em: any) =>await new ReadService(this, EntityClass, where, undefined, em).readOneEntity(),
            options: (options: any) => ({
                run: async (em: any) =>await new ReadService(this, EntityClass, where, options, em).readOneEntity(),
            })
        }),

        options: (options: any) => ({
            where: (where: any) => ({
                run: async (em: any) =>await new ReadService(this, EntityClass, where, options, em).readOneEntity(),
            })
        })
    })) as any


    readManyEntities: ReadManyEntities = ((EntityClass: any) => ({
        run: async (em: any) => await new ReadService(this, EntityClass, undefined, undefined, em).readManyEntities() as any,
        where: (where: any) => ({
            run: async (em: any) => await new ReadService(this, EntityClass, where, undefined , em).readManyEntities() as any,
            options: (options: any) => ({
                // get options() { return options },
                run: async (em: any) => await new ReadService(this, EntityClass, where, options, em).readManyEntities() as any
            })
        }),

        options: (options: any) => ({
            run: async (em: any) => await new ReadService(this, EntityClass, undefined, options, em).readManyEntities() as any,
            where: (where: any) => ({
                run: async (em: any) => await new ReadService(this, EntityClass, where, options, em).readManyEntities() as any
            })
        })
    })) as any


    deleteOne: DeleteOne = ((EntityClass: any) => ({

        where: (where: any) => ({
            run: async (em: any) =>await new DeleteService(this, EntityClass, where, undefined, em).deleteOne(),
            options: (options: any) => ({
                run: async (em: any) =>await new DeleteService(this, EntityClass, where, options, em).deleteOne(),
            })
        }),

        options: (options: any) => ({
            where: (where: any) => ({
                run: async (em: any) =>await new DeleteService(this, EntityClass, where, options, em).deleteOne(),
            })
        })
    })) as any


    deleteMany: DeleteMany = ((EntityClass: any) => ({
        run: async (em: any) => await new DeleteService(this, EntityClass, undefined, undefined, em).deleteMany() as any,
        where: (where: any) => ({
            run: async (em: any) => await new DeleteService(this, EntityClass, where, undefined , em).deleteMany() as any,
            options: (options: any) => ({
                // get options() { return options },
                run: async (em: any) => await new DeleteService(this, EntityClass, where, options, em).deleteMany() as any
            })
        }),

        options: (options: any) => ({
            run: async (em: any) => await new DeleteService(this, EntityClass, undefined, options, em).deleteMany() as any,
            where: (where: any) => ({
                run: async (em: any) => await new DeleteService(this, EntityClass, where, options, em).deleteMany() as any
            })
        })
    })) as any

   /**
     * TIP: Code suggestion for the def works only when the def type is invalid. Add a random prop to the def while writting and remove it when you're done.
     */
    // getPushDraft<E extends RootEntity, PDef extends Readonly<PushDef<E>>>(EntityClass?: EntityClass<E>, def?: PDef, untypedData?:any): [entityOUT: EntityOUT<E, PDef>, def: PDef] {
    //     const entityOut:any = untypedData ?? def.nodeType === 'object' ? {} : []

    //     //build skeletton ?

    //     return [entityOut, def]
    // }

    // typePushDef<E extends RootEntity, PDef extends Readonly<PushDef<E>>>(EntityClass: EntityClass<E>,def: PDef):PDef{return def}
    // typePushData<E extends RootEntity, PDef extends Readonly<PushDef<E>>>(EntityClass: EntityClass<E>,def: PDef, data: PushData<E, PDef>){return data}

    // createPushData<E extends RootEntity, PDef extends Readonly<PushDef<E>>>(data: EntityOUT<E, PDef>){return data}


    /**
     * TIP: Code suggestion for the def works only when the def type is invalid. Add a '0 &&' before the def while writting and remove it when you're done.
     */
    // pushOne<E extends RootEntity, PDef extends Readonly<PushDef<E>>>(EntityClass: EntityClass<E>, pushDef: PDef , em?: EntityManager<any>) {

    //     return{
    //         fromPojo:async (data:PushData<E, PDef>): Promise< E & Reference<E>> => await new PushService(this, EntityClass,pushDef as any, data,em).pushOne() as any,

    //         //TODO: ajouter typage pour la data passée à fromEntity
    //         fromEntity:async (data:PushData<E, PDef>): Promise<E & Reference<E>> => {
    //             const pojo =  Array.isArray (data) ?  data.map(item=> wrap(item).toPOJO()) :wrap(data).toPOJO()
    //             return await new PushService(this, EntityClass,pushDef as any,pojo,em).pushOne()  as any
    //         }
    //     }
    // }

    // pushMany<E extends RootEntity, PDef extends Readonly<PushDef<E>>>(EntityClass: EntityClass<E>, pushDef: PDef , em?: EntityManager<any>) {

    //     return{
    //         fromPojo:async (data:PushData<E, PDef>): Promise<(E & Reference<E>)[]> => await new PushService(this, EntityClass,pushDef as any, data,em).pushOne() as any,

    //         //TODO: ajouter typage pour la data passée à fromEntity
    //         fromEntity:async (data:PushData<E, PDef>): Promise<(E & Reference<E>)[]> => {
    //             const pojo =  Array.isArray (data) ?  data.map(item=> wrap(item).toPOJO()) :wrap(data).toPOJO()
    //             return await new PushService(this, EntityClass,pushDef as any, pojo,em).pushMany()  as any
    //         }
    //     }
    // }

    pushOne: PushOne = ((EntityClass: any) => ({
        pushDef: (pushDef: any) => ({
            data: (data: any) => ({
                run: async (em: any) => await new PushService(this, EntityClass,pushDef, data,em).pushOne()  as any,
            }),
        })
    })) as any

    
    pushMany: PushMany = ((EntityClass: any) => ({
        pushDef: (pushDef: any) => ({
            data: (data: any) => ({
                run: async (em: any) =>  await new PushService(this, EntityClass,pushDef, data,em).pushMany() as any
            }),
        })

    })) as any


    define: Define = ({
        pushDef:(entity: any) => ({
            val:(def:any)=>def
        }),
        pushData:(entity: any) => ({
            def:()=>({
                val:(data: any)=>data,
                shape:()=>undefined
            })
        }),
        readOptions:(entity: any) => ({
            val:(def:any)=>def
        }),
        readData:(entity: any) => ({
            def:()=>({
                val:(data: any)=>data,
                shape:()=>undefined
            })
        }),
        draftDef:(entity: any) => ({
            val:(def:any)=>def
        }),
        draftData:(entity: any) => ({
            def:()=>({
                val:(data: any)=>data,
                shape:()=>undefined
            })
        }),
        pickDef:(entity: any) => ({
            val:(def:any)=>def
        }),
        pickData:(entity: any) => ({
            def:()=>({
                val:(data: any)=>data,
                shape:()=>undefined
            })
        }),
    })as any

}

















type ReadOne = <E extends RootEntity>(entity: EntityClass<E>) => {

    where(where: FilterQuery<E>): {
        run(): Promise<ReadData<E>>
        options <ROpt extends ReadOptions<E>>(options: Readonly<ROpt>): HasExtraKeys<ROpt, ReadOptions<E>> extends true ? ExtraKeysMsg<ROpt, ReadOptions<E>, 'ROpt has extra properties :'> : {
            // readonly options: ROpt
            run(em?:EntityManager<any>): Promise<ReadData<E, ROpt>>
        }
    }

    options <ROpt extends ReadOptions<E>>(options: Readonly<ROpt>): HasExtraKeys<ROpt, ReadOptions<E>> extends true ? ExtraKeysMsg<ROpt, ReadOptions<E>, 'ROpt has extra properties :'> : {
        // readonly options: ROpt
        where(where: FilterQuery<E>): {
            run(em?:EntityManager<any>): Promise<ReadData<E, ROpt>>
        }
    }

}

type ReadMany = <E extends RootEntity>(entity: EntityClass<E>) => {

    run(): Promise<Array<ReadData<E>>>
    where(where: FilterQuery<E>): {
        run(): Promise<Array<ReadData<E>>>
        options <ROpt extends ReadOptions<E>>(options: Readonly<ROpt>): HasExtraKeys<ROpt, ReadOptions<E>> extends true ? ExtraKeysMsg<ROpt, ReadOptions<E>, 'ROpt has extra properties :'> : {
            // readonly options: ROpt
            run(em?:EntityManager<any>): Promise<Array<ReadData<E, ROpt>>>
        }
    }

    options <ROpt extends ReadOptions<E>>(options: Readonly<ROpt>): HasExtraKeys<ROpt, ReadOptions<E>> extends true ? ExtraKeysMsg<ROpt, ReadOptions<E>, 'ROpt has extra properties :'> : {
        // readonly options: ROpt
        run(em?:EntityManager<any>): Promise<Array<ReadData<E, ROpt>>>
        where(where: FilterQuery<E>): {
            run(em?:EntityManager<any>): Promise<Array<ReadData<E, ROpt>>>
        }
    }

}

type ReadOneEntity = <E extends RootEntity>(entity: EntityClass<E>) => {

    where(where: FilterQuery<E>): {
        run(): Promise<ReadLoaded<E>>
        options <ROpt extends ReadOptions<E>>(options: Readonly<ROpt>): HasExtraKeys<ROpt, ReadOptions<E>> extends true ? ExtraKeysMsg<ROpt, ReadOptions<E>, 'ROpt has extra properties :'> : {
            // readonly options: ROpt
            run(em?:EntityManager<any>): Promise<ReadLoaded<E, ROpt>>
        }
    }

    options <ROpt extends ReadOptions<E>>(options: Readonly<ROpt>): HasExtraKeys<ROpt, ReadOptions<E>> extends true ? ExtraKeysMsg<ROpt, ReadOptions<E>, 'ROpt has extra properties :'> : {
        // readonly options: ROpt
        where(where: FilterQuery<E>): {
            run(em?:EntityManager<any>): Promise<ReadLoaded<E, ROpt>>
        }
    }

}

type ReadManyEntities = <E extends RootEntity>(entity: EntityClass<E>) => {

    run(): Promise<Array<ReadLoaded<E>>>
    where(where: FilterQuery<E>): {
        run(): Promise<Array<ReadLoaded<E>>>
        options <ROpt extends ReadOptions<E>>(options: Readonly<ROpt>): HasExtraKeys<ROpt, ReadOptions<E>> extends true ? ExtraKeysMsg<ROpt, ReadOptions<E>, 'ROpt has extra properties :'> : {
            // readonly options: ROpt
            run(em?:EntityManager<any>): Promise<Array<ReadLoaded<E, ROpt>>>
        }
    }

    options <ROpt extends ReadOptions<E>>(options: Readonly<ROpt>): HasExtraKeys<ROpt, ReadOptions<E>> extends true ? ExtraKeysMsg<ROpt, ReadOptions<E>, 'ROpt has extra properties :'> : {
        // readonly options: ROpt
        run(em?:EntityManager<any>): Promise<Array<ReadLoaded<E, ROpt>>>
        where(where: FilterQuery<E>): {
            run(em?:EntityManager<any>): Promise<Array<ReadLoaded<E, ROpt>>>
        }
    }

}


type DeleteOne = <E extends RootEntity>(entity: EntityClass<E>) => {

    where(where: FilterQuery<E>): {
        run(): Promise<ReadLoaded<E>>
        options <ROpt extends DeleteOptions<E>>(options: Readonly<ROpt>): HasExtraKeys<ROpt, DeleteOptions<E>> extends true ? ExtraKeysMsg<ROpt, DeleteOptions<E>, 'ROpt has extra properties :'> : {
            // readonly options: ROpt
            run(em?:EntityManager<any>): Promise<ReadLoaded<E, ROpt>>
        }
    }

    options <ROpt extends DeleteOptions<E>>(options: Readonly<ROpt>): HasExtraKeys<ROpt, DeleteOptions<E>> extends true ? ExtraKeysMsg<ROpt, DeleteOptions<E>, 'ROpt has extra properties :'> : {
        // readonly options: ROpt
        where(where: FilterQuery<E>): {
            run(em?:EntityManager<any>): Promise<ReadLoaded<E, ROpt>>
        }
    }

}

type DeleteMany = <E extends RootEntity>(entity: EntityClass<E>) => {

    run(): Promise<Array<ReadLoaded<E>>>
    where(where: FilterQuery<E>): {
        run(): Promise<Array<ReadLoaded<E>>>
        options <ROpt extends DeleteOptions<E>>(options: Readonly<ROpt>): HasExtraKeys<ROpt, DeleteOptions<E>> extends true ? ExtraKeysMsg<ROpt, DeleteOptions<E>, 'ROpt has extra properties :'> : {
            // readonly options: ROpt
            run(em?:EntityManager<any>): Promise<Array<ReadLoaded<E, ROpt>>>
        }
    }

    options <ROpt extends DeleteOptions<E>>(options: Readonly<ROpt>): HasExtraKeys<ROpt, DeleteOptions<E>> extends true ? ExtraKeysMsg<ROpt, DeleteOptions<E>, 'ROpt has extra properties :'> : {
        // readonly options: ROpt
        run(em?:EntityManager<any>): Promise<Array<ReadLoaded<E, ROpt>>>
        where(where: FilterQuery<E>): {
            run(em?:EntityManager<any>): Promise<Array<ReadLoaded<E, ROpt>>>
        }
    }

}


type PushOne = <E extends RootEntity>(entity: EntityClass<E>) => {

    pushDef <PDef extends PushDef<E>>(pushDef: Readonly<PDef>) : HasExtraKeys<PDef, PushDef<E>> extends true ? ExtraKeysMsg<PDef, PushDef<E>, 'PDef has extra properties :'> : {

        data <Data extends PushData<E, PDef>>(data: Readonly<Data>): HasExtraKeys<Data, PushData<E, PDef>> extends true ? ExtraKeysMsg<Data, PushData<E, PDef>, 'Data has extra properties :'> : {
            run(em?:EntityManager<any>): Promise<Primary<E> | undefined>
        }
    }
}

type PushMany = <E extends RootEntity>(entity: EntityClass<E>) => {

    pushDef <PDef extends PushDef<E>>(pushDef: Readonly<PDef>) : HasExtraKeys<PDef, PushDef<E>> extends true ? ExtraKeysMsg<PDef, PushDef<E>, 'PDef has extra properties :'> : {

        data <Data extends PushData<E, PDef>>(data: Readonly<Data>): HasExtraKeys<Data, PushData<E, PDef>> extends true ? ExtraKeysMsg<Data, PushData<E, PDef>, 'Data has extra properties :'> : {
            run(em?:EntityManager<any>): Promise<Array<Primary<E>> | undefined>
        }
    }
}


type Define=  {

    pushDef<E extends RootEntity>(entity: EntityClass<E>):{
        val <PDef extends PushDef<E>>(pushDef: Readonly<PDef>): HasExtraKeys<PDef, PushDef<E>> extends true ? ExtraKeysMsg<PDef, PushDef<E>, 'PDef has extra properties :'> : PDef
    }

    pushData<E extends RootEntity>(entity: EntityClass<E>):{
        def<PDef extends PushDef<E>>(pushDef:Readonly<PDef>):{
            val(data:PushData<E, PDef>): PushData<E, PDef>
            shape():PushData<E, PDef>
        }
    }

    readOptions<E extends RootEntity>(entity: EntityClass<E>):{
        val<ROpt extends ReadOptions<E>>(options: Readonly<ROpt>): HasExtraKeys<ROpt, ReadOptions<E>> extends true ? ExtraKeysMsg<ROpt, ReadOptions<E>, 'ROpt has extra properties :'> : ROpt
    }

    readData<E extends RootEntity>(entity: EntityClass<E>):{
        def<ROpt extends ReadOptions<E>>(readOptions:Readonly<ROpt>):{
            val<Data extends ReadLoaded<E, ROpt>>(data:Readonly<Data>): Data
            shape():ReadLoaded<E, ROpt>
        }
    }


    draftDef<E extends RootEntity>(entity: EntityClass<E>): {
        val<DDef extends DraftDef<E>>(draftDef:DDef):DDef
        // shape:()=>DraftDef<E>
    }

    draftData<E extends RootEntity>(entity: EntityClass<E>): {
        def<DDef extends DraftDef<E>>(draftDef:DDef):{
            val(data:DraftData<E,DDef>): DraftData<E,DDef>
            shape():DraftData<E,DDef>
        }
    }

    pickDef<E extends RootEntity>(entity: EntityClass<E>): {
        val<DDef extends PickDef<E>>(pickDef:DDef):DDef
        // shape:()=>PickDef<E>
    }

    pickData<E extends RootEntity>(entity: EntityClass<E>): {
        def<DDef extends PickDef<E>>(pickDef:DDef):{
            val(data:PickData<E,DDef>):PickData<E,DDef>
            shape():PickData<E,DDef>
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