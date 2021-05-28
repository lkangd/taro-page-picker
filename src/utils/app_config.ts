/*
 * @Author: Curtis.Liong
 * @Date: 2021-05-24 17:27:08
 * @Last Modified by: Curtis.Liong
 * @Last Modified time: 2021-05-27 17:09:01
 */
import * as fs from 'fs'
import * as path from 'path'
import * as vscode from 'vscode'
import { parse } from '@babel/parser'
import traverse from '@babel/traverse'
import generator from '@babel/generator'

import { Storage } from '../storage'

// const
import { TPP_GENERATE_FLAG, TPP_WARNING } from '../const'

// utils
import { entryToVscodeDir } from '../utils'

// types
import { AppConfig } from '../type'

const TPP_GENERATE_REGEXP = new RegExp(TPP_GENERATE_FLAG, 'gmi')

abstract class AppConfigProvider {
  public appEntry?: string
  public appConfig: AppConfig = { pages: [] }
  public appFile?: string
  protected appFileName?: string
  protected appAst?: any
  protected workspaceFolder?: vscode.WorkspaceFolder

  suffixType = ['tsx', 'ts', 'jsx', 'js']

  constructor(appFileName: string) {
    this.appFileName = appFileName
  }

  public setWorkspaceFolder(workspaceFolder: vscode.WorkspaceFolder): void {
    this.workspaceFolder = workspaceFolder
  }

  public findAppEntry(): string | undefined {
    const fsPath = this.workspaceFolder?.uri.fsPath
    if (!fsPath) return

    const entry = this.suffixType
      .map(ext => `${path.resolve(fsPath, './src')}/${this.appFileName}.${ext}`)
      .find(ext => fs.existsSync(ext))
    if (entry) {
      this.appEntry = entry
      return entry
    }
  }

  public findAppFile(): string | undefined {
    if (!this.findAppEntry()) return

    const file = fs.readFileSync(this.appEntry!, 'utf-8')
    const ifExistStoragePath = entryToVscodeDir(this.appEntry!)
    const ifExistStorageData = Storage.loadData({ path: ifExistStoragePath, update: false })
    if (!TPP_GENERATE_REGEXP.test(file)) {
      this.appFile = file
      return file
    }
    const { originAppFile } = ifExistStorageData
    if (originAppFile && !TPP_GENERATE_REGEXP.test(originAppFile)) {
      this.appFile = originAppFile
      return originAppFile
    }
  }

  public findAppAst(): string | undefined {
    if (!this.findAppFile()) return

    this.appAst = parse(this.appFile!, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx', 'classProperties']
    })
    return this.appAst
  }

  public revertConfig() {
    if (!Storage.storageData.originAppFile || !this.appEntry) return

    fs.writeFileSync(this.appEntry, Storage.storageData.originAppFile)
  }

  abstract findAppConfig(): AppConfig | undefined
  abstract updateAppFile(config: AppConfig): void
}

export class AppConfigProviderV1V2 extends AppConfigProvider {
  static instance?: AppConfigProviderV1V2
  constructor() {
    super('app')

    return AppConfigProviderV1V2.instance || (AppConfigProviderV1V2.instance = this)
  }

  public findAppConfig(): AppConfig | undefined {
    if (!this.findAppAst()) return

    let configAst: any
    traverse(this.appAst, {
      enter(path) {
        if (path.node.type === 'ClassProperty' && (path.node?.key as { name: string }).name === 'config') {
          configAst = path.node.value
        }
      }
    })

    const configJSON = generator(configAst).code
    if (!configJSON) return

    const config: AppConfig = new Function(`return ${configJSON}`)()
    if (Object.prototype.toString.call(config) !== '[object Object]') return

    this.appConfig = config
    return config
  }

  public updateAppFile(config: AppConfig) {
    const _appAst: any = parse(
      `class App extends Component {
          config: Config = ${JSON.stringify({ ...config }, null, '\t')}
      }`,
      {
        sourceType: 'module',
        plugins: ['classProperties', 'jsx', 'typescript']
      }
    )
    let _configAst: any
    traverse(_appAst, {
      enter(path) {
        if (path.node.type === 'ClassProperty' && (path.node?.key as { name: string }).name === 'config') {
          _configAst = path.node.value
        }
      }
    })

    traverse(this.appAst, {
      enter(path) {
        if (path.node.type === 'ClassProperty' && (path.node?.key as { name: string }).name === 'config') {
          path.node.value = _configAst
        }
      }
    })

    const appEntryCode = `${TPP_WARNING}${
      generator(this.appAst, {
        comments: false,
        jsescOption: { quotes: 'single' }
      }).code
    }${TPP_WARNING}`

    this.appEntry && fs.writeFileSync(this.appEntry, appEntryCode)
  }
}

export class AppConfigProviderV3 extends AppConfigProvider {
  static instance?: AppConfigProviderV3
  constructor() {
    super('app.config')

    return AppConfigProviderV3.instance || (AppConfigProviderV3.instance = this)
  }

  public findAppConfig(): AppConfig | undefined {
    if (!this.findAppAst()) return

    let configAst: any
    traverse(this.appAst, {
      enter(path) {
        if (
          !configAst &&
          path.node.type === 'ObjectExpression' &&
          path.node.properties.find(property => (property as { key: { name: string } })?.key?.name === 'pages')
        ) {
          configAst = path.node
        }
      }
    })

    const configJSON = generator(configAst).code
    if (!configJSON) return

    const config: AppConfig = new Function(`return ${configJSON}`)()
    if (Object.prototype.toString.call(config) !== '[object Object]') return

    this.appConfig = config
    return config
  }

  public updateAppFile(config: AppConfig) {
    const _appAst: any = parse(`export default ${JSON.stringify({ ...config }, null, '\t')}`, {
      sourceType: 'module',
      plugins: ['classProperties', 'jsx', 'typescript']
    })
    let _configAst: any
    traverse(_appAst, {
      enter(path) {
        if (
          !_configAst &&
          path.node.type === 'ObjectExpression' &&
          path.node.properties.find(property => (property as { key: { value: string } })?.key?.value === 'pages')
        ) {
          _configAst = path.node
        }
      }
    })

    let replaced = false
    traverse(this.appAst, {
      enter(path) {
        if (
          !replaced &&
          path.node.type === 'ObjectExpression' &&
          path.node.properties.find(property => (property as { key: { name: string } })?.key?.name === 'pages')
        ) {
          Object.defineProperty(path, 'node', {
            value: _configAst
          })
          replaced = true
        }
      }
    })

    const appEntryCode = `${TPP_WARNING}${
      generator(_appAst, {
        comments: false,
        jsescOption: { quotes: 'single' }
      }).code
    }${TPP_WARNING}`

    this.appEntry && fs.writeFileSync(this.appEntry, appEntryCode)
  }
}

export type TAppConfigProvider = AppConfigProviderV1V2 | AppConfigProviderV3

let instance: TAppConfigProvider | undefined = undefined
export const getAppConfigProvider = (): TAppConfigProvider | undefined => {
  if (instance) return instance

  let error: any
  const { workspaceFolders = [] } = vscode.workspace
  for (const folder of workspaceFolders) {
    try {
      instance = new AppConfigProviderV1V2()
      instance.setWorkspaceFolder(folder)
      if (instance.findAppConfig()) return instance
      throw new Error('读取备份配置错误，找不到配置文件或当前为 TPP 生成的配置文件')
    } catch (e) {
      error = e
    }
    try {
      instance = new AppConfigProviderV3()
      instance.setWorkspaceFolder(folder)
      if (instance.findAppConfig()) return instance
      throw new Error('读取备份配置错误，找不到配置文件或当前为 TPP 生成的配置文件')
    } catch (e) {
      error = e
    }
  }

  error && vscode.window.showErrorMessage(`Taro-Page-Picker error: ${String(error)}`)
  instance = undefined
}
