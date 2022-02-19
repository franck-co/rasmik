import {  HasCompositePk, PkKeys, Primary, RootEntity, ScalarKey, RelationKey } from './utility'
import {  RemoveNever } from './utility'
import { RegularExpressionLiteral } from 'ts-morph'
import { ExpandProperty } from '@mikro-orm/core/typings'
import { Collection } from '@mikro-orm/core'

const allowOptions = ['ref' , 'upsert' , 'create' , 'update', 'pk'] as const 
type AllowOption =  typeof allowOptions[number]  

function draftShape(){
    return ({
        fromPushDef:()=>undefined,
        fromReadOptions:()=>undefined,
    })
}


export type DraftDef<E extends RootEntity> = DraftDefObject<E> | DraftDefPk 

export type DraftDefObject <E extends RootEntity> = {
    allow?: Exclude<AllowOption,'pk'>
    required?: readonly (keyof E)[]
    forbidden?: readonly (keyof E)[]
    children?: Children<E>
} | true

export type DraftDefPk = {
    allow:'pk'
}

type Children<E extends RootEntity> = {
    [K in keyof E]: E[K] extends Array<infer U> ? 
                        U extends RootEntity ?  DraftDef<U> : never
                        :  E[K] extends RootEntity ?  DraftDef<E[K]>  : never
}






//Choose between item or array
export type DraftData<E extends RootEntity, Def extends DraftDef<E>, Col = {}> = Col extends Collection<any> ?  Array<DraftDataItem<E,Def>> : DraftDataItem<E,Def>

// Def['nodeType'] extends  'pks' | 'objects' ? Array<PushDataItem<E,Def>> : PushDataItem<E,Def>


/** When not explicitely described in children, relation props are forbidden */
/** When the def is simply 'true' the relation is a required object/objects (ref) */ //TODO implement same for push (=same comportement as for loaded)

//Choose between pk or object
type DraftDataItem<E extends RootEntity, Def extends DraftDef<E>> 
= Def extends DraftDefObject<E> ? DraftDataObject<E,Def> :  DraftDataPK<E> 

//Default def if def is 'true'
type SafeDef<D extends DraftDef<any>> =  D extends  true ? {children:{},allow:'ref', required:undefined,forbidden:[]} : D 



type DraftDataPK<E extends RootEntity> = Primary<E>

type DraftDataObject<E extends RootEntity, Def extends DraftDefObject<E>> = 
//relations
{
    [K in Extract<keyof SafeDef<Def>['children'],keyof E>]: ExpandProperty<E[K]> extends RootEntity ? SafeDef<Def>['children'][K] extends DraftDef<ExpandProperty<E[K]>> ? DraftData<ExpandProperty<E[K]> , SafeDef<Def>['children'][K], E[K] > : never: never
}

& //required own props (apart from pks)
{
    [K in FilteredRequiredScalarKey<E,Def>]-?: E[K]
}

& //optional own props (apart from pks and forbidden)
{
    [K in FilteredOptionalScalarKey<E,Def>]?: E[K]
}

& //required pks (apart from Relation-pk that should be in the def)
{
    [K in   Extract<Exclude<RequiredPkKeys<E, SafeDef<Def>['allow']>,RelationKey<E>>,keyof E> ] : E[K]
}

& //optional pks (for upsert)
{
    [K in   Extract<OptionalPkKeys<E, SafeDef<Def>['allow']>,keyof E> ]? : E[K]
}
& //forbidden 
{
    [K in Extract<ForbiddenKeys<E,Def>,keyof E>]?:never
}

// //test
// &{
//     frbd:ForbiddenKeys<E,Def>
// }

type FilteredRequiredScalarKey<E extends RootEntity, Def extends DraftDefObject<E>> = SafeDef<Def>['required'] extends Array<string> ? Extract<SafeDef<Def>['required'][number],Exclude<ScalarKey<E>,PkKeys<E>>> : never
type FilteredOptionalScalarKey<E extends RootEntity, Def extends DraftDefObject<E>> = SafeDef<Def>['forbidden'] extends Array<string> ? Exclude<Exclude<ScalarKey<E>,PkKeys<E>>,SafeDef<Def>['forbidden'][number]> : Exclude<ScalarKey<E>,PkKeys<E>>
type ForbiddenKeys<E extends RootEntity, Def extends DraftDefObject<E>> = (SafeDef<Def>['forbidden'] extends Array<string> ? SafeDef<Def>['forbidden'][number] : never)
| (SafeDef<Def>['allow'] extends 'create' ? HasCompositePk<E> extends false ? PkKeys<E> : never : never)





type RequiredPkKeys<E extends RootEntity, AL extends AllowOption | undefined>  
= unknown extends AL ? PkKeys<E> : //undefined -> unknown -> ref

AL extends 'create' ? 
    HasCompositePk<E> extends true ?  PkKeys<E> :  never //Pas de pk si pk unique et creation (et autoincrement (pk unique numérique))
: AL extends 'update' | 'ref' | undefined ? PkKeys<E> //nécessaire pour l'update (undefined -> default value is ref)
: AL extends 'upsert' ? 
    HasCompositePk<E> extends true ?  PkKeys<E> :  never
: never

type OptionalPkKeys<E extends RootEntity, AL extends AllowOption | undefined> 
= AL extends 'upsert' ?
HasCompositePk<E> extends true ?  never :  PkKeys<E> 
: never

