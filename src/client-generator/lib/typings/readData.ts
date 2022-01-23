


import { ExpandProperty, HasCompositePk, PkKeys, ScalarKey, RelationKey } from './utility'
import { ReadDefNode, ReadDefNodeObj } from './readOptions';



export type ReadData<E extends RootEntity, Def extends ReadDefNode<E> = true> = RemoveNever<
    //Populated entitie expliciely in children
    {
    [K in Extract<keyof SafeDef<Def>['children'], keyof E> ]: ExpandProperty<E[K]> extends RootEntity ?
                                                                SafeDef<Def>['children'][K] extends ReadDefNode<ExpandProperty<E[K]>> ? 
                                                                    E[K] extends Array<any> ? 
                                                                    Array<ReadData<ExpandProperty<E[K]>,SafeDef<Def>['children'][K]>>
                                                                    : ReadData<ExpandProperty<E[K]>,SafeDef<Def>['children'][K]> 
                                                                : never 
                                                              : never
    }
    &
    //Not populated => pk always there for OneToOne and ManyToOne 
    {
        [K in Exclude<RelationKey<E>,keyof SafeDef<Def>['children']>]: E[K] extends Array<any> ? never : Primary<E[K]>
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


import { Defined,  Prefix, Suffix, Primary, RootEntity } from './utility';

export type Populated<T, L extends string = never> =  RemoveNever<PopulatedMapped<T, L>>

type PopulatedMapped<T, L extends string = never> = RemoveNever<{
  [K in keyof T]: K extends Prefix<L> ?
      
      //Populated 
      T[K] extends RootEntity ? 

        Populated<Defined<T[K]>, Suffix<L>>
        :T[K] extends Array<infer U> ?
          
             U extends RootEntity ? Array<Populated<Defined<U>, Suffix<L>>> :T[K]
            :T[K]
        

      //Not populated
      :T[K] extends RootEntity ? 

          Primary<T[K]> 
          :T[K]  extends Array<infer U> ? 

              U extends RootEntity ?  
                  never /*Jamais d'array d'id reçus Array<Primary<U>>*/ 
                  : T[K]//'classic array'
              :T[K]//: T[K] //Not loaded ->  primary if entity, or as it is
           
}>

type RemoveNever<T, L extends string = never> = { 
    [K in keyof T as T[K] extends never ? never : K] : T[K]
 }
 



