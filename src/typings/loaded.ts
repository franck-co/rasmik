import { Defined,  Prefix, Suffix, Primary, RootEntity, RemoveNever } from './utility';
  
// type LoadedMapped<T, L extends string = never> = RemoveNever<{
//   [K in keyof T]: K extends Prefix<L> ?
      
//       //Populated 
//       T[K] extends RootEntity ? 

//         Loaded<Defined<T[K]>, Suffix<L>>
//         :T[K] extends Array<infer U> ?
          
//              U extends RootEntity ? Array<Loaded<Defined<U>, Suffix<L>>> :T[K]
//             :T[K]
        

//       //Not populated
//       :T[K] extends RootEntity ? 

//           Primary<T[K]> 
//           :T[K]  extends Array<infer U> ? 

//               U extends RootEntity ?  
//                   never /*Jamais d'array d'id reçus Array<Primary<U>>*/ 
//                   : T[K]//'classic array'
//               :T[K]//: T[K] //Not loaded ->  primary if entity, or as it is
           
// }>

// export type Loaded<T, L extends string = never> =  RemoveNever<LoadedMapped<T, L>>