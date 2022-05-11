import { AnyEntity, EntityClass, EntityMetadata } from '@mikro-orm/core';
import { ReadOptions , RootEntity} from '../typings';

export class ReadOptionsHandler {

    constructor(public EntityClass:EntityClass<any>, public options: ReadOptions<any> ){}



    getFindOptions(){
        const {children,loadCustom,exclude,...findOptions} = this.options

        const lazyFields = this.getLazyFields()
        const fields = this.getFields()
        const populate = this.getPopulate(this.options as any)

        findOptions.populate = [...lazyFields, ...populate] as any  //Array.from(new Set([...this.getFields(), ...this.getPopulate(this.options as any)])) as any
        findOptions.fields = [...lazyFields,...fields]

        return findOptions
    }

    getPopulate(node:ReadOptions<any> | true = this.options, currentPath?:string){
        const populate:string[] = []

        if(node === true ||!node.children) return currentPath ? [currentPath] : [];

        
        Object.keys(node.children).forEach(childName=>{
            const childPath = currentPath ? currentPath + '.' + childName : childName
            populate.push(...this.getPopulate(node.children![childName],childPath))
        })

        if(!populate.length && currentPath) populate.push(currentPath)

        return populate
    }

    getFields(node: ReadOptions<any> | true = this.options, meta: EntityMetadata = this.EntityClass.prototype.__meta) {

        //must select all fields with sto
        if (meta.discriminatorMap) {
            return []
        }

        type field = string | { [key: string]: Array<field> }

        const defaultFields = meta.hydrateProps.filter(prop => !prop.lazy  && !(prop.reference === "1:m" || prop.reference === "m:n") && !(prop.reference === '1:1' && !prop.owner)).map(prop => prop.name)  as string[]

        if(node === true) return defaultFields

        const hasIncludeAll = node.include?.some(x => x === '*')
        let include: string[] = (node.include || defaultFields) as any
        const exclude: string[] = (node.exclude || []) as any


        if (hasIncludeAll && node.include) {
            for (const field of defaultFields) {
                if (include.indexOf(field) === -1)
                    include.push(field)
            }
        }

        const allLazyFields = meta.hydrateProps.filter(prop=>prop.lazy).map(prop => prop.name)
        include = include.filter(x => x !== '*' && !allLazyFields.includes(x))

        const fields: field[] = include.filter(field => !exclude.includes(field))


        Object.keys(node.children || {}).forEach(childPropName=>{

            const childMeta = meta.relations?.find(rel => rel.name === childPropName)?.targetMeta?.class?.prototype.__meta
            const childFields = this.getFields(node.children![childPropName], childMeta)
            const chainedChildFields = childFields?.map(field=>`${childPropName}.${field}`) || []
            fields.push(...chainedChildFields)
        })
      
        return fields
    }

    //The order of the fields in populate is important. lazy fields on child entities are ignored if not at the beginnig of the populate array
    getLazyFields(node: ReadOptions<any> | true = this.options, meta: EntityMetadata = this.EntityClass.prototype.__meta) {

        //must select all fields with sto
        if (meta.discriminatorMap) {
            return []
        }

        const allLazyFields = meta.hydrateProps.filter(prop=>prop.lazy).map(prop => prop.name)

        type field = string | { [key: string]: Array<field> }

        const defaultFields = []  as string[]

        if(node === true) return []

        let include: string[] = (node.include || []) as any 
        const exclude:string[] = (node.exclude || []) as any

        include = include.filter(x=>x !== '*') 

        const lazyFields :field[] = include.filter(field => !exclude.includes(field) && allLazyFields.includes(field))


        Object.keys(node.children || {}).forEach(childPropName=>{

            const childMeta = meta.relations?.find(rel => rel.name === childPropName)?.targetMeta?.class?.prototype.__meta
            const childFields = this.getLazyFields(node.children![childPropName], childMeta)
            const chainedChildFields = childFields?.map(field=>`${childPropName}.${field}`) || []
            lazyFields.push(...chainedChildFields)
        })
      
        return lazyFields
    }
}



// getPopulateFromChildren(def: AnyPushDef = {}) {
//     const pop: string[] = [];
//     if (!def.children) return pop;
  
//     for (const childName in def.children) {
//       const subPop = this.getPopulateFromChildren(def.children[childName] as AnyPushDef);
  
//         const subPopJoined = subPop.length ? subPop.map((d) => childName + "." + d) : [childName];
//       pop.push(...subPopJoined);
  
//     }
  
//     return pop;
//   }