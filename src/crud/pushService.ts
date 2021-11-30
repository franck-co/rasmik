import { EntityManager, Reference, EntityClass } from '@mikro-orm/core'
import { RasmikServer } from '../rasmik'
import { CrudService } from './crudService'
import { AnyPushDef } from '../typings'
import { PushRunner } from '../push-runner'

export class PushService extends CrudService {

    EntityClass: EntityClass<any>
    def: AnyPushDef
    runner: PushRunner
    data: any

    constructor(rasmik: RasmikServer<any>, EntityClass: EntityClass<any>, def: AnyPushDef, data: any, em?: EntityManager<any>) {
        super(rasmik, em)
        this.EntityClass = EntityClass
        this.def = def || {}
        this.data = data
        this.runner = new PushRunner(EntityClass, def, data, this.em)
    }

    /** @returns next identifier(s) */
    async push(): Promise<Reference<any> | Reference<any>[] | undefined> {

        this.runner.buildDefTree()

        const [isOkDefs, msgArrDefs] = this.runner.verifyDefs()
        if (!isOkDefs) {
            this.messages.push(...msgArrDefs)
            this.throw()

        }

        //1st pass to apply hooks
        this.runner.buildHandlerTree(this.data)

        try {
            await this.runner.applyDataHooks()
        } catch (err : any) {
            console.log(err)
            this.messages.push('error while running data hooks', err.message)
            this.throw()
        }

        //2nd pass because hooks can modify data
        this.runner.buildHandlerTree(this.data)

        const [isOkItems, msgArrItems] = this.runner.verifyItems()
        if (!isOkItems) {
            this.messages.push(...msgArrItems)
            this.throw()
        }


        await this.runner.handle()
        await this.runner.link()

        //this.throwIfError()//utile ?

        try {
            await this.em.flush()
        } catch (err:any) {
            console.error("erreur pendant le flush", err)
            this.messages.push("erreur pendant le flush : " + err.message)
            this.throw()
        }


        /**
         * Prepare the response config
         * If insert or update, we have the id of the top level node
         * The id is stored in the entity after the flush (not in idVal)
         * It will be used by the chosen readService as a where clause
         */
        return this.runner.getNext()
    }
}