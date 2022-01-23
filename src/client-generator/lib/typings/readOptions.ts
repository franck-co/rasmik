import { ExpandProperty, Dictionary,  RootEntity, RemoveNever,ScalarKey } from './utility';
import {QBFilterQuery} from './filterQuery'

interface StdReadOptions<E extends RootEntity> {
    //populate?: readonly AutoPath<T, P>[] | boolean;
    orderBy?: QueryOrderMap<E> | QueryOrderMap<E>[];
    cache?: boolean | number | [string, number];
    limit?: number;
    offset?: number;
    refresh?: boolean;
    convertCustomTypes?: boolean;
    disableIdentityMap?: boolean;
    //fields?: readonly EntityField<T, P>[];
    schema?: string;
    flags?: QueryFlag[];
    groupBy?: string | string[];
    having?: QBFilterQuery<E>;
    strategy?: LoadStrategy;
    filters?: Dictionary<boolean | Dictionary> | string[] | boolean;
    //lockMode?: Exclude<LockMode, LockMode.OPTIMISTIC>;
    //lockTableAliases?: string[];
    //ctx?: Transaction;
}




export type ReadDefNodeObj<E extends RootEntity> = {
    include?: readonly (keyof E | '*')[];
    exclude?: readonly (keyof E)[];
    children?: Children<E>;
    loadCustom?: Array<string>;
}
export type ReadDefNode<E extends RootEntity> = ReadDefNodeObj<E> | true

type ChildrenMapped<E extends RootEntity> = Partial<{
    [K in keyof E]: E[K] extends Array<infer U> ? 
                        U extends RootEntity ?  ReadDefNode<U> : never
                        :  E[K] extends RootEntity ?  ReadDefNode<E[K]>  : never
}>
type Children<E extends RootEntity> = RemoveNever<ChildrenMapped<E>>


/** Additional options for rasmik */
export interface ReadOptions<E extends RootEntity> extends StdReadOptions<E>, ReadDefNodeObj<E> {}

export declare type LoadStrategy  = "select-in" | "joined"


export declare type QueryFlag = "DISTINCT" | "PAGINATE" | "UPDATE_SUB_QUERY" | "DELETE_SUB_QUERY" | "CONVERT_CUSTOM_TYPES" | "INCLUDE_LAZY_FORMULAS" | "AUTO_JOIN_ONE_TO_ONE_OWNER"

declare type QueryOrder = "asc" | "asc nulls last" | "asc nulls first" | "desc" | "desc nulls last" | "desc nulls first"

declare type QueryOrderNumeric = 1 | (-1)

export declare type QueryOrderKeysFlat = QueryOrder | QueryOrderNumeric
export declare type QueryOrderKeys<T> = QueryOrderKeysFlat | QueryOrderMap<T>;
export declare type QueryOrderMap<T> = {
    [K in keyof T]?: QueryOrderKeys<ExpandProperty<T[K]>>;
};