import { EntityManager } from '@mikro-orm/core';
import { RasmikServer } from '../rasmik';


export class CrudService {

    protected rasmik:RasmikServer<any>
    protected em:EntityManager<any>
    protected messages:string[] = new Array()

    constructor(rasmik:RasmikServer<any>, em?:EntityManager<any>){
        this.rasmik = rasmik
        this.em = em || rasmik.em.fork()
    }

    get isErr(){
        return !!this.messages.length
    }

    // throw(){
    //     throw new Error(this.messages.join('\n # '))
    // }

    throwIfError(){
        if(this.isErr)   this.throw()
    }

    throw(){
        throw new Error(this.messages.join('\n # '))
    }
}