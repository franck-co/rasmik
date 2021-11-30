import { EntityMetadata , EntityManager, wrap} from '@mikro-orm/core';
import { CollectionHandler, SingletonHandler } from './handlers';
import { NodeDef } from './nodeDef';
import {Utils} from './utils'

export class Item {
    constructor(data: any, handler: SingletonHandler | CollectionHandler, index?:number) {
        this.data = data;
        this.handler = handler
        this.parentItem = this.handler.parentItem

        this.em = this.handler.em
        this.nodeDef = handler.nodeDef

        this.pkVals = this.isObject ? this.nodeDef.pkNames.map(pkName=>data[pkName]) : [data]
        this.index = index
    }//         Object.assign(this, {itemData, nodeHandler, parentItem, mikro: nodeHandler.mikro, Entity:nodeHandler.entity})


    data: any
    handler: SingletonHandler | CollectionHandler
    subHandlers: Array<SingletonHandler | CollectionHandler> = []
    parentItem?:Item

    pkVals: any[]
    entity: any

    nodeDef: NodeDef

    em: EntityManager<any>

    index?: number
    get indexStr():string{
        return (this.index !== undefined) ? `[${this.index.toString()}]` : ""
    }

    get isObject() {
        return Utils.isObject(this.data)
    }

    get hasMissingSinglePk(){
        return this.nodeDef.hasSinglePk && Utils.isNullish(this.pkVals[0])
    }


    initChildren() {
        for (const subDef of this.handler.nodeDef.subDefs) {
            const subData = this.data[subDef.propertyName!]
            const subHandler = this.createSubHandler(subDef, subData, this, this.em)
            this.subHandlers.push(subHandler)
            subHandler.initChildren()
        }
    }

    async findEntity() {
        if (this.pkVals.some(v=>v === undefined)) throw new Error("can't find entity with undefined pkVals")
        if (this.pkVals.some(v=>v === null) ) throw new Error("can't find entity whith null pkVals")
        const filterQuery = this.nodeDef.pkNames.reduce<Record<string,any>>((fltQry, pkName,index)=>{
            fltQry[pkName] = this.pkVals[index]
            return fltQry
        },{})
        return await this.em.findOne(this.nodeDef.EntityClass,filterQuery)
    }


    private tryGetReference() {
        //if it wasn't created or updated, the entity may not be loaded. If we have its id, we get at least its reference.
        if (!this.entity && !this.pkVals.some(v=>Utils.isNullish(v))) this.entity = this.em.getReference(this.nodeDef.EntityClass, this.pkVals)
    }

    get ownData() {
        return Utils.isObject(this.data) ? Utils.filterObjectByKeys(this.data, this.nodeDef.filteredOwnProps) : this.data
    }

    get fullItemName():string{
        return `${this.parentItem ? this.parentItem.fullItemName + "." : "|>"}${this.nodeDef.nodeName}${this.indexStr}`
    }

    verify(): [boolean, string[]] {
        //console.log("Vérification de l'item " + this.fullItemName)

        let okSelf = true
        const msgArr = []


        if(this.nodeDef.required && this.data === undefined /** null is valid */){
            msgArr.push(`${this.fullItemName} - Node défini dans la pushDef mais n'est pas dans les données (Ignore this check with required=false)`)
            okSelf = false
        }

        //common to object nodes
        if(!this.nodeDef.creatable && this.data && this.pkVals.some(v=>Utils.isNullish(v))){
            msgArr.push(`${this.fullItemName} - L'arbre est incorrect : Un élément qui ne peut pas être créé (noCreate) doit forcément avoir un ID`)
            okSelf = false
        }

        if(this.nodeDef.allow === 'create' && this.nodeDef.pkNames.length === 1 &&  this.nodeDef.EntityMeta.properties[this.nodeDef.pkNames[0]].autoincrement && !Utils.isNullish(this.pkVals[0])){
            msgArr.push(`${this.fullItemName} - id must be ommited with allow:'create' and a single autoincrement pk`)
            okSelf = false
        }

        if((this.nodeDef.nodeType === 'pk' || this.nodeDef.nodeType === 'pks') && !Utils.isPrimaryKey(this.data, this.nodeDef.pkNames.length > 1) && this.data !== null){
            msgArr.push(`${this.fullItemName} - Item is not an id (nodeType:'${this.nodeDef.nodeType}')`)
            okSelf = false
        }

        if((this.nodeDef.nodeType === 'object' || this.nodeDef.nodeType === 'objects') && !Utils.isObject(this.data) && this.data !== null){
            msgArr.push(`${this.fullItemName} - Item is not an object (nodeType:'${this.nodeDef.nodeType}')`)
            okSelf = false
        }

        if(this.nodeDef.strict && Utils.isObject(this.data)){
            const wrongFields = Object.keys(this.data).filter(fieldName=>!this.nodeDef.allProps.includes(fieldName))
            if(wrongFields.length){
                msgArr.push(`${this.fullItemName} - Champ${wrongFields.length > 1 ? "s" : ""} '${wrongFields.join(', ')}' absent${wrongFields.length > 1? "s" : ""} de la définition de l'entity '${this.nodeDef.EntityClass.name}' (mode strict)`)
                okSelf = false
            }
        }

        if(this.nodeDef.creatable && (this.should('create')  || this.should('indeterminate'))&& Utils.isObject(this.data)){
            const missingFields =this.nodeDef.requiredPropsOnCreate.filter(fieldName=>!Object.keys(this.data).includes(fieldName))
            if(missingFields.length){
                msgArr.push(`${this.fullItemName} - Champ${missingFields.length > 1 ? "s" : ""} '${missingFields.join(', ')}' obligatoire${missingFields.length > 1 ? "s" : ""}`)
                okSelf = false
            }
        }
        
        if(this.nodeDef.updatable && (this.should('update') || this.should('indeterminate')) || Utils.isObject(this.data)){
            const missingFields =this.nodeDef.requiredPropsOnUpdate.filter(fieldName=>!Object.keys(this.data).includes(fieldName))
            if(missingFields.length){
                msgArr.push(`${this.fullItemName} - Champ${missingFields.length > 1 ? "s" : ""} '${missingFields.join(', ')}' obligatoire${missingFields.length > 1 ? "s" : ""}`)
                okSelf = false
            }
        }

        for (const subHandler of this.subHandlers) {
            const [okSub, msgArrSub] = subHandler.verify()
            okSelf = okSelf && okSub
            msgArr.push(...msgArrSub)
        }

        return [okSelf, msgArr]
    }

    async applyDataHooks(){
        if(!this.nodeDef.hooks) return
        for (const hook of this.nodeDef.hooks){
            if(typeof hook === 'string'){
               this.nodeDef.EntityClass.prototype[hook].call(this.data)
            }else{
               this.nodeDef.EntityClass.prototype[hook.name].call(this.data,hook.options)
            }
        }
    }


    async handle() {
        //await this.applyDataHooks()
        await this.tryUpsert()
        this.tryGetReference()
        for (const subHandler of this.subHandlers) {
            await subHandler.handle()
        }
    }



    /**
     * For single pk with autoincrement :
     * Insert an entity if the pk is missing.
     * Update an entity if the pk is present.
     * 
     * For other cases (single relPk | composite pks) :
     * The pks are always present but the record may not exist in the db.
     * try to find -> update if found, create if not founc (not finding is ok)
     * 
     * Note: a case with both relPks and ownPks with autoincrement is not possible (autoincrement set only for single numeric pk ).
     * This is why when there is more than 1 pk, all the pks must be present (update/insert)
     * This is validated at Item.verify()
     */
    private async tryUpsert() {
        if (!this.isObject) return

        // const ownPks = this.nodeDef.pkNames.filter(pkName => !this.nodeDef.entityMeta.relations.some(rel => rel.name === pkName))
        // const relPks = this.nodeDef.pkNames.filter(pkName => this.nodeDef.entityMeta.relations.some(rel => rel.name === pkName))

        if (this.nodeDef.hasSingleAutoincrementPk) {

            if (this.hasMissingSinglePk && this.nodeDef.creatable) {
                await this.createObject()

            } else if (this.nodeDef.updatable) {
                this.entity = await this.findEntity()
                if (!this.entity) throw new Error(`entity ${this.nodeDef.EntityClass.name} with ${this.nodeDef.pkNames}=${this.pkVals} can't be updated because it was not found`)
                await this.updateObject()
            }

        } else {
            this.entity = await this.findEntity()
            if (!this.entity && this.nodeDef.creatable) {
                await this.createObject()
            } else if (this.nodeDef.updatable) {
                await this.updateObject()
            }

        }
    }

    
    should(operationType:'update' | 'create' | 'indeterminate' |'none'):boolean  {
        if (!this.isObject) return 'none' === operationType


        if (this.nodeDef.hasSingleAutoincrementPk) {

            if (this.hasMissingSinglePk && this.nodeDef.creatable) {
               return 'create' === operationType

            } else if (this.nodeDef.updatable) {
                return 'update' === operationType
            }

        } else {
            return (this.nodeDef.creatable || this.nodeDef.updatable) &&  'indeterminate' === operationType
            // this.entity = await this.findEntity()
            // if (!this.entity && this.nodeDef.creatable) {
            //     return 'create'
            // } else if (this.nodeDef.updatable) {
            //     return 'update'
            // }

        }

        return 'none' === operationType
    }



    private async updateObject() {
        //console.log("update de " + this.fullItemName  + " n°" + this.idVal)
    
        wrap(this.entity).assign(this.ownData)
    }

    private async createObject() {
        //eq : wrap(entity).assign(this.nodeData,{em.em, onlyProperties:true});
        //eq ? : const entity =.em.create(this.Entity,this.nodeData)
        //console.log("création de " + this.fullItemName)
        
        this.entity = new this.nodeDef.EntityClass();
        this.em.assign(this.entity, this.ownData)
        this.em.persist(this.entity) //make the entity managed
    }

    private  createSubHandler(def: NodeDef, data: any, parentItem:Item , em: EntityManager<any>): SingletonHandler | CollectionHandler {
        
        if (['id', 'object'].includes(def.nodeType)) {
            return new SingletonHandler(def, data, em, parentItem)
        }else{//'ids', 'objects'
            return new CollectionHandler(def, data, em, parentItem)
        }
    }

}