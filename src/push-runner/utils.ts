//import { collection_, item_ } from "./types";

export class Utils {

    /**
     * Checks whether the argument looks like primary key (string, number or ObjectId).
     */
    static isPrimaryKey(val:any, allowComposite = false) {
        if (allowComposite && Array.isArray(val) && val.every(v => Utils.isPrimaryKey(v))) {
            return true;
        }
        return Utils.isString(val) || Utils.isNumber(val) || val instanceof Date || val instanceof Buffer;
    }

    /**
    * Checks if the argument is number
    */
    static isOwnValue(v: any): boolean {
        return !Utils.isObject(v) && !Utils.isArray(v)
    }

    /**
     * Checks if the argument is string
     */
    static isString(s: any): s is string {
        return typeof s === 'string' || s instanceof String;
    }

    /**
     * Checks if the argument is number
     */
    static isNumber<T = number>(s: any): s is T {
        return typeof s === 'number';
    }



    static isObject<T extends {[key:string]:any}>(o: any): o is T {
        return !!o && typeof o === 'object' && !Array.isArray(o);
    }

    static isArray(a: any): a is Array<any> {
        return Array.isArray(a)
    }

    // static isCollection(c: any): c is collection_ {
    //     return Utils.isArray(c) && c.reduce((acc, item) => Utils.isItem(item))
    // }

    // static isItem(i: any): i is item_ {
    //     return !Utils.isArray(i) && i !== undefined
    // }



    /**
     * Normalize the argument to always be an array.
     */
    static asArray(data:any, strict = false) {
        if (typeof data === 'undefined' && !strict) {
            return [];
        }
        if (data instanceof Set) {
            return Array.from(data);
        }
        return Array.isArray(data) ? data : [data];
    }

    /**
     * Checks whether the argument is empty (array without items, object without keys or falsy value).
     */
    static isEmpty(data:any) {
        if (Array.isArray(data)) {
            return data.length === 0;
        }
        if (Utils.isObject(data)) {
            return !Utils.hasObjectKeys(data);
        }
        return !data;
    }

    static findDuplicates<T>(items: T[]): T[] {
        return items.reduce((acc, v, i, arr) => {
            return arr.indexOf(v) !== i && acc.indexOf(v) === -1 ? acc.concat(v) : acc;
        }, [] as T[]);
    }

    static filterObjectByKeys(obj: Record<string,any>, allowedKeys: string[]): {} {

        return Object.keys(obj).reduce<Record<string,any>>((acc, key) => {
            if (allowedKeys.includes(key)) acc[key] = obj[key]
            return acc
        }, {})
    }


    /**
     * Returns true if `obj` has at least one property. This is 20x faster than Object.keys(obj).length.
     * @see https://github.com/deepkit/deepkit-framework/blob/master/packages/core/src/core.ts
     */
    static hasObjectKeys(object:Record<string,any>) {
        for (const key in object) {
            // eslint-disable-next-line no-prototype-builtins
            if (object.hasOwnProperty(key)) {
                return true;
            }
        }
        return false;
    }

    
    static isNullish(v: any){
        return v === null || typeof v === "undefined"
    }

    static getPrimaryKeyCondFromArray(pks: any[], primaryKeys: string[]) {
        return primaryKeys.reduce((o, pk, idx) => {
          o[pk] = pks[idx]
          return o;
        }, {} as any);
      }

}