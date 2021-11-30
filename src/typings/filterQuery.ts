import { ExpandProperty } from '@mikro-orm/core/dist/typings';
import { Dictionary,  ExpandScalar, Primary, Scalar } from './utility';


export declare type FilterValue2<T> = T | ExpandScalar<T> | Primary<T>;
export declare type FilterValue<T> = OperatorMap<FilterValue2<T>> | FilterValue2<T> | FilterValue2<T>[] | null;
declare type ExpandObject<T> = T extends object ? T extends Scalar ? never : {
    [K in keyof T]?: Query<ExpandProperty<T[K]>> | FilterValue<ExpandProperty<T[K]>> | null;
} : never;



export declare type OperatorMap<T> = {
    $and?: Query<T>[];
    $or?: Query<T>[];
    $eq?: ExpandScalar<T>;
    $ne?: ExpandScalar<T>;
    $in?: ExpandScalar<T>[];
    $nin?: ExpandScalar<T>[];
    $not?: Query<T>;
    $gt?: ExpandScalar<T>;
    $gte?: ExpandScalar<T>;
    $lt?: ExpandScalar<T>;
    $lte?: ExpandScalar<T>;
    $like?: string;
    $re?: string;
    $ilike?: string;
    $overlap?: string[];
    $contains?: string[];
    $contained?: string[];
};


export declare type Query<T> = T extends object ? T extends Scalar ? never : FilterQuery<T> : FilterValue<T>;


export  type ObjectQuery<T> = ExpandObject<T> & OperatorMap<T>;
export  type FilterQuery<T> = ObjectQuery<T> | NonNullable<ExpandScalar<Primary<T>>> | T | FilterQuery<T>[];
export type QBFilterQuery<T = any> = FilterQuery<T> | Dictionary;
