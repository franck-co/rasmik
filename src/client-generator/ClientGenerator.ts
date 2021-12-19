import path from 'path'
import mkdirp from 'mkdirp'
import { execSync } from 'child_process';
import { DryEntitiesGenerator, DryEntitiesGeneratorSettings } from './DryEntitiesGenerator';
import fs from 'fs'
// import libClient from './lib/client'
// import libRasmikTypes from './lib/rasmikTypes'
// import libMikroOrmTypes from './lib/mikroOrmTypes'



interface ClientGeneratorSettings extends Omit<DryEntitiesGeneratorSettings, 'outputFilePathRel' | 'pathToRasmikTypes'> {
    outputDirPath: string
    clearOutputDir?: boolean

}

export class ClientGenerator extends DryEntitiesGenerator {

    constructor(settings: ClientGeneratorSettings) {

        super({
            outputFilePathRel: settings.outputDirPath + '/entities.ts',
            pathToRasmikTypes: './lib',
            prefix: settings.prefix,
            sourcesGlob: settings.sourcesGlob,
            emit: settings.emit,
            disableFeedback:true,
            compilerOptions:settings.compilerOptions
        })

        this.clearOutputDir = settings.clearOutputDir ?? false
        this.outputDirPathAbsolute = path.join(process.cwd(), settings.outputDirPath)
    }

    public clearOutputDir: boolean
    public outputDirPathAbsolute: string



    public  async generate() {

        this.display('initializing folders ...')
        this.doClearOutputDir()
        await mkdirp(path.join(this.outputDirPathAbsolute,'/lib/typings'))



        this.display('copy lib ...')
        this.initProject()
        await this.copyLib()
        this.addIndex()


        DryEntitiesGenerator.prototype.generate.call(this)
        this.display('') //remove DryEntitiesGenerator message

        this.display(`Client generated succesfully at ${this.outputDirPathAbsolute} !` + (this.excluded.length ? `
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



    async copyLib() {
        const libFiles = this.project.addSourceFilesAtPaths(path.join(__dirname, './lib/**/*.*'))

        const copiedFiles = libFiles.map(file => {
            const folderPathInLib = file.getDirectoryPath().replace(new RegExp('^' + path.join(__dirname, './lib')), '')
            return fs.promises.copyFile(path.join(__dirname, './lib', folderPathInLib, file.getBaseName()),path.join(this.outputDirPathAbsolute, './lib', folderPathInLib, file.getBaseName()))
        })

        await Promise.all(copiedFiles)
    }

    addIndex() {
        const index = this.project.createSourceFile(path.join(this.outputDirPathAbsolute, 'index.ts'),
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