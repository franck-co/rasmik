import { FindOptions as StdReadOptions} from '@mikro-orm/core';
import { AutoPath } from '@mikro-orm/core/dist/typings';

/** Additional options for rasmik */
export interface ReadOptions<T, P extends string = never> extends StdReadOptions<T,P> {
   loadCustom?: AutoPath<T,P>[]; //TODO: type the available hooks //TODO: faire un array d'autopath pour activer les hooks sur les enfants
   exclude?: AutoPath<T,P>[];
}

export interface DeleteOptions<T, P extends string = never> extends ReadOptions<T,P> {
    failIfNull?:boolean
}


