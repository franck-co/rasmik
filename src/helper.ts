import { EntityMetadata,EntityClass } from '@mikro-orm/core'

export class Helper {

    static getFromPath(entity: EntityClass<any>, path: string): any {
        const [prefix, suffix] = path.split('.', 2)
        const meta: EntityMetadata = entity.prototype.__meta

        //When at the end of the path
        if (!suffix) {
            const prop = entity.prototype[prefix]
            return prop
        }

        //otherwise, there is a relation (or embaddable) //TODO: handle embedables
        if (suffix) {
            const childEntity = meta?.relations?.find(rel => rel.fieldNameRaw === prefix)?.targetMeta?.class
            if (!childEntity) return undefined
            else return this.getFromPath(childEntity, suffix)
        }

    }
}