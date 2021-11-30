import { EntityManager, FilterQuery ,EntityClass} from '@mikro-orm/core'
import { RasmikServer } from '../rasmik'
import { CrudService } from './crudService'
import { Helper } from '../helper'
import { DeleteOptions } from '../typings'

export class DeleteService  extends CrudService {

    where:FilterQuery<any>
    options:DeleteOptions<any,never>
    EntityClass:EntityClass<any>

    constructor(rasmik:RasmikServer<any>,EntityClass:EntityClass<any>, where:FilterQuery<any>,options?:DeleteOptions<any,never>, em?:EntityManager<any>){
        super(rasmik,em)
        this.EntityClass = EntityClass
        this.where = where || {};
        this.options = options || {};
    }



    async deleteOne(){
        const { failIfNull,...readOptions} = this.options

        //throw if not valid
        this.verifyArgs()
        this.throwIfError()


        let foundEntity:any
        try{
            foundEntity = await this.rasmik.readOne(this.EntityClass, this.where,readOptions,this.em)
        }catch(err:any){
            console.error(err)
            this.messages.push("error while running rasmik.readOne",err.message)
        }

        this.throwIfError()

        if(failIfNull && !foundEntity){
            this.messages.push("no row to delete")
        }

        this.throwIfError()

        try{
            await this.em.remove(foundEntity).flush()
        }catch(err:any){
            console.error(err)
            this.messages.push("error while running em.remove",err.message)
        }

        this.throwIfError()

        return foundEntity
    }




    async deleteMany(){
        const { loadCustom, exclude,failIfNull,...findOptions} = this.options

        //throw if not valid
        this.verifyArgs()
        this.throwIfError()

        let foundEntities:any[]=[]
        try{
            foundEntities = await this.rasmik.readMany(this.EntityClass, this.where, findOptions,this.em)
        }catch(err:any){
            console.error(err)
            this.messages.push("error while running em.find",err.message)
        }

        this.throwIfError()


        if(failIfNull && !foundEntities.length){
            this.messages.push("no row to delete")
        }

        this.throwIfError()

        try{
            await this.em.remove(foundEntities).flush()
        }catch(err:any){
            console.error(err)
            this.messages.push("error while running em.remove",err.message)
        }

        this.throwIfError()
        return foundEntities
    }









    private verifyArgs(){
        this.verifyCustomLoad()
        this.verifyWhereClause()
    }

    private verifyWhereClause(){
        if(!this.where){
            this.messages.push("can't delete without where clause")
        }
}

    private verifyCustomLoad() {
    
        if(!this.options || !this.options.loadCustom || !Array.isArray(this.options.loadCustom) ) return

        const errors = []
        

        for(const path of this.options.loadCustom){
           const loadHookFn = Helper.getFromPath(this.EntityClass,path)
           if(!loadHookFn) errors.push(path + '()')
        }
 
        if( errors.length) this.messages.push('the following custom loaders are not present at the specified loactions : ' +  errors.join(', '))
     }



     
}
