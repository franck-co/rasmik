import { NextFunction, Request, Response, Router } from 'express'
import { RasmikServer } from '../rasmik'
import { metadataStorage } from './metadata'
import { CrudEndpointDef, CrudRequestType } from './types'


export class RasmikRouter {

    rasmik: RasmikServer<any>

    constructor(rasmik: RasmikServer<any>) {
        this.rasmik = rasmik
    }

    registerRoutes(router: Router) {

        const onlyPostMsg = (req: Request, res: Response) => res.status(481).json({ 'error': 'wrong request type. /entities/... endpoints only work with http POST requests' })
        router.get('*', onlyPostMsg)
        router.put('*', onlyPostMsg)
        router.patch('*', onlyPostMsg)
        router.delete('*', onlyPostMsg)

        for (const crudEndpointDef of metadataStorage.crudEndpoints) {
            router.post('/crud/' + crudEndpointDef.path + '/:reqType', ...crudEndpointDef.middlewares, this.createHandler(crudEndpointDef))
            router.post('/crud/' + crudEndpointDef.path, (req: Request, res: Response) => res.status(481).json({ 'error': 'wrong request type. Expected one of https://domain.xx/auto/endpoint/pushOne, pushMany, readOne, readMany, deleteOne, deleteMany' }))
        }

        return router
    }


    private createHandler(def: CrudEndpointDef) {

        const handler = async (req: Request, res: Response, next:NextFunction) => {


            const reqType: CrudRequestType = req.params.reqType as any

            const qry = this.extractParams(req, res)
            if(!qry)return

            try {

                if (reqType === 'readOne') {
                    const foundEntity = await this.rasmik.readOne(def.EntityClass).where(qry.readWhere).options(qry.readOptions).run()
                    res.json(foundEntity)
                    return
                }

                if (reqType === 'readMany') {
                    const foundEntities = await this.rasmik.readMany(def.EntityClass).where(qry.readWhere).options(qry.readOptions).run()
                    res.json(foundEntities)
                    return
                }

                if (reqType === 'deleteOne') {
                    const deletedEntity = await this.rasmik.deleteOne(def.EntityClass).where(qry.deleteWhere).options(qry.deleteOptions).run()
                    res.json(deletedEntity)
                    return
                }

                if (reqType === 'deleteMany') {
                    const deletedEntities = await this.rasmik.deleteMany(def.EntityClass).where(qry.deleteWhere).options(qry.deleteOptions).run()
                    res.json(deletedEntities)
                    return
                }

                if (reqType === 'pushOne') {

                    const em = this.rasmik.em.fork()

                    //modifiy data
                    const nextIdentifier = await this.rasmik.pushOne(def.EntityClass).pushDef(qry.pushDef).data(qry.data).run(em)

                    //Reset the identity map so entities will be queried fully
                    em.clear()


                    //get something to send back
                    const foundEntity = await this.rasmik.readOne(def.EntityClass).where(nextIdentifier).options(qry.readOptions).run()
                    res.json(foundEntity)
                }

                if (reqType === 'pushMany') {

                    const em = this.rasmik.em.fork()

                    //modifiy data
                    const nextIdentifiers = await this.rasmik.pushOne(def.EntityClass).pushDef(qry.pushDef).data(qry.data).run(em)

                    //Reset the identity map so entities will be queried fully
                    em.clear()

                    //get something to send back
                    const foundEntities = await this.rasmik.readMany(def.EntityClass).where(nextIdentifiers).options(qry.readOptions).run()
                    res.json(foundEntities)
                }

            } catch (err) {
                next(err)
            }
        }

        return handler

    }




    private extractParams(req: Request, res: Response) {

        const qry = {} as { [key in 'readWhere' | 'readOptions' | 'data' | 'pushDef' | 'deleteWhere' | 'deleteOptions']: any }


        switch (req.params.reqType) {
            case 'readOne':
            case 'readMany':


                if (!req.body.where && !req.body.options) {
                    qry.readWhere = req.body
                    qry.readOptions = undefined
                } else {
                    qry.readWhere = req.body.where
                    qry.readOptions = req.body.options
                }

                return qry;

            case 'deleteOne':
            case 'deleteMany':

                if (!req.body.where && !req.body.options) {
                    qry.deleteWhere = req.body
                    qry.deleteOptions = undefined
                } else {
                    qry.deleteWhere = req.body.where
                    qry.deleteOptions = req.body.options
                }
                return qry;

            case 'pushOne':
            case 'pushMany':

                qry.data = req.body.data
                qry.pushDef = req.body.pushDef
                qry.readOptions = req.body.readOptions

                if (!Object.keys(qry.data).length && !Array.isArray(qry.data)) {
                    res.status(481).json({ 'msg': 'data not provided for the push query', expected: { "data": "obj | array", "pushDef": "obj", "readOptions": "obj" } })
                    return
                }

                return qry;

            default:
                res.status(481).json({ 'error': 'wrong request type. Expected one of https://domain.xx/auto/endpoint/pushOne, pushMany, readOne, readMany, deleteOne, deleteMany' })
                return
        }

    }
}