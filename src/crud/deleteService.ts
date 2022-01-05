import { EntityManager, FilterQuery ,EntityClass, ServerException} from '@mikro-orm/core'
import { RasmikServer } from '../rasmik'
import { CrudService } from './crudService'
import { Helper } from '../helper'
import { DeleteOptions } from '../typings'
import { RasmikDbError, RasmikError, RasmikValidationError } from '..'

export class DeleteService  extends CrudService {

    where:FilterQuery<any>
    options:DeleteOptions<any>
    EntityClass:EntityClass<any>

    constructor(rasmik:RasmikServer<any>,EntityClass:EntityClass<any>, where:FilterQuery<any>,options?:DeleteOptions<any>, em?:EntityManager<any>){
        super(rasmik,em)
        this.EntityClass = EntityClass
        this.where = where || {};
        this.options = options || {};
    }



    async deleteOne(){
        const { failIfNull,...readOptions} = this.options

        //throw if not valid
        this.verifyArgs()
        if(this.isErr) throw new RasmikValidationError(...this.messages)


        let foundEntity:any
        try{
            foundEntity = await this.rasmik.readOneEntity(this.EntityClass).where(this.where).options(readOptions).run(this.em)
        }catch(err:any){
            if(err instanceof ServerException) throw new RasmikDbError(err,"error while running em.findOne")
            else throw new RasmikError(err,"error while running em.findOne")
        }

        if(failIfNull && !foundEntity){
            throw new RasmikValidationError("no row to delete")
        }

        try{
            await this.em.remove(foundEntity).flush()
        }catch(err:any){
            if(err instanceof ServerException) throw new RasmikDbError(err,"error while running em.remove")
            else throw new RasmikError(err,"error while running em.remove")
        }

        return foundEntity
    }




    async deleteMany(){
        const { loadCustom, failIfNull,...readOptions} = this.options

        //throw if not valid
        this.verifyArgs()
        if(this.isErr) throw new RasmikValidationError(...this.messages)

        let foundEntities:any[]=[]
        try{
            foundEntities = await this.rasmik.readManyEntities(this.EntityClass).where(this.where).options(readOptions).run(this.em)
        }catch(err:any){
            if(err instanceof ServerException) throw new RasmikDbError(err,"error while running em.findOne")
            else throw new RasmikError(err,"error while running em.findOne")
        }



        if(failIfNull && !foundEntities.length){
            throw new RasmikValidationError("no rows to delete")
        }


        try{
            await this.em.remove(foundEntities).flush()
        }catch(err:any){
            if(err instanceof ServerException) throw new RasmikDbError(err,"error while running em.remove")
            else throw new RasmikError(err,"error while running em.remove")
        }

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
