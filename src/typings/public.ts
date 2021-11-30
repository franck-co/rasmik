// export type ToPojo = {
    
// }


// type ChildrenMapped<E extends RootEntity> = Partial<{
//     [K in keyof E as E[K] extends never ? never : K]: E[K] extends Collection<infer U> ? 
//                         U extends RootEntity ? 
//                             PushDefNodeObjects<U> | PushDefNodePks<U> 
//                             : never
//                         :  E[K] extends RootEntity ?
//                         PushDefNodeObject<E[K]> | PushDefNodePk<E[K]> 
//                         : never
// }>

// type Children<E extends RootEntity> = RemoveNever<ChildrenMapped<E>>