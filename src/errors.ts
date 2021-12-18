export class RasmikError extends Error {

    constructor( ...messages: string[])
    constructor(previous: Error, ...messages: string[])
    constructor(first: Error | string, ...rest: string[])  {

        if(first instanceof Error){

            const previous = first
            const messages = rest

            const message = [...messages, '\n' + 'previous : ' +  previous.message].join('\n # ')
            super(message)

            Object.assign(this, previous);
            this.message = message
            this.name = this.constructor.name;
            this.stack += '\n\n' + 'previous ' + previous.stack;
        }else{
            const messages = [first,...rest]
            const message = messages.join('\n # ')
            super(message)
        }
       
    }
}
export class RasmikValidationError extends RasmikError {}
export class RasmikDbError extends RasmikError {}
export class RasmikPermissionError extends RasmikError {}

