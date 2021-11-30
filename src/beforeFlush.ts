import { Subscriber, EventSubscriber, FlushEventArgs, AnyEntity } from "@mikro-orm/core"




type flushTypes = Array<'create'|'update'|'delete'|'all'|'upsert'>

const entitiesMap = new Map<AnyEntity,Array<[string,flushTypes]>>()

//Decorator to register a function for an entity and a flushType
export function BeforeFlush(...flushTypes:flushTypes): MethodDecorator {
    if (flushTypes.length === 0 ) flushTypes.push('all')
    return function(proto, key){
        const fns = entitiesMap.get(proto.constructor) || []
        fns.push([key as string,flushTypes])
        entitiesMap.set(proto.constructor, fns)
    }
}


@Subscriber()
class RasmikBeforeFlushSuscriber implements EventSubscriber {


    //Called only once for the whole flush
    async beforeFlush(args: FlushEventArgs) {

        // //clone the em (and its identityMap)
        //const uowClone = args.em.fork(false,true).getUnitOfWork()
 

        // //em.fork does not copy persistStack. Need to do it manually for each entity in persistStack
        // for(const persistedEntity of args.uow.getPersistStack()){
        //     uowClone.persist(persistedEntity)
        // }

        // //compute change sets from identity map to get a list of changes (! this clears the unitOfWork, this is why we use a clone of the uow)
        // uowClone.computeChangeSets()
        
        // //get all changesets when an Address is updated or created
        // const changeSets = uowClone.getChangeSets();

        // for (const cs of changeSets) {

        //     //get an array of registered functions for this entity
        //     const fns = entitiesMap.get(cs.entity.constructor)

        //     const csType = cs.type

        //     if(fns){
        //         for (const [fnName,flushTypes] of fns) {

        //             if(csType === 'create' && flushTypes.some(ft=>['create','upsert','all'].includes(ft))) await cs.entity[fnName].call(cs.entity, cs,args)
        //             else if(csType === 'update' && flushTypes.some(ft=>['update','upsert','all'].includes(ft))) await cs.entity[fnName].call(cs.entity,  cs,args)
        //             else if(csType === 'delete' && flushTypes.some(ft=>['delete','all'].includes(ft))) await cs.entity[fnName].call(cs.entity,  cs,args)
                    
        //         }
        //     }

        // }

    }

        //Called only once for the whole flush
        async onFlush(args: FlushEventArgs) {

            //get all changesets when an Address is updated or created
            const changeSets = args.uow.getChangeSets();
    
            for (const cs of changeSets) {
    
                //get an array of registered functions for this entity
                const fns = entitiesMap.get(cs.entity.constructor)
    
                const csType = cs.type
    
                if(fns){
                    for (const [fnName,flushTypes] of fns) {
    
                        if(csType === 'create' && flushTypes.some(ft=>['create','upsert','all'].includes(ft))) await cs.entity[fnName].call(cs.entity, cs,args)
                        else if(csType === 'update' && flushTypes.some(ft=>['update','upsert','all'].includes(ft))) await cs.entity[fnName].call(cs.entity,  cs,args)
                        else if(csType === 'delete' && flushTypes.some(ft=>['delete','all'].includes(ft))) await cs.entity[fnName].call(cs.entity,  cs,args)
                        
                    }
                }
    
            }
    
        }
}
