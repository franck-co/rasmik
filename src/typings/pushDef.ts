
import { Collection } from '@mikro-orm/core';
import { EntityField, RootEntity, UnionToIntersection, RemoveNever } from './utility';




export const allowOptions = ['ref' , 'upsert' , 'create' , 'update', 'pk'] as const 
export type AllowOption =  typeof allowOptions[number]  

export const collectionModes = ['ref', 'add' , 'set' , 'remove'] as const 
export type CollectionMode =  typeof collectionModes[number] 


type ChildrenMapped<E extends RootEntity> = Partial<{
    [K in keyof E as E[K] extends never ? never : K]: 
    
    E[K] extends Collection<infer U> ? 
        U extends RootEntity ? 
            PushDefNodeObjects<U> | PushDefNodePks<U> 
            : never
        :  E[K] extends RootEntity ?
        PushDefNodeObject<E[K]> | PushDefNodePk<E[K]> 
    : never
}>

type Children<E extends RootEntity> = RemoveNever<ChildrenMapped<E>>


interface PushDefNodeCommon<E extends RootEntity> {
    strict?:boolean
    hooks?:string[] //PushHooks<E>
}


export interface PushDefNodePk <E extends RootEntity>extends PushDefNodeCommon<E>{
    allow:'pk'
}

export interface PushDefNodePks <E extends RootEntity>extends PushDefNodeCommon<E>{
    allow:'pk'
    collectionMode: CollectionMode
    // deleteOrphans?:boolean
}

export interface PushDefNodeObject <E extends RootEntity>extends PushDefNodeCommon<E>{
    allow?: Exclude<AllowOption,'pk'>;
    children?: Children<E>
    include?: readonly EntityField<E>[] 
    exclude?: readonly EntityField<E>[]
}

export interface PushDefNodeObjects <E extends RootEntity>extends PushDefNodeCommon<E>{
    allow?: Exclude<AllowOption,'pk'>;
    collectionMode: CollectionMode
    // deleteOrphans?:boolean
    children?: Children<E>
    include?: readonly EntityField<E>[] 
    exclude?: readonly EntityField<E>[]
}

interface PushDefObjectTop<E extends RootEntity>extends PushDefNodeCommon<E> {
    allow?: Exclude<AllowOption,'pk'>;
    children?: Children<E>
    include?: readonly EntityField<E>[] 
    exclude?: readonly EntityField<E>[]
}


type PushDefObjectsTop<E extends RootEntity> = PushDefNodeObjects<E>

export type PushDefNode<E extends RootEntity> = PushDefNodePk<E> | PushDefNodePks<E> | PushDefNodeObject<E> | PushDefNodeObjects<E> | PushDef<E>
export type PushDef<E extends RootEntity> = PushDefObjectTop<E> | PushDefObjectsTop<E>


// export type PushDef<E extends RootEntity> = PushDefNodePk<E> | PushDefNodePks<E> | PushDefNodeObject<E> | PushDefNodeObjects<E>
export type AnyPushDef = UnionToIntersection<Partial<PushDef<any>>>

