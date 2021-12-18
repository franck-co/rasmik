import { EntityManager, Reference, EntityClass, ServerException } from '@mikro-orm/core'
import { RasmikServer } from '../rasmik'
import { CrudService } from './crudService'
import { AnyPushDef } from '../typings'
import { PushRunner } from '../push-runner'
import { RasmikDbError, RasmikError, RasmikValidationError } from '../errors'


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
        async pushOne(): Promise<Reference<any> | undefined> {
            return await this.push('single') as any
        }

        /** @returns next identifier(s) */
        async pushMany(): Promise< Reference<any>[] | undefined> {
            return await this.push('coll') as any
        }

    private async push(type:'coll' | 'single'): Promise<Reference<any> | Reference<any>[] | undefined> {

        this.runner.buildDefTree(type)

        const [isOkDefs, msgArrDefs] = this.runner.verifyDefs()
        if (!isOkDefs) throw new RasmikValidationError(...msgArrDefs)

        //1st pass to apply hooks
        this.runner.buildHandlerTree(this.data)

        try {
            await this.runner.applyDataHooks()
        } catch (err : any) {
          throw new RasmikError(err,'error while running data hooks')
        }

        //2nd pass because hooks can modify data
        this.runner.buildHandlerTree(this.data)

        const [isOkItems, msgArrItems] = this.runner.verifyItems()
        if (!isOkItems) throw new RasmikValidationError(...msgArrItems)


        await this.runner.handle()
        await this.runner.link()

        //this.throwIfError()//utile ?

        try {
            await this.em.flush()
        } catch (err:any) {
            if(err instanceof ServerException) throw new RasmikDbError(err,"error while running em.flush")
            else throw new RasmikError(err,"error while running em.flush")
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