import { Collection, EntityManager, wrap } from '@mikro-orm/core'
import { Item } from './item'
import type { NodeDef } from './nodeDef'


abstract class Handler {
    constructor(nodeDef: NodeDef, em: EntityManager<any>,parentItem?:Item) {
        this.nodeDef = nodeDef
        this.em = em
        this.parentItem = parentItem
    }
    nodeDef: NodeDef
    em: EntityManager<any>

    parentItem?:Item
}

export class SingletonHandler extends Handler {
    constructor(nodeDef: NodeDef, itemData: any, em: EntityManager<any>,parentItem?:Item) {
        super(nodeDef, em,parentItem)
        this.item = new Item(itemData, this)
    }
    item: Item

    initChildren() {
        this.item.initChildren()
    }

    verify():[boolean,string[]]{
        return this.item.verify()
    }

    async applyDataHooks() {
        await this.item.applyDataHooks()
    }

    async handle(){
        await this.item.handle()
    }

    async link(){
        //console.log(`linking ${this.item.fullItemName}`)

        //linking children
        for (const subHandler of this.item.subHandlers) {
            await subHandler.link()
        }

        const parentEntity = this.parentItem?.entity
        if(!parentEntity) return
        
        //linking item to parent
        parentEntity[this.nodeDef.propertyName!] = this.item.entity

        const propertyDef = this.parentItem!.nodeDef.EntityMeta.properties[this.nodeDef.propertyName!]
        
        //link on owning side (propagation only works when assigning to the owning side)
        if(this.item.entity && this.item.entity instanceof this.item.nodeDef.EntityClass && propertyDef.owner == false){

            //it's never a collection because it's the owning side (that owns the fk)
            this.item.entity[propertyDef.mappedBy] = parentEntity
        }

        // const oldEntity = parentEntity[this.nodeDef.propertyName!]
        // if(this.nodeDef.deleteOrphans && oldEntity && oldEntity !== this.item.entity){
        //     console.log('old entity deleted')
        //     this.em.remove(oldEntity)
        // }
        // deleteOrphans object
    }
    
}



export class CollectionHandler extends Handler {
    constructor(nodeDef: NodeDef, collectionData: any[], em: EntityManager<any>, parentItem?:Item) {
        super(nodeDef, em, parentItem)
        this.items = Array.isArray(collectionData) ? collectionData.map((itemData,index) => new Item(itemData, this,index)) : []
        
        this.isEmpty = !Array.isArray(collectionData)
    }
    items: Item[]
    isEmpty: boolean

    initChildren() {
        for (const item of this.items) {
            item.initChildren()
        }
    }

    verify():[boolean,string[]]{
        let ok = true
        const msgArr = []

        //Insert verifs on collection itself --> here <--
        if(this.nodeDef.required && this.isEmpty){
            msgArr.push(`${this.nodeDef.fullNodeName} - La collection est définie dans la pushDef mais n'est pas dans les données (Ignore this check with required=false)`)
            ok = false
        }

        for (const item of this.items) {
            const [okItem, msgArrItem] = item.verify()
            ok = ok && okItem
            msgArr.push(...msgArrItem)
        }
        return [ok, msgArr]
    }

    async handle(){
        for (const item of this.items) {
            await item.handle()
        }
    }

    async applyDataHooks(){
        for (const item of this.items) {
            await item.applyDataHooks()
        }
    }

    async link(){
        if(this.isEmpty) return //to avoid collection.set([]) when not explicitely in data

        //linking children
        for (const item of this.items) {
            //console.log(`linking ${item.fullItemName}`)
            for (const subHandler of item.subHandlers) {
                await subHandler.link()
            }
        }
        

        const parentEntity = this.parentItem?.entity
        if(!parentEntity) return //= batch upsert
        
        const entities = this.items.map(item=>item.entity)

        
        if( !wrap(parentEntity).isInitialized()) await wrap(parentEntity).init()
       
        const collection = parentEntity[this.nodeDef.propertyName!] as Collection<any>
        if (!collection.isInitialized()) await collection.init()

        //linking items to parent
        if(this.nodeDef.collectionMode === 'set'){
            // const oldEntities = collection.getItems()
            collection.set(entities)

            // const removedEntities = oldEntities.reduce((acc,oldEntity)=>{
            //     !collection.contains(oldEntity) && acc.push(oldEntity)
            //     return acc
            // },[])
            

            // if(this.nodeDef.deleteOrphans){
            //     this.em.remove(removedEntities)
            // }
        }

        if(this.nodeDef.collectionMode === 'add'){
            collection.add(...entities)
        }

        if(this.nodeDef.collectionMode === 'remove'){
            collection.remove(...entities)
            // if(this.nodeDef.deleteOrphans){
            //     this.em.remove(entities)
            // }
        }
    }
}