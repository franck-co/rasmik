import path from 'path'
import { execSync } from 'child_process';
import { DryEntitiesGenerator, DryEntitiesGeneratorSettings } from './DryEntitiesGenerator';
import { Node } from 'ts-morph';
// import libClient from './lib/client'
// import libRasmikTypes from './lib/rasmikTypes'
// import libMikroOrmTypes from './lib/mikroOrmTypes'

//1. copy and create files as if they were in in the current project
//2. emit to compilerOptions.outDir

interface ClientGeneratorSettings extends Omit<DryEntitiesGeneratorSettings, 'outputFilePathRel' | 'pathToRasmikTypes'> {
    outDir: string
    clearOutputDir?: boolean

}

export class ClientGenerator extends DryEntitiesGenerator {

    constructor(settings: ClientGeneratorSettings) {

        super({
            entitiesOutputFileName: 'entities.ts',
            pathToRasmikTypes: './lib',
            prefix: settings.prefix,
            sourcesGlob: settings.sourcesGlob,
            emit: settings.emit,
            disableFeedback: true,
            compilerOptions: settings.compilerOptions,
            outDir:settings.outDir
        })

        this.clearOutputDir = settings.clearOutputDir ?? false
        this.outputDirPathAbsolute = settings.outDir.startsWith('/') ? settings.outDir : path.join(process.cwd(), settings.outDir)
    }

    public clearOutputDir: boolean
    public outputDirPathAbsolute: string



    public async generate() {



        this.display('initializing folders ...')
        this.doClearOutputDir()
        // await mkdirp(path.join(this.outputDirPathAbsolute, '/lib/typings'))


        //init ts-morph
        this.display('initializing project ...')
        this.initProject()

        this.display('copy lib ...')
        const {libDir,libFiles} = this.addLib()
        this.addIndex()




        this.processEntitiesDir()

        this.outputFile.insertStatements(this.getLastImportOrder() + 1, Array.from(this.projectTypes).sort((decA, decB) => (Node.isVariableStatement(decA) ? 0 : 1) - (Node.isVariableStatement(decB) ? 0 : 1)).map(dec => dec.getText()))
        this.reorderClasses()


        this.outputFile.replaceWithText(this.outputFile.print({ removeComments: true }))

        this.renameExports()
        if (this.emit) {
            this.outputFile.emitSync()
            libDir.emitSync()
        } else {
            this.outputFile.saveSync()
            libDir.saveSync()
        }



        this.display('') //remove DryEntitiesGenerator message

        this.display(`Client generated succesfully at ${this.outDir} !` + (this.excluded.length ? `
${this.excluded.length} types couldn't be included because they are too dependant on other types :

${this.excluded.join('\n')}
`: `
All the types are included.\n`)


        )


    }


    private doClearOutputDir() {
        if (!this.clearOutputDir) return
        if (process.platform === 'win32') {
            execSync(`del /f /s ${this.outputDirPathAbsolute}`)
        } else {
            execSync(`rm -rf ${this.outputDirPathAbsolute}`)
        }
    }



    addLib() {
        const libFilesFullPath = this.emit ? './lib' : path.join(this.outDir, './lib')

        const libFiles = this.project.addSourceFilesAtPaths(path.join(__dirname, './lib/**/*.*'))
        const libDirSource = this.project.getDirectoryOrThrow(path.join(__dirname, './lib'));
        const libDir = libDirSource.copy(libFilesFullPath)
        return {libFiles, libDir}
      
        // const copiedFiles = libFiles.map(file => {
        //     const folderPathInLib = file.getDirectoryPath().replace(new RegExp('^' + path.join(__dirname, './lib')), '')
        //     return fs.promises.copyFile(path.join(__dirname, './lib', folderPathInLib, file.getBaseName()),path.join(this.outputDirPathAbsolute, './lib', folderPathInLib, file.getBaseName()))
        // })

        // await Promise.all(copiedFiles)
    }

    addIndex() {
        const indexFileFullPath = this.emit ? 'index.ts' : path.join(this.outDir, 'index.ts')
        const index = this.project.createSourceFile(indexFileFullPath,
            `export * from './lib'
export * from './entities'`
            , { overwrite: true })


        if (this.emit) {
            index.emitSync()
        } else {
            index.saveSync()
        }

    }


}