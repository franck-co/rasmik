import { EntityClass, EntityMetadata } from '@mikro-orm/core'
import { AllowOption, allowOptions, AnyPushDef, CollectionMode, collectionModes, PushDef, UnionToIntersection } from '../typings'

export const nodeTypes = ['object' , 'pk' , 'objects','pks'] as const
export type NodeType =  typeof nodeTypes[number]
/** 
 * Sets the def defaults
 * Valiate the def
 * 
 */

export class NodeDef {

        //push def props
        allow!: AllowOption
        nodeType!: NodeType
        children!: Record<string,AnyPushDef>
        include: string[] = ['*'];
        exclude: string[] = [];
        hooks!: (string | {name:string,options:any})[]
        collectionMode?: CollectionMode
        deleteOrphans!: boolean
        strict!: boolean     
        required: boolean = true //Peut être inutile
    
    
        //entity info
        EntityClass: any;
        EntityMeta:EntityMetadata
        pkNames: string[]
    
    
        //parent info
        propertyName?: string | null
        upperDef?: NodeDef | null
    
        
        //children info
        subDefs: NodeDef[] = []


    constructor(EntityClass:EntityClass<any>, nodeDefRaw: AnyPushDef,type:'coll' | 'single', upperDef?: NodeDef, propertyName?:string) {

        //init pushdef props
        this.initDef(nodeDefRaw)

        //init parent info
        this.upperDef = upperDef || null
        this.propertyName = propertyName || null

        //Init entity info
        this.EntityClass = EntityClass
        this.EntityMeta = this.EntityClass.prototype.__meta
        this.pkNames = this.EntityMeta.primaryKeys

        if(this.allow === 'pk'){
            this.nodeType = type === 'coll' ? 'pks' : 'pk'
        }else{
            this.nodeType = type === 'coll' ? 'objects' : 'object'
        }
    }

    private initDef(nodeDefRaw: AnyPushDef = {}){
        const {allow,children,collectionMode,/*deleteOrphans,*/exclude,hooks,include,strict} = nodeDefRaw
        this.allow = allow || 'ref';
        // this.nodeType = nodeType as any as NodeType
        this.children = children as any || {}
        this.collectionMode = collectionMode || 'ref'
        // this.deleteOrphans = deleteOrphans || false
        this.exclude = exclude as string[] || []
        this.include = include as string[] || []
        this.hooks = hooks || []
        this.strict = (strict === false) ? false : true
    }

    /** create new NodeDef for each child and store them in this.subDefs */
    initSubs() {
        for (const childPropKey in this.children){
            const ChildEntityClass = this.EntityMeta?.properties[childPropKey]?.targetMeta?.class
            const childDef = this.children[childPropKey]
            const reference =  this.EntityMeta?.properties[childPropKey]?.reference
            const type = (reference === "1:m" || reference === "m:n") ? 'coll' : 'single'
            const subDef = new NodeDef(ChildEntityClass!,childDef, type,this, childPropKey)
            subDef.initSubs()
            this.subDefs.push(subDef)
        }
    }

    initNodeType(){
        
    }


    get isTop(): boolean {
        return !this.upperDef
    }

    get allProps(): string[] {
        return Object.keys(this.EntityMeta.properties)
    }

    get ownProps(): string[] {


        return Object.keys(this.EntityMeta.properties).reduce<string[]>((acc, key) => {
            if(this.EntityMeta.properties[key].reference === 'scalar'  || this.EntityMeta.properties[key].reference === 'embedded') acc.push(key);
            else if(this.EntityMeta.properties[key].primary) acc.push(key); //rel pk
            return acc
        }, [])
    }


    get requiredPropsOnCreate(): string[] {


        return Object.keys(this.EntityMeta.properties).reduce<string[]>((acc, key) => {
            const prop = this.EntityMeta.properties[key];

            //all non nullable scalar without default are required
            if ((prop.reference === 'scalar' || prop.reference === 'embedded')
                && (prop.default===undefined)
                && (prop.defaultRaw===undefined)
                && !prop.nullable
                && !prop.autoincrement 
                && !(prop.persist === false)
            ) { acc.push(key); }

            //allRel pks are required
            else if( prop.reference !== 'scalar' && prop.reference !== 'embedded'&& prop.primary){
                acc.push(key);
            }

            //for composite pk, all pks are required
            else if(this.EntityMeta.primaryKeys.length > 1 && prop.primary){
                acc.push(key);
            }

            return acc
        }, [])

    }

    get requiredPropsOnUpdate(): string[] {


        return Object.keys(this.EntityMeta.properties).reduce<string[]>((acc, key) => {
            const prop = this.EntityMeta.properties[key];

            //all pks are required
            if(  prop.primary){
                acc.push(key);
            }

            return acc
        }, [])

    }

    get filteredOwnProps(): string[] {
        const included = (this.include && this.include.length && !this.include.includes('*')) ? this.ownProps.filter(p => this.include.includes(p)) : this.ownProps
        const excluded = (this.exclude && this.exclude.length && !this.exclude.includes('none')) ? this.ownProps.filter(p => !this.exclude.includes(p)) : included
        return excluded
    }


    get nodeName(): string {
        return this.propertyName || this.EntityClass.name || '???'
    }
//<|><><|><><|><><|><><|><><|><><|><><|><><|><><|><><|><><|><><|><><|><><|><><|><><|><><|><><|><><|><><|><><|><><|><><|><><|><><|><><|><><|><><|><><|><><|><><|><><|><><|><><|><><|><><|><><|><><|><><|><><|><><|><><|><><|><><|><><|><><|><><|><><|><><|><><|><><|><><|>
    get fullNodeName(): string {
        return `${this.upperDef ? this.upperDef.fullNodeName + '.' : "|>"}${this.nodeName}`
    }

    get updatable() { return this.allow.includes('update') || this.allow.includes('upsert') }
    get creatable() { return this.allow.includes('create') || this.allow.includes('upsert') }


    get hasSinglePk (){ return this.pkNames.length === 1 }
    get hasSingleAutoincrementPk (){ return this.hasSinglePk && this.EntityMeta.properties[this.pkNames[0]].autoincrement }
    //get hasMissingSinglePk (){ return this.pkNames.length === 1 }


    verify():[boolean,string[]]{
        //console.log("Vérification de la def " + this.fullNodeName)
    
        let okSelf = true
        const msgArr = []
    
       
        // //common to all nodes
        // if(!this.entityName){
        //     msgArr.push(`${this.fullNodeName} - Missing entityName`)
        //     okSelf = false
        // }
        // else if( !this.EntityClass){
        //     msgArr.push(`${this.fullNodeName} - Entity '${this.entityName}' not found in the definition files`)
        //     okSelf = false
        // }
   
        if(!(allowOptions.includes(this.allow))){
            msgArr.push(`${this.fullNodeName} -  Wrong allow option '${this.allow}'`)
            okSelf = false
        }

        if(!(nodeTypes.includes(this.nodeType))){
            msgArr.push(`${this.fullNodeName} -  Wrong nodeType '${this.nodeType}'`)
            okSelf = false
        }

        if( ['pks','objects'].includes(this.nodeType) && !collectionModes.includes(this.collectionMode!)){
            msgArr.push(`${this.fullNodeName} - Missing or wrong collection mode '${this.collectionMode}'`)
            okSelf = false
        }
    
        if(!this.required && this.children?.length && this.subDefs.some(sd=>sd.required)){
            msgArr.push(`${this.fullNodeName} - Le noeud est marqué comme non required mais a des enfants required`)
            okSelf = false
        }

        if (this.hooks) {
            const arr = []
            for (const hook of this.hooks) {
                const name = (typeof hook === 'string') ? hook : hook.name
                if (!(typeof this.EntityClass.prototype[name] === 'function')) arr.push(name)
            }
            if (arr.length) {
                msgArr.push(`${this.fullNodeName} - Unknown hooks '${arr.join(', ')}'`)
                okSelf = false
            }
        }


         //specific to child node
         if(!this.isTop && !this.upperDef!.EntityMeta.relations.some(rel=>rel.name === this.propertyName)){
            msgArr.push(`${this.propertyName} not a relation of ${this.upperDef!.fullNodeName}`)
            okSelf = false
        }

        for (const subDef of this.subDefs) {
            subDef.initSubs()
            const [okSub, msgArrSub] = subDef.verify()
            okSelf = okSelf && okSub
            msgArr.push(...msgArrSub)
        }

        // if(this.nodeDef.hooks.forEach(h=>) && !this.data){
        //     msgArr.push(`${this.fullItemName} - Node défini dans la pushDef mais n'est pas dans les données (Ignore this check with required=false)`)
        //     okSelf = false
        // }


    
        return [okSelf, msgArr]
    }


}

