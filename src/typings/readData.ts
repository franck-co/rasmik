import { Collection, Loaded } from '@mikro-orm/core';
import { ExpandProperty } from '@mikro-orm/core/dist/typings';
import { RemoveNever } from '.';
import { ReadDefNode } from './readOptions';
import { Primary, RootEntity, ScalarKey, RelationKey } from './utility'






/* -- ReadData (Pojo) -- */
export type ReadData<E extends RootEntity, Def extends ReadDefNode<E> = true> = RemoveNever<
    //Populated entitie expliciely in children
    {
    [K in Extract<keyof SafeDef<Def>['children'], keyof E> ]: ExpandProperty<E[K]> extends RootEntity ?
                                                                SafeDef<Def>['children'][K] extends ReadDefNode<ExpandProperty<E[K]>> ? 
                                                                    E[K] extends Collection<any> ? 
                                                                    Array<ReadData<ExpandProperty<E[K]>,SafeDef<Def>['children'][K]>>
                                                                    : ReadData<ExpandProperty<E[K]>,SafeDef<Def>['children'][K]> 
                                                                : never 
                                                              : never
    }
    &
    //Not populated => pk always there for OneToOne and ManyToOne 
    {
        [K in Exclude<RelationKey<E>,keyof SafeDef<Def>['children']>]: E[K] extends Collection<any> ? never : Primary<E[K]>
    }
    &
    {
        [K in  FilteredKeys<E,Def> ]: E[K]
    }>

type CludeArrayVals<T extends (Readonly<Array<any>> | undefined)> = unknown extends T  ? never : T extends Required<T> ? T[number] : never


type FilteredKeys<E extends RootEntity, Def extends ReadDefNode<E>> =  Def extends true ?  ScalarKey<E> : unknown extends SafeDef<Def>['include']? 
Exclude<ScalarKey<E>,CludeArrayVals<SafeDef<Def>['exclude']>>
:Exclude<Extract<FinalInclude<E,CludeArrayVals<SafeDef<Def>['include']>>,ScalarKey<E>>,CludeArrayVals<SafeDef<Def>['exclude']>>


// type SafeDef<D extends ReadDefNode<any>> = D extends ReadDefNode<infer E> ? D extends  true ? ReadDefNodeObj<E> : D : "never"
type SafeDef<D extends ReadDefNode<any>> =  D extends  true ? {children:undefined,exclude:undefined, include:undefined,loadCustom:undefined} : D 


type FinalInclude<E extends RootEntity,I> =   '*' extends I ? Exclude<I | ScalarKey<E>,'*'> : I


/* -- ReadLoaded (entities) -- */
export type ReadLoaded<E extends RootEntity, Def extends {} = true> = Loaded<E,Paths<SafeDef<Def>>>

declare type Defined<T> = Exclude<T, undefined>;

type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, ...0[]]

type Join<K, P> = K extends string | number ?
    P extends string | number ?
    `${K}${"" extends P ? "" : "."}${P}`
    : never : never;

type Paths<T, D extends number = 10> = [D] extends [never] ? never : Children<T> extends object ?
    { [K in keyof Children<T>]-?: K extends string | number ?
        `${K}` | Join<K, Paths<Children<T>[K], Prev[D]>>
        : never
    }[keyof Children<T>] : ""

type Children<Def> = Def extends {children:infer U} ? U : never




