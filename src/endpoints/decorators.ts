import { metadataStorage } from './metadata'
import { CrudEndpointParams } from './types'


export function CrudEndpoint(settings:CrudEndpointParams):ClassDecorator{

    return function(ctor){
        metadataStorage.addCrudEndpoint(ctor, settings)
    }
}