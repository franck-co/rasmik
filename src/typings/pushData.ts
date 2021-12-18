import {  HasCompositePk, PkKeys, Primary, RootEntity, ScalarKey, RelationKey } from './utility'
import { AllowOption, PushDefNodeObject, PushDefNodeObjects, PushDefNodePk, PushDefNodePks, PushDef,PushDefNode } from './pushDef'
import { ExpandProperty } from '@mikro-orm/core/dist/typings'
import { Collection } from '@mikro-orm/core'

export type PushData<E extends RootEntity, Def extends PushDefNode<E>, Col = {}> 
= Col extends Collection<any> ?  Array<PushDataItem<E,Def>> : PushDataItem<E,Def>





type PushDataItem<E extends RootEntity, Def extends PushDefNode<E>> 
= Def extends  PushDefNodePk<E> |PushDefNodePks<E> ? PushDataPK<E,Def>
: Def extends  PushDefNodeObject<E> |  PushDefNodeObjects<E> ? PushDataObject<E,Def>
: never


type PushDataPK<E extends RootEntity, Def extends PushDefNodePk<E> |PushDefNodePks<E>> = Primary<E>


type PushDataObject<E extends RootEntity, Def extends PushDefNodeObject<E> |  PushDefNodeObjects<E> > = 
{
    [K in Extract<keyof Def['children'],keyof E>]: ExpandProperty<E[K]> extends RootEntity ? Def['children'][K] extends  PushDefNode<ExpandProperty<E[K]>> ? PushData<ExpandProperty<E[K]> , Def['children'][K],E[K] > : never: never
}
&
//own props (apart from pks)
{
    [K in Exclude<ScalarKey<E>,PkKeys<E>>]?: E[K]
}

& //required pks (apart from Relation-pk that should be in the def)
{
    [K in   Extract<Exclude<RequiredPkKeys<E, Def['allow']>,RelationKey<E>>,keyof E> ] : E[K]
}
& //optional pks
{
    [K in   Extract<OptionalPkKeys<E, Def['allow']>,keyof E> ]? : E[K]
}



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

