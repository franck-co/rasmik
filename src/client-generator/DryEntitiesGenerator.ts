import { ClassDeclaration, InterfaceDeclaration, Node, ObjectLiteralExpression, Project, PropertyDeclaration, PropertySignature, SourceFile, SyntaxKind, Type, TypeAliasDeclaration, VariableStatement } from 'ts-morph';

export interface DryEntitiesGeneratorSettings {
    sourcesGlob?: string | string[]
    outputFilePathRel:string
    prefix?: string
    pathToRasmikTypes?:string
    emit?:boolean
    disableFeedback?:boolean
}



export class DryEntitiesGenerator {
    constructor(settings: DryEntitiesGeneratorSettings) {

        this.outputFilePathRel = settings.outputFilePathRel
        this.sourcesGlob =  settings.sourcesGlob || ['src/entities/**/*.ts']
        this.pathToRasmikTypes = settings.pathToRasmikTypes || 'rasmik/dist/typings'
        this.prefix = settings.prefix || ''
        this.emit = settings.emit || true 
        this.disableFeedback = settings.disableFeedback || false
        if(this.outputFilePathRel.endsWith('/')) this.outputFilePathRel = this.outputFilePathRel.slice(0,- 1)
    }

    public outputFilePathRel: string
    public sourcesGlob: string | string[]
    //public endpointsDirGlob: string | string[]
    public prefix: string
    public pathToRasmikTypes:string
    public emit:boolean


    private outputFile!: SourceFile
    private projectTypes: Set<TypeAliasDeclaration | ClassDeclaration | InterfaceDeclaration | VariableStatement> = new Set()
    protected project!: Project

    protected excluded: string[]= []
    private disableFeedback:boolean


    public async generate() {

        //init ts-morph
        this.display('initializing project ...')
        this.initProject()

        this.processEntitiesDir()

        this.outputFile.insertStatements(this.getLastImportOrder() + 1, Array.from(this.projectTypes).sort((decA,decB)=> (Node.isVariableStatement(decA) ? 0 : 1) - (Node.isVariableStatement(decB)  ? 0 : 1)).map(dec => dec.getText()))
        this.reorderClasses()


        this.outputFile.replaceWithText(this.outputFile.print({ removeComments: true }))

        this.renameExports()
        if(this.emit){
            this.outputFile.emitSync()
        }else{
            this.outputFile.saveSync()
        }

        if(this.disableFeedback)return
this.display(`Dry entities generated succesfully at ${this.outputFilePathRel} !` + (this.excluded.length ? `
${this.excluded.length} types couldn't be included because they are too dependant on other types :

${this.excluded.join('\n')}
`:`
All the types are included.\n`)
)
        // console.log(this.outputFile.getText())
    }



    protected initProject() {
        if(this.project) return 
        this.project = new Project({
            tsConfigFilePath: 'tsconfig.json',
            skipAddingFilesFromTsConfig: true,
            compilerOptions:{outDir:undefined, sourceMap:false}
        });

        const imports = `
        import { RootEntity, PrimaryKeyType, PrimaryKeyNames,_Ignored_ } from '${this.pathToRasmikTypes}';
        const _Ignored_ : _Ignored_ = null
        
        
        `
        this.outputFile = this.project.createSourceFile( this.outputFilePathRel, imports, { overwrite: true })
    }

    protected processEntitiesDir() {
        const entitiesFiles = this.project.addSourceFilesAtPaths(this.sourcesGlob);
        entitiesFiles.forEach((sourceFile,index) => {
            this.display(`${((index / entitiesFiles.length) * 100).toFixed(0).padStart(3," ")}%  processing file : ` + sourceFile.getBaseName())
            sourceFile.getClasses().filter(x => x.getDecorator('Entity') || x.getDecorator('Embeddable')).forEach(cls => this.processEntity(cls))
        });
    }


   

    protected processEntity(sourceCls: ClassDeclaration) {

        const cls = this.outputFile.addClass(sourceCls.getStructure())
        cls.getDecorator("Entity")?.remove()
        cls.getDecorator("Embeddable")?.remove()

        /**Remove all methods */
        cls.getMethods().forEach(meth => meth.remove())
        cls.getConstructors().forEach(ctor => ctor.remove())


        /** treat props */
        const props = cls.getProperties()
        for (const prop of props) {

            if(prop.hasModifier('private') || prop.hasModifier('protected') || prop.hasModifier('protected')){
                prop.remove()
                continue
            }

            /* convert collections to Array */
            const initializer = prop.getInitializer()
            if (initializer && initializer.getKindName() === 'NewExpression' && initializer.getChildAtIndex(1).getText() === 'Collection') {
                const typeText = initializer.getChildAtIndex(3).getText()

                prop.setType(`Array<${typeText}>`)
            }

            /** store standalone types */
            const originalProp = sourceCls.getProperty(prop.getName())
            //Can't remove the initializer because the type could be defined only in the initializer
            this.storeUsedTypes(originalProp!)

            /** Finaly remove all the decorators for the prop */
            prop.getDecorators().forEach(dec => dec.remove())
            prop.removeInitializer()

            prop.setHasQuestionToken(true)
        }

        /** treat accessors */
        for(const getter of cls.getGetAccessors()){

            cls.addProperty({
                name: getter.getName(),
                type:getter.getReturnType().getText(getter)
            })
            .toggleModifier('readonly', !cls.getSetAccessor(getter.getName()))

            
            cls.getSetAccessor(getter.getName())?.remove()
            getter.remove()
        }

        /** Store rasmik decorators data into static properties */
        let crudEndpointDecorator = sourceCls.getDecorator('CrudEndpoint')
        if (crudEndpointDecorator) {

            const objLitParam: ObjectLiteralExpression = crudEndpointDecorator.getCallExpression()?.getArguments()[0] as any
            //@ts-ignore
            const pathValue = objLitParam.getProperty('path').getInitializer().getText()


            cls.addProperty({
                isStatic: true,
                name: '__path',
                initializer: `${pathValue}`,
            }).toggleModifier('private', true)

            crudEndpointDecorator.remove()
        }

        /** Finaly remove all class decorators */
        cls.getDecorators().forEach(dec => dec.remove())
    }





    protected storeUsedTypes(parentNode: Node) {

        if (!parentNode || Node.isDecorator(parentNode)) return


        /** 
         * Recieve a node that could be anything (prop, type, class ...)
         * - Find every identifiers in type nodes (in the descendents)
         * - Find the declaration of that identifer
         * - If type or interface -> store + recurse
         * - If const -> is dependent on non type nodes ? yes: replace by any | no: store+recurse
         * - If class -> convert to interface -> store + recurse
         * - Else -> replace by any
         *  */

        parentNode.forEachDescendant(descendant => {
            if (Node.isTypeNode(descendant)) {

                for (const identifer of descendant.getChildrenOfKind(SyntaxKind.Identifier)) {



                    //getDefinitions is similar to "go to definition" functionality that exists with TypeScript in most IDEs.
                    let definitionNodes:Node[] = []
                    try { definitionNodes = identifer.getDefinitionNodes() } catch (err) { }


                    //remove types that are resolved to an external package sush as typescript lib itself
                    const declarations = definitionNodes.filter(dcl => !(dcl.getSourceFile().getFilePath().startsWith('/node_modules') || dcl.getSourceFile().getFilePath().startsWith(process.cwd() + '/node_modules'))).map(dcl => Node.isVariableDeclaration(dcl) ? dcl.getParent().getParent() : dcl)

                    for (const dcl of declarations) {

                        
                        const isType = Node.isTypeAliasDeclaration(dcl)
                        const isInterface = Node.isInterfaceDeclaration(dcl)
                        const isConst = Node.isVariableStatement(dcl)
                        const isClass = Node.isClassDeclaration(dcl)


                        //ignore unaccepted declarations
                        if (!(isType || isClass || isInterface || isConst)) {
                            identifer.rename('_Ignored_')
                            this.excluded.push(`> ${identifer.getText()} [${dcl.getKindName()}] (${identifer.getSourceFile().getFilePath()})`)
                            continue
                        }

                        //Skip entities as they are already present
                        if (isClass && (dcl.getDecorator('Entity') || dcl.getDecorator('Embeddable'))) continue


                        

                        //ignore impure const (an identifier that is not in a type node or the key of a property assignment)
                        if (isConst && dcl.getDescendants().some(constDclNode => {
                            Node.isIdentifier(constDclNode) 
                            && !(Node.isPropertyAssignment(constDclNode.getParent()) && dcl.getChildIndex() === 0 ) 
                            && !(dcl.getFirstAncestorByKind(SyntaxKind.FirstTypeNode) !== undefined)
                        })) {
                            this.excluded.push(`> ${identifer.getText()} [${dcl.getKindName()}] (${identifer.getSourceFile().getFilePath()})`)
                            identifer.rename('_Ignored_')
                            continue
                        }

                        //If class, keep only property names and types
                        if(isClass) this.convertToDryClass(dcl)


                        //Store and recurse
                        if (!this.projectTypes.has(dcl)) {
                            this.projectTypes.add(dcl)
                            this.storeUsedTypes(dcl) //look for types used by the type (on the first encounter only)
                        }
                    }
                }
            }
        })
    }


    protected convertToDryClass(classDec: ClassDeclaration):ClassDeclaration{
        classDec.getChildrenOfKind(SyntaxKind.Decorator).forEach(d=>d.remove())
        classDec.getChildrenOfKind(SyntaxKind.Constructor).forEach(d=>d.remove())
        classDec.getChildrenOfKind(SyntaxKind.MethodDeclaration).forEach(d=>d.remove())
        classDec.getChildrenOfKind(SyntaxKind.GetAccessor) //TODO handle accessors
        classDec.getChildrenOfKind(SyntaxKind.SetAccessor)
        classDec.getProperties().forEach(prop=>{
            prop.removeInitializer()
        })
        return classDec
    }


    protected reorderClasses() {

        this.display('Reordering classes ...')


        const orderedClasses: ClassDeclaration[] = []
        const parentClsNames = []
        const queue = []

        const classes = this.outputFile.getClasses()
        queue.push(...classes)

        const firstOrder = classes[0]?.getChildIndex()

        while (queue.length) {

            for (let queueIndex = 0; queueIndex < queue.length; queueIndex++) {

                const cls = queue[queueIndex]
                const extendsName = cls.getExtends()?.getText()

                //Standalone classes go first
                if ((!extendsName) || extendsName === 'RootEntity') {
                    orderedClasses.unshift(cls)
                    queue.splice(queueIndex, 1)
                    continue
                }

                //if the parent class exists, insert just after
                const parentIndex = orderedClasses.findIndex(pcls => pcls.getName() === extendsName)
                if (parentIndex > -1) {
                    orderedClasses.splice(parentIndex + 1, 0, cls)
                    queue.splice(queueIndex, 1)
                    continue
                }

                //else keep in queue
                else {
                    continue
                }
            }
        }

        orderedClasses.forEach((c, index) => {
            c.setOrder(index + firstOrder)
        })
    }

    protected getFirstClassOrder() {
        const classes = this.outputFile.getClasses()
        const firstOrder = classes[0]?.getChildIndex()
        return firstOrder || this.getLastImportOrder()
    }

    protected getLastImportOrder(): number {
        return this.outputFile.getImportDeclarations().sort((impDec1, impDec2) => impDec1.getChildIndex() - impDec2.getChildIndex())[0]?.getChildIndex() || 0
    }

    protected renameExports(){
        if(!this.prefix) return
        this.display('Adding prefix ...')
        this.outputFile.getClasses().forEach(x=>x.rename(this.prefix + x.getName()))
        this.outputFile.getInterfaces().forEach(x=>x.rename(this.prefix + x.getName()))
        this.outputFile.getTypeAliases().forEach(x=>x.rename(this.prefix + x.getName()))
        this.outputFile.getVariableDeclarations().forEach(x=>x.getName() !== '_Ignored_' && x.rename(this.prefix + x.getName()))
    }

    protected display(text?: string) {
        process.stdout.clearLine(0)
        text && process.stdout.write('\r' + text)
    }


}
