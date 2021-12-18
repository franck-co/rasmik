import {  HasCompositePk, PkKeys, Primary, RootEntity, ScalarKey, RelationKey } from './utility'
import { ExpandProperty } from '@mikro-orm/core/dist/typings'



export type PickDef<E extends RootEntity> = PickDefObject<E> //| PickDefPk 

export type PickDefObject <E extends RootEntity> = {
    type?: 'object'
    required?: readonly (keyof E)[]
    optional?: readonly (keyof E)[]
    children?: Children<E>
}

export type PickDefPk = {
    type:'pk'
}

type Children<E extends RootEntity> = {
    [K in keyof E]: E[K] extends Array<infer U> ? 
                        U extends RootEntity ?  PickDef<U> : never
                        :  E[K] extends RootEntity ?  PickDef<E[K]>  : never
}






//Choose between item or array
export type PickData<E extends RootEntity, Def extends PickDef<E>, Arr = {}> = Arr extends Array<any> ?  Array<PickDataItem<E,Def>> : PickDataItem<E,Def>

// Def['nodeType'] extends  'pks' | 'objects' ? Array<PushDataItem<E,Def>> : PushDataItem<E,Def>


/** When not explicitely described in children, relation props are forbidden */
/** When the def is simply 'true' the relation is a required object/objects (ref) */ //TODO implement same for push (=same comportement as for loaded)

//Choose between pk or object
type PickDataItem<E extends RootEntity, Def extends PickDef<E>> 
= Def extends PickDefObject<E> ? PickDataObject<E,Def> :  PickDataPK<E> 

//Default def if def is 'true'
type SafeDef<D extends PickDef<any>> =  D extends  true ? {children:{},type:'objet', required:undefined,opional:undefined} : D 



type PickDataPK<E extends RootEntity> = Primary<E>

type PickDataObject<E extends RootEntity, Def extends PickDefObject<E>> = 
//relations
{
    [K in Extract<keyof SafeDef<Def>['children'],keyof E>]: ExpandProperty<E[K]> extends RootEntity ? SafeDef<Def>['children'][K] extends PickDef<ExpandProperty<E[K]>> ? PickData<ExpandProperty<E[K]> , SafeDef<Def>['children'][K], E[K] > : never: never
}

& //required own props (apart from pks)
{
    [K in FilteredRequiredScalarKey<E,Def>]-?: E[K]
}

& //optional own props (apart from pks and forbidden)
{
    [K in FilteredOptionalScalarKey<E,Def>]?: E[K]
}


// //test
// &{
//     frbd:ForbiddenKeys<E,Def>
// }

type FilteredRequiredScalarKey<E extends RootEntity, Def extends PickDefObject<E>> = SafeDef<Def>['required'] extends Array<string> ? Extract<SafeDef<Def>['required'][number],ScalarKey<E>> : never
type FilteredOptionalScalarKey<E extends RootEntity, Def extends PickDefObject<E>> = SafeDef<Def>['optional'] extends Array<string> ? Extract<SafeDef<Def>['optional'][number],ScalarKey<E>> : never
