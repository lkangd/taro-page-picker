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
import { AppConfig, TreeItemRoot, TreeItemSubPackage, TreeItemPage } from '../type'

const TPR_GENERATE_REGEXP = new RegExp(TPR_GENERATE_FLAG, 'gmi')

/**
 * Find the very first available path of Taro config file
 * @export
 * @returns {(string | undefined)}
 */
const suffixType = ['tsx', 'ts', 'jsx', 'js']
export const findAppEntry = (): string | undefined => {
  const { workspaceFolders = [] } = vscode.workspace
  for (const folder of workspaceFolders) {
    const fsPath = folder.uri.fsPath
    const entry = suffixType.map(ext => `${path.resolve(fsPath, './src')}/app.${ext}`).find(ext => fs.existsSync(ext))
    if (entry) return entry
  }
}

export const findAppFile = (): string | undefined => {
  const appEntry = findAppEntry()
  if (!appEntry) return

  const appFile = fs.readFileSync(appEntry, 'utf-8')
  if (!TPR_GENERATE_REGEXP.test(appFile)) {
    Storage.saveData({ originAppFile: appFile })
    return appFile
  }
  const { originAppFile } = Storage.storageData
  if (originAppFile && !TPR_GENERATE_REGEXP.test(originAppFile)) {
    return originAppFile
  }
}

let appAst: any
export const findAppConfig = () => {
  const appFile = findAppFile()
  if (!appFile) throw new Error('读取备份配置错误，找不到备份的原始文件或当前为 TPR 生成的配置文件')

  appAst = parse(appFile, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx', 'classProperties']
  })
  let configAst: any
  traverse(appAst, {
    enter(path) {
      if (path.node.type === 'ClassProperty' && (path.node?.key as { name: string }).name === 'config') {
        configAst = path.node.value
      }
    }
  })

  const configJSON = generator(configAst).code
  if (!configJSON) throw new Error('解析错误，缺少 config 属性：' + configJSON)

  const config: AppConfig = JSON.parse(configJSON)
  return config
}
