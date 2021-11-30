import { EntityManager, FilterQuery,EntityClass } from '@mikro-orm/core'
import { RasmikServer } from '../rasmik'
import { CrudService } from './crudService'
import { Helper } from '../helper'
import { ReadOptions } from '../typings'

export class ReadService extends CrudService {

    EntityClass: EntityClass<any>
    where: FilterQuery<any>
    options: ReadOptions<any,never>


    constructor(rasmik: RasmikServer<any>, EntityClass: EntityClass<any>, where: FilterQuery<any>, options?: ReadOptions<any,never> , em?: EntityManager<any>) {
        super(rasmik, em)
        this.EntityClass = EntityClass
        this.where = where || {};
        this.options = options || {}
    }


    async readOne() {
        const { loadCustom, exclude, ...findOptions } = this.options

        //throw if not valid
        this.verifyArgs()
        this.throwIfError()

        let foundEntity: any
        try {
            foundEntity = await this.em.findOne(this.EntityClass, this.where, findOptions)
        } catch (err:any) {
            console.error(err)
            this.messages.push("error while running em.findOne", err.message)
        }

        this.throwIfError()

        try {
            await this.runLoadHooks(foundEntity)
        } catch (err:any) {
            console.error(err)
            this.messages.push("error while running load hooks", err.message)
        }

        this.throwIfError()

        return foundEntity


    }

    async readMany() {
        const { loadCustom, exclude, ...findOptions } = this.options

        //throw if not valid
        this.verifyArgs()
        this.throwIfError()

        let foundEntities: any

        try {
            foundEntities = await this.em.find(this.EntityClass, this.where, findOptions)
        } catch (err:any) {
            console.error(err)
            this.messages.push("error while running em.find", err.message)
        }

        this.throwIfError()

        try {
            await this.runLoadHooks(foundEntities)
        } catch (err:any) {
            console.error(err)
            this.messages.push("error while running load hooks", err.message)
        }

        this.throwIfError()

        return foundEntities

    }






    //TODO: looper sur tous les nodes (ne fait rien pour le moment)
    private async runLoadHooks(outcome: any) {
        if (!this.options || !this.options.loadCustom || !Array.isArray(this.options.loadCustom)) return

        for (const path of this.options.loadCustom) {
            const loadHookFn = Helper.getFromPath(this.EntityClass, path)
        }

    }












    private verifyArgs() {
        this.verifyCustomLoad()
    }

    private verifyCustomLoad() {

        if (!this.options || !this.options.loadCustom || !Array.isArray(this.options.loadCustom)) return

        const errors = []


        for (const path of this.options.loadCustom) {
            const loadHookFn = Helper.getFromPath(this.EntityClass, path)
            if (!loadHookFn) errors.push(path + '()')
        }

        if (errors.length) throw new Error('The following custom loaders are not present at the specified loactions : ' + errors.join(', '))
    }




}
