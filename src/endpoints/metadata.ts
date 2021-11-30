import { EntityClass } from '@mikro-orm/core';
import { CrudEndpointDef, CrudEndpointParams, Middleware } from './types';


class MetadataStorage {
 
    public crudEndpoints: Array<CrudEndpointDef> = []

    public addCrudEndpoint(EntityClass:EntityClass<any>, settings:CrudEndpointParams){


        this.crudEndpoints.push({
            EntityClass, 
            path: trimSlashes(settings.path),
            middlewares: settings.middlewares ? Array.isArray(settings.middlewares) ? settings.middlewares : [settings.middlewares] : [],
            security: settings.security || {}
        })
    }

}

function trimSlashes (path:string) {
    return path.replace(new RegExp("^[/]+|[/]+$", "g"), "");      
}

export const metadataStorage = new MetadataStorage()