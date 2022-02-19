import { Collection, FindOptions as StdReadOptions} from '@mikro-orm/core';
import { AutoPath } from '@mikro-orm/core/typings';
import { RemoveNever } from './utility';
import { RootEntity } from './utility';

/** Additional options for rasmik */
// export interface ReadOptions<T, P extends string = never> extends StdReadOptions<T,P> {
//    loadCustom?: AutoPath<T,P>[]; //TODO: type the available hooks //TODO: faire un array d'autopath pour activer les hooks sur les enfants
//    exclude?: AutoPath<T,P>[];
// }

// export interface DeleteOptions<T, P extends string = never> extends ReadOptions<T,P> {
//     failIfNull?:boolean
// }


export interface ReadOptions<E extends RootEntity> extends StdReadOptions<E>, ReadDefNodeObj<E> {}
export interface DeleteOptions<E extends RootEntity> extends StdReadOptions<E>, DeleteDefNodeObj<E> {}


export type ReadDefNodeObj<E extends RootEntity> = {
    include?: readonly (keyof E | '*')[];
    exclude?: readonly (keyof E)[];
    children?: ReadChildren<E>;
    loadCustom?: readonly (keyof E)[];
}
export type DeleteDefNodeObj<E extends RootEntity> = {
    failIfNull?:boolean
    children?: DeleteChildren<E>;
    loadCustom?: readonly (keyof E)[];
}


export type ReadDefNode<E extends RootEntity> = ReadDefNodeObj<E> | true
export type DeleteDefNode<E extends RootEntity> = DeleteDefNodeObj<E> | true


type ReadChildrenMapped<E extends RootEntity> = Partial<{
    [K in keyof E]: E[K] extends Collection<infer U> ? 
                        U extends RootEntity ?  ReadDefNode<U> : never
                        :  E[K] extends RootEntity ?  ReadDefNode<E[K]>  : never
}>
type ReadChildren<E extends RootEntity> = RemoveNever<ReadChildrenMapped<E>>



type DeleteChildrenMapped<E extends RootEntity> = Partial<{
    [K in keyof E]: E[K] extends Collection<infer U> ? 
                        U extends RootEntity ?  DeleteDefNode<U> : never
                        :  E[K] extends RootEntity ?  DeleteDefNode<E[K]>  : never
}>
type DeleteChildren<E extends RootEntity> = RemoveNever<DeleteChildrenMapped<E>>


// export type PopulateFromDef<D extends ReadOptions<any> | DeleteOptions<any>, Px extends '' = never> = readonly (`${Px}.${keyof D['children']}` | D['children'][keyof D['children']])[]