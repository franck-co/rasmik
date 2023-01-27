import type { EntityClass, EntityManager, wrap } from '@mikro-orm/core';
import type { AnyPushDef, PushDef } from '../typings';
import { CollectionHandler, SingletonHandler } from './handlers';
import { NodeDef } from './nodeDef';


export class PushRunner {
    constructor(EntityClass:EntityClass<any>, defRaw: AnyPushDef, data:any, em:EntityManager<any>){
        this.EntityClass = EntityClass
        this.data = data
        this.defRaw = defRaw
        this.em = em
    }

    EntityClass:EntityClass<any>
    em:EntityManager<any>
    defRaw: AnyPushDef
    data:any

    topHandler!: SingletonHandler | CollectionHandler
    topDef!: NodeDef

    /* Build a tree of NodeDef acording to the raw pushDef */
    buildDefTree(type:'coll' | 'single') {
        this.topDef = new NodeDef(this.EntityClass,  this.defRaw,type);
        this.topDef.initSubs()
    }

     /* Build a tree of Handlers (Singleton / Collection) and Items (depends on data) */
    buildHandlerTree(pushData: any) {

        this.topHandler = this.createTopHandler(this.topDef, pushData, this.em)
        this.topHandler.initChildren()

    }

    async applyDataHooks(){
        //need to recompute handler tree after
        await this.topHandler.applyDataHooks()
    }
           
            

    verifyDefs(){
       return this.topDef.verify()
    }

    verifyItems(){
        return this.topHandler.verify()
    }

    async handle(){
        await this.topHandler.handle()
    }

    async link(){
        await this.topHandler.link()
    }

    
    getNext(){
        if(this.topHandler instanceof SingletonHandler){
            // return wrap(this.topHandler.item.entity).toReference()
            const entity = this.topHandler.item.entity
            return this.topDef.pkNames.length=== 1 ?  entity[this.topDef.pkNames[0]] : this.topDef.pkNames.map(pkName=>entity[pkName]) 
        }
        if(this.topHandler instanceof CollectionHandler){
            // const refs = this.topHandler.items.map(item=>wrap(item.entity).toReference())
            return this.topHandler.items.map(item=>{
                const entity = item.entity
                return this.topDef.pkNames.length=== 1 ?  entity[this.topDef.pkNames[0]] : this.topDef.pkNames.map(pkName=>entity[pkName]) 
            })
        }
    }

    private createTopHandler(def: NodeDef, data: any, em: EntityManager<any>): SingletonHandler | CollectionHandler {
    
        if (['pk', 'object'].includes(def.nodeType)) {
            return new SingletonHandler(def, data, em)
        }else {//'ids', 'objects'
            return new CollectionHandler(def, data, em)
        }
    }
}



