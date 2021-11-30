import { ExpandProperty } from '@mikro-orm/core/dist/typings';
import {PrimaryKeyType} from '@mikro-orm/core'
export const EntitySymbol: unique symbol = Symbol()
export class RootEntity {private [EntitySymbol]?:any}

export const PrimaryKeyNames: unique symbol = Symbol()
export {PrimaryKeyType}

export declare type Dictionary<T = any> = {
    [k: string]: T;
};


export type EntityClass<Proto extends object> = (new (...args:any[])=>Proto) & {path:string}


export declare type Scalar = boolean | number | string | bigint | symbol | Date | RegExp | Buffer | {
    toHexString(): string;
};
export declare type ExpandScalar<T> = null | (T extends string ? string | RegExp : T extends Date ? Date | string : T);



/** Added ? tokens for client */
export type Primary<T> = T extends {
    [PrimaryKeyType]: infer PK;
} ? ReadonlyPrimary<PK> : T extends {
    _id?: infer PK;
} ? ReadonlyPrimary<PK> | string : T extends {
    uuid?: infer PK;
} ? ReadonlyPrimary<PK> : T extends {
    id?: infer PK;
} ? ReadonlyPrimary<PK> : never;

type ReadonlyPrimary<T> = T extends any[] ? Readonly<T> : T;




/** First word in a populaet path */
export type Prefix<K> = K extends `${infer S}.${string}` ? S : K;

/** Rest of the populate path - the P for the children */
export type Suffix<K> = K extends `${string}.${infer S}` ? S : never;

/** Remove undefined props*/
export type Defined<T> = Exclude<T, undefined>;




/** Array and non array on the same level */
// export declare type ExpandProperty<T> =  T extends (infer U)[] ? NonNullable<U> : NonNullable<T>;

/** 
 * Paths
 * E est l'objet de base 
 * P le chemin déjà renseigné
 * AutoPath va proposer la suite du chemin
 * Pour que la proposition soit dynamique, P doit nécessairement être un type parameter d'une fonction
 * (C'est pourquoi FindOptions a pour parametres l'entity et P)
*/

export type StringKeys<T> = T extends Array<infer I> ? `${Exclude<keyof I, symbol>}` : `${Exclude<keyof T, symbol>}` 
export type GetStringKey<T, K extends StringKeys<T>> = K extends keyof T ? T[K] : never;

export declare type AutoPath<E, P extends string> = P extends any ? (P & `${string}.` extends never ? P : P & `${string}.`) extends infer Q ? Q extends `${infer A}.${infer B}` ? A extends StringKeys<E> ? `${A}.${AutoPath<Defined<GetStringKey<E, A>>, B>}` : never : Q extends StringKeys<E> ? (Defined<GetStringKey<E, Q>> extends unknown ? Exclude<P, `${string}.`> : never) | (StringKeys<Defined<GetStringKey<E, Q>>> extends never ? never : `${Q}.`) : StringKeys<E> : never : never;
export type AutoPathDyn = <E,P extends string>(entity:E, path:AutoPath<E,P>)=>AutoPath<E,P>
export type AutoPathsDyn = <E,P extends string>(entity:E, path:AutoPath<E,P>[])=>AutoPath<E,P>[]



export  type FieldsMap<T, P extends string = never> = {
    [K in keyof T]?: EntityField<ExpandProperty<T[K]>>[];
};
export  type EntityField<T, P extends string = never> = keyof T | AutoPath<T, P> | FieldsMap<T, P>;







/* -------------------- CUSTOM UTILIIES ------------------ */
export type IsEntity<T> = T extends RootEntity ? true : false


export type  PkKeys<E extends RootEntity> = E extends {
    [PrimaryKeyNames]: infer PKK;
} ? PKK 

: Extract<keyof E,'id' | 'uuid' | '_id'>




export type UnionToIntersection<U> =  (U extends any ? (k: U)=>void : never) extends ((k: infer I)=>void) ? I : never 

export type IsUnion<Key> =
    // If this is a simple type UnionToIntersection<Key> will be the same type, otherwise it will an intersection of all types in the union and probably will not extend `Key`
    [Key] extends [UnionToIntersection<Key>] ? false : true; 

export    type HasCompositePk<E extends RootEntity> = IsUnion<PkKeys<E>>

export  type RelationKey<E extends RootEntity> = {
    [K in keyof E]-?: ExpandProperty<E[K]> extends RootEntity ? K : never
}[keyof E];

export  type ScalarKey<T extends RootEntity> = Exclude<keyof T, RelationKey<T>>

export type RemoveNever<T, L extends string = never> = { 
    [K in keyof T as T[K] extends never ? never : K] : T[K]
 }

export type _Ignored_<A=any,B=any,C=any,D=any,E=any,F=any,G=any,H=any,I=any,J=any,K=any,L=any,M=any,N=any,O=any,P=any,Q=any,R=any,S=any,T=any,U=any,V=any,W=any,X=any,Y=any,Z=any> = A & any 

