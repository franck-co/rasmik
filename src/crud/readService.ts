import { EntityManager, FilterQuery,EntityClass, ServerException, wrap } from '@mikro-orm/core'
import type { RasmikServer } from '../rasmik'
import { CrudService } from './crudService'
import { Helper } from '../helper'
import type { AnyPushDef, ReadOptions } from '../typings'
import { RasmikDbError, RasmikError, RasmikValidationError } from '../errors'
import { ReadOptionsHandler } from './readOptionsHandler'

export class ReadService extends CrudService {

    EntityClass: EntityClass<any>
    where: FilterQuery<any>
    options: ReadOptions<any>
    private optionsHandler: ReadOptionsHandler


    constructor(rasmik: RasmikServer<any>, EntityClass: EntityClass<any>, where: FilterQuery<any>, options?: ReadOptions<any> , em?: EntityManager<any>) {
        super(rasmik, em)
        this.EntityClass = EntityClass
        this.where = where || {};
        this.options = options || {}
        this.optionsHandler = new ReadOptionsHandler(this.EntityClass, this.options)
    }


    async readOneEntity() {
        

        //throw if not valid
        this.verifyArgs()
        if(this.isErr) throw new RasmikValidationError(...this.messages)

        let foundEntity: any
        try {
            //@ts-ignore
            foundEntity = await this.em.findOne(this.EntityClass, this.where, this.optionsHandler.getFindOptions())
        } catch (err:any) {
            console.error(err)
            //TODO: use mikro-orm exceptions to determine DbError
            if(err instanceof ServerException) throw new RasmikDbError(err,"error while running em.findOne")
            else throw new RasmikError(err,"error while running em.findOne")


        }

       
        
        try {
            await this.runLoadHooks(foundEntity)
        } catch (err:any) {
            console.error(err)
            this.messages.push("error while running load hooks", err.message)
        }

        if(this.isErr) throw new RasmikError(...this.messages)

        return foundEntity


    }

    async readManyEntities() {

        //throw if not valid
        this.verifyArgs()
        if(this.isErr) throw new RasmikValidationError(...this.messages)

        let foundEntities: any

        try {
            foundEntities = await this.em.find(this.EntityClass, this.where, this.optionsHandler.getFindOptions())
        } catch (err:any) {
            console.error(err)
           throw new RasmikError("error while running em.find", err.message)
        }

        try {
            await this.runLoadHooks(foundEntities)
        } catch (err:any) {
            console.error(err)
            if(err instanceof ServerException) throw new RasmikDbError(err,"error while running em.findOne")
            else throw new RasmikError(err,"error while running em.findOne")
        }

        if(this.isErr) throw new RasmikError("error while running load hooks",...this.messages)

        return foundEntities

    }

    
    async readOne() {
        const populate = this.optionsHandler.getPopulate()
        const entity = await this.readOneEntity()
        return entity ? wrap(entity).toJSON(populate) : null
    }

    async readMany() {
        const populate = this.optionsHandler.getPopulate()
        const entities = await this.readManyEntities()
        return entities && Array.isArray(entities) ? entities.map(entity => wrap(entity).toJSON(populate)) : null
    }


    //TODO: ne plus se baser sur les path, se baser sur les defs dans les children.
    //TODO: looper sur tous les nodes (ne fait rien pour le moment)
    private async runLoadHooks(outcome: any) {
        if (!this.options || !this.options.loadCustom || !Array.isArray(this.options.loadCustom)) return

        for (const key of this.options.loadCustom) {
            const loadHookFn =  this.EntityClass.prototype[key]

            let promises = []
            if(Array.isArray(outcome)){
                for(const entity of outcome){
                    promises.push(loadHookFn.call(entity,this.em))
                }
            }else{
                promises.push(await loadHookFn.call(outcome,this.em))
            }

            await Promise.all(promises)
        }

    }








    private verifyArgs() {
        this.verifyCustomLoad()
    }

    private verifyCustomLoad() {

        if (!this.options || !this.options.loadCustom || !Array.isArray(this.options.loadCustom)) return

        const errors = []

        for (const key of this.options.loadCustom) {
            const loadHookFn =  this.EntityClass.prototype[key]
            if (!loadHookFn) errors.push(`${this.EntityClass.name}.${key}()`)
        }

        if (errors.length) throw new Error('The following custom loaders are not present at the specified loactions : ' + errors.join(', '))
    }




}
