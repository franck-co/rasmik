import { EntityClass } from '@mikro-orm/core';
import pluralize from 'pluralize';
import { CrudEndpointDef, CrudEndpointParams, Middleware } from './types';


class MetadataStorage {
 
    public crudEndpoints: Array<CrudEndpointDef> = []

    public addCrudEndpoint(EntityClass:EntityClass<any>, settings:CrudEndpointParams){


        this.crudEndpoints.push({
            EntityClass, 
            path: getEnpointPath(EntityClass,settings),
            middlewares: settings.middlewares ? Array.isArray(settings.middlewares) ? settings.middlewares : [settings.middlewares] : [],
            security: settings.security || {}
        })
    }

}


function getEnpointPath(EntityClass:EntityClass<any>, settings:CrudEndpointParams ){
    let pathValue = settings.path && trimSlashes(settings.path)  || ''
    
    if(!pathValue){
        pathValue =`${pluralize(EntityClass.name.replace(/((?<=[a-z\d])[A-Z]|(?<=[A-Z\d])[A-Z](?=[a-z]))/g, '-$1').toLowerCase())}`
    }

    return pathValue
}

function trimSlashes (path:string) {
    return path.replace(new RegExp("^[/]+|[/]+$", "g"), "");      
}

export const metadataStorage = new MetadataStorage()