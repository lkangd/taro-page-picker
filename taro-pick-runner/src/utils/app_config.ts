/*
 * @Author: Curtis.Liong
 * @Date: 2021-05-24 17:27:08
 * @Last Modified by: Curtis.Liong
 * @Last Modified time: 2021-05-25 19:22:27
 */
import * as fs from 'fs'
import * as path from 'path'
import * as vscode from 'vscode'
import { parse } from '@babel/parser'
import traverse from '@babel/traverse'
import generator from '@babel/generator'

import { Storage } from '../storage'

// const
import { TPR_GENERATE_FLAG, TPR_WARNING } from '../const'

// types
import { AppConfig } from '../type'

const TPR_GENERATE_REGEXP = new RegExp(TPR_GENERATE_FLAG, 'gmi')

abstract class AppConfigProvider {
  public appConfig: AppConfig = { pages: [] }
  protected appFileName?: string
  protected appEntry?: string
  protected appFile?: string
  protected appAst?: any

  suffixType = ['tsx', 'ts', 'jsx', 'js']

  constructor(appFileName: string) {
    this.appFileName = appFileName
  }

  public findAppEntry(): string | undefined {
    const { workspaceFolders = [] } = vscode.workspace
    for (const folder of workspaceFolders) {
      const fsPath = folder.uri.fsPath
      const entry = this.suffixType
        .map(ext => `${path.resolve(fsPath, './src')}/${this.appFileName}.${ext}`)
        .find(ext => fs.existsSync(ext))
      if (entry) {
        this.appEntry = entry
        return entry
      }
    }
  }

  public findAppFile(): string | undefined {
    if (!this.findAppEntry()) return

    const file = fs.readFileSync(this.appEntry!, 'utf-8')
    if (!TPR_GENERATE_REGEXP.test(file)) {
      Storage.saveData({ originAppFile: file })
      this.appFile = file
      return file
    }
    const { originAppFile } = Storage.storageData
    if (originAppFile && !TPR_GENERATE_REGEXP.test(originAppFile)) {
      this.appFile = originAppFile
      return originAppFile
    }
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
    const appFile = this.findAppFile()
    if (!appFile) {
      const e = '读取备份配置错误，找不到备份的原始文件或当前为 TPR 生成的配置文件'
      vscode.window.showErrorMessage(`Taro-Pick-Runner error: ${String(e)}`)
      return
    }

    this.appAst = parse(appFile, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx', 'classProperties']
    })

    let configAst: any
    traverse(this.appAst, {
      enter(path) {
        if (path.node.type === 'ClassProperty' && (path.node?.key as { name: string }).name === 'config') {
          configAst = path.node.value
        }
      }
    })

    const configJSON = generator(configAst).code
    if (!configJSON) {
      const e = '解析错误，缺少 config 属性：' + configJSON
      vscode.window.showErrorMessage(`Taro-Pick-Runner error: ${String(e)}`)
      return
    }

    const config: AppConfig = new Function(`return ${configJSON}`)()
    if (Object.prototype.toString.call(config) !== '[object Object]') {
      const e = '解析错误' + config
      vscode.window.showErrorMessage(`Taro-Pick-Runner error: ${String(e)}`)
      return
    }

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

    const appEntryCode = `${TPR_WARNING}${
      generator(this.appAst, {
        comments: false,
        jsescOption: { quotes: 'single' }
      }).code
    }${TPR_WARNING}`

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
    const appFile = this.findAppFile()
    if (!appFile) {
      const e = '读取备份配置错误，找不到备份的原始文件或当前为 TPR 生成的配置文件'
      vscode.window.showErrorMessage(`Taro-Pick-Runner error: ${String(e)}`)
      return
    }

    this.appAst = parse(appFile, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx', 'classProperties']
    })

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
    if (!configJSON) {
      const e = '解析错误，缺少 config 属性：' + configJSON
      vscode.window.showErrorMessage(`Taro-Pick-Runner error: ${String(e)}`)
      return
    }

    const config: AppConfig = new Function(`return ${configJSON}`)()
    if (Object.prototype.toString.call(config) !== '[object Object]') {
      const e = '解析错误' + config
      vscode.window.showErrorMessage(`Taro-Pick-Runner error: ${String(e)}`)
      return
    }

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

    const appEntryCode = `${TPR_WARNING}${
      generator(_appAst, {
        comments: false,
        jsescOption: { quotes: 'single' }
      }).code
    }${TPR_WARNING}`

    this.appEntry && fs.writeFileSync(this.appEntry, appEntryCode)
  }
}

export type TAppConfigProvider = AppConfigProviderV1V2 | AppConfigProviderV3
export const getAppConfigProvider = (): TAppConfigProvider => new AppConfigProviderV3()
