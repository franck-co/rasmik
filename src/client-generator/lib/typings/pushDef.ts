
import { EntityField, RootEntity, RemoveNever } from './utility';




export const nodeTypes = ['object' , 'pk' , 'objects','pks'] as const
export type NodeType =  typeof nodeTypes[number]

export type AssociationName = 'ManyToOne' | 'OneToMany' | 'ManyToMany' | 'OneToOne';

export const allowOptions = ['ref' , 'upsert' , 'create' , 'update'] as const 
export type AllowOption =  typeof allowOptions[number]  

export const collectionModes = ['ref', 'add' , 'set' , 'remove'] as const 
export type CollectionMode =  typeof collectionModes[number]  

export type AllowProperty = readonly AllowOption[] | AllowOption


type ChildrenMapped<E extends RootEntity> = Partial<{
    [K in keyof E]: E[K] extends Array<infer U> ? 
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