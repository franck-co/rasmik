
import { Collection } from '@mikro-orm/core';
import { EntityField, RootEntity, UnionToIntersection, RemoveNever } from './utility';




export const nodeTypes = ['object' , 'pk' , 'objects','pks'] as const
export type NodeType =  typeof nodeTypes[number]

export type AssociationName = 'ManyToOne' | 'OneToMany' | 'ManyToMany' | 'OneToOne';

export const allowOptions = ['ref' , 'upsert' , 'create' , 'update'] as const //'keepOrphans' , 'removeOrphans' , 'deleteOrphans'
export type AllowOption =  typeof allowOptions[number]  //=keepOrphans (push new)

export const collectionModes = ['ref', 'add' , 'set' , 'remove'] as const //'keepOrphans' , 'removeOrphans' , 'deleteOrphans'
export type CollectionMode =  typeof collectionModes[number]  //=keepOrphans (push new)

export type AllowProperty = readonly AllowOption[] | AllowOption


type ChildrenMapped<E extends RootEntity> = Partial<{
    [K in keyof E as E[K] extends never ? never : K]: E[K] extends Collection<infer U> ? 
                        U extends RootEntity ? 
                            PushDefNodeObjects<U> | PushDefNodePks<U> 
                            : never
                        :  E[K] extends RootEntity ?
                        PushDefNodeObject<E[K]> | PushDefNodePk<E[K]> 
                        : never
}>

type Children<E extends RootEntity> = RemoveNever<ChildrenMapped<E>>


interface PushDefNodeCommon<E extends RootEntity> {
    nodeType: NodeType
    allow?: AllowOption;
    strict?:boolean
    hooks?:string[] //PushHooks<E>
}


export interface PushDefNodePk <E extends RootEntity>extends PushDefNodeCommon<E>{
    nodeType: 'pk'
    allow?:'ref'
}

export interface PushDefNodePks <E extends RootEntity>extends PushDefNodeCommon<E>{
    nodeType: 'pks' 
    allow?:'ref'
    collectionMode: CollectionMode
    deleteOrphans?:boolean
}

export interface PushDefNodeObject <E extends RootEntity>extends PushDefNodeCommon<E>{
    nodeType: 'object' 
    children?: Children<E>
    include?: readonly EntityField<E>[] 
    exclude?: readonly EntityField<E>[]
}

export interface PushDefNodeObjects <E extends RootEntity>extends PushDefNodeCommon<E>{
    nodeType: 'objects' 
    collectionMode: CollectionMode
    deleteOrphans?:boolean
    children?: Children<E>
    include?: readonly EntityField<E>[] 
    exclude?: readonly EntityField<E>[]
}

export type PushDef<E extends RootEntity> = PushDefNodePk<E> | PushDefNodePks<E> | PushDefNodeObject<E> | PushDefNodeObjects<E>
export type AnyPushDef = UnionToIntersection<Partial<PushDef<any>>>



















// type ChildEntities<E extends RootEntity> = {
//     [K in keyof E]: E[K] extends RootEntity ? E[K] 
//                                             : E[K] extends Array<infer U> ? 
//                                                 U extends RootEntity ? U //en fonction de array ou non, faire un node collection ou un node item !!$£€
// }



// type Children<E extends RootEntity> = Partial<{
//     [K in keyof E]: E[K] extends Array<infer U> ? 
//                         U extends RootEntity ? 
//                             PushDefNodeCollection<U> 
//                             : never
//                         :  E[K] extends RootEntity ?
//                         PushDefNodeItem<E[K]>
//                         : never
// }>



// interface PushDefNodeCommon<E extends RootEntity, NT extends Readonly<NodeType> > {
//     readonly nodeType: NT
//     allow?: AllowOption;
//     required?:boolean
//     strict?:boolean
//     hooks?:string[] //PushHooks<E>
// }

// // interface PushDefNodeItem<E extends RootEntity>  extends PushDefNodeCommon<E>{
// //     readonly nodeType: 'item' | 'object' | 'pk' 
// // }


// // interface PushDefNodeCollection <E extends RootEntity> extends PushDefNodeCommon<E>{
// //     readonly nodeType: 'collection' | 'objects' | 'pks'
// //     collectionMode: CollectionMode
// //     deleteOrphans:boolean
// // }


// interface PushDefNodePk <E extends RootEntity, NT extends Readonly<'pk' | 'item'>>extends PushDefNodeCommon<E,NT>{
//     readonly nodeType: NT
//     allow?:'ref'
// }

// interface PushDefNodePks <E extends RootEntity, NT extends Readonly<'pks' | 'collection'>>extends PushDefNodeCommon<E,NT>{
//     readonly nodeType: NT
//     allow?:'ref'
//     collectionMode: CollectionMode
//     deleteOrphans:boolean
// }

// interface PushDefNodeObject <E extends RootEntity, NT extends Readonly<'object'  | 'item'>>extends PushDefNodeCommon<E,NT>{
//     readonly nodeType: NT
//     children?: Children<E>
//     include?: readonly EntityField<E>[] 
//     exclude?: readonly EntityField<E>[]
// }

// interface PushDefNodeObjects <E extends RootEntity, NT extends Readonly<'objects' | 'collection'>>extends PushDefNodeCommon<E,NT>{
//     readonly nodeType: NT
//     collectionMode: CollectionMode
//     deleteOrphans:boolean
//     children?: Children<E>
//     include?: readonly EntityField<E>[] 
//     exclude?: readonly EntityField<E>[]
// }

// type PushDefNodeUnion<E extends RootEntity, NT extends Readonly<NodeType>> 
// = NT extends 'pk' ?  PushDefNodePk<E,NT>  
// : NT extends 'object' ? PushDefNodeObject<E,NT> 
// : NT extends 'item' ? PushDefNodePk<E,NT> |  PushDefNodeObject<E,NT> 
// : NT extends 'pks' ? PushDefNodePks<E,NT>  
// : NT extends 'objects' ? PushDefNodeObjects<E,NT>  
// : NT extends 'collection' ? PushDefNodeObjects<E,NT> |PushDefNodePks<E,NT>  
// : never


// //type PushData<E, Def> = ... 

// async function push<E extends RootEntity,NT extends Readonly<NodeType>, Def extends Readonly<PushDefNodeUnion<E,NT>>>(entity: EntityClass<E>, def:Def):Promise<Def>{
//     return ' 'as any
// }



// const def = await push(Teacher, {
//     nodeType:'pks',
//     // exclude:['iban'],
//     collectionMode:'add',
//     deleteOrphans:false,
//     /*children:{
//        Candidature:{
//            nodeType:'pk',
//            allow:'ref',
//        },
//        Addresses:{
//            nodeType:'collection',
//            collectionMode:'set',
//            deleteOrphans:false,
//            exclude:['coordinates'],
//            children:{
//                Family:{
//                    nodeType:'item',

//                }
//            }
//        }
//     }  */
// })

// type t = typeof def






// interface Node<A,B,C,D>{
//     readonly a:A
//     readonly b:B
//     c:C
//     d:D
//     child?:Readonly<Node<A,B,C,D>
// }


// function test<A extends Readonly<string>,B,C,D>(node:Node<A,B,C,D>):Node<A,B,C,D>{
//     return null as any
// }


// const r = test({a:'AAA',b:'BBB',c:'CCC',d:'DDD',child:{a:'111', b:'222',c:'333',d:'444'}})



// let p:typeof r.child extends Node<infer A,infer B,infer C,infer D> ? Node<A,B,C,D> : never
































// import * as Entities from '../entities'
// import { EntityClass, RootEntity } from '.';
// import {Endpoints} from '../endpoints'
// import { AnyEntity, Dictionary, FilterQuery, LoadStrategy, QueryFlag, QueryOrderMap } from  "./mikroOrmTypes";
// import { Teacher } from 'core/services/rasmikClient';

// // type entityName = keyof typeof Entities
// // type Entity<EN extends entityName> = Extract<typeof Entities[EN],new(...args)=> any>['prototype']


// type Without<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>




// type EntityField<E> = keyof E
// type AnyChildren<P extends AnyEntity= AnyEntity> =  Array<pushDefNodeChild<AnyEntity,P,AnyChildren>>

// interface pushDefNode<E extends AnyEntity ,C extends Array<pushDefNodeChild<AnyEntity,E,any>> = AnyChildren<E>> /*extends Array<pushDefNodeChild<any,[never]>> = [pushDefNodeChild<AnyEntity>]*/ {
//     nodeType: nodeType

//     entityName: entityName
//     children?: C //(C extends pushDefNodeChild<infer CE> ? pushDefNodeChild<CE> : never )[]

//     include?: EntityField<E>[] //EntityField<Entity<EN>>[];
//     exclude?:  EntityField<E>[]

//     allow?: allowOption;

//     collectionMode?: collectionMode
//     deleteOrphans?:boolean

//     idName?: string

//     required?:boolean
//     strict?:boolean
//     hooks?:string[]
// }

// type pushDefNodeTop<E extends AnyEntity,C extends Array<pushDefNodeChild<AnyEntity,E,any>> = AnyChildren<E>> = Without<pushDefNode<E,C>,'entityName' | 'nodeType' | 'deleteOrphans'>

// interface pushDefNodeChild<E extends AnyEntity, P  extends AnyEntity, C extends Array<pushDefNodeChild<AnyEntity,E,any>>> extends pushDefNode<E,C>{
//     propertyName: EntityField<P>
// }
// export type pushDef<E extends AnyEntity,C extends Array<pushDefNodeChild<AnyEntity,E,any>> = AnyChildren<E>> = pushDefNodeTop<E,C>

