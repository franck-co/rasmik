import { EntityClass } from '@mikro-orm/core';
import { NextFunction, Request, Response } from 'express';

export interface CrudEndpointParams {
    path?:string, 
    security?:any
    middlewares?: Middleware | Array<Middleware>
}

export interface CrudEndpointDef {
    EntityClass:EntityClass<any>
    path:string
    security:any
    middlewares: Array<Middleware>
}

export type Middleware  = ((req:Request,res:Response,next:NextFunction)=>void)


export const crudRequestTypes = ['pushOne','pushMany', 'readOne', 'readMany', 'deleteOne', 'deleteMany'] as const
export type CrudRequestType = typeof crudRequestTypes[number]