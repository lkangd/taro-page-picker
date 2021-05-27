/*
 * @Author: Curtis.Liong
 * @Date: 2021-05-24 17:33:11
 * @Last Modified by: Curtis.Liong
 * @Last Modified time: 2021-05-27 17:08:27
 */
import * as fs from 'fs'
import * as path from 'path'
import * as vscode from 'vscode'

// utils
import { getAppConfigProvider } from './utils/app_config'
import { entryToVscodeDir } from './utils'

// types
import { StorageData } from './type'

export namespace Storage {
  const getDefaultData = (): StorageData => ({ pages: {}, scenes: {} })

  export let storageData: StorageData = getDefaultData()
  export let context: vscode.ExtensionContext
  export let storagePath: string

  export const init = (extensionContext: vscode.ExtensionContext) => {
    context = extensionContext
  }

  export const getStoragePath = (): string | undefined => {
    const appEntry = getAppConfigProvider()?.appEntry
    if (!appEntry) return

    return entryToVscodeDir(appEntry)
  }

  export const canSaveDataVerdict = () => {
    // TODO make this configurable
    let ret: boolean = true
    return ret
  }

  /**
   * 保存配置文件到.vscode/taro-page-picker.json 中
   * 如果没有权限，则 fallback 到 workspaceState 中
   * @param {SaveDataOpt} { data, storagePath, writeFile = true, overWrite = false }
   */
  interface SaveDataOpt {
    data: StorageData
    storagePath?: string
    writeFile?: boolean
    overWrite?: boolean
  }
  export const saveData = ({ data, storagePath, writeFile = true, overWrite = false }: SaveDataOpt) => {
    console.log(`========================================`)
    console.log(`Taro-Page-Picker Save Data`, data)
    console.log(`========================================`)
    if (overWrite) {
      storageData = data
    } else {
      if (data.originAppFile !== undefined) {
        storageData.originAppFile = data.originAppFile
      }
      if (data.pages !== undefined) {
        storageData.pages = { ...(data.pages || {}) }
      }
      if (data.scenes !== undefined) {
        storageData.scenes = { ...(data.scenes || {}) }
      }
    }

    const _canSaveDataToProject = canSaveDataVerdict() && !!storagePath
    if (_canSaveDataToProject) {
      if (writeFile) {
        !fs.existsSync(path.dirname(storagePath!)) && fs.mkdirSync(path.dirname(storagePath!))
        fs.writeFileSync(storagePath!, JSON.stringify(storageData, null, '\t'))
      }
    } else {
      context.workspaceState.update('taro-page-picker', JSON.stringify(storageData, null, '\t'))
    }
  }

  /**
   * 读取配置文件.vscode/taro-page-picker.json
   * 如果没有权限，则 fallback 到 workspaceState 中
   * @param {LoadDataOpt} [{ path, update }={ path: getStoragePath(), update: true }]
   * @return {StorageData}
   */
  interface LoadDataOpt {
    path?: string
    update?: boolean
  }
  export const loadData = ({ path, update = true }: LoadDataOpt = {}) => {
    let ret: StorageData = { pages: {}, scenes: {} }
    const _canSaveDataToProject = canSaveDataVerdict() && !!path && fs.existsSync(path)

    if (_canSaveDataToProject) {
      try {
        ret = JSON.parse(fs.readFileSync(path!).toString())
      } catch (e) {
        vscode.window.showErrorMessage(`Taro-Page-Picker error: load storage "${String(e)}"`)
      }
    } else {
      ret = context.workspaceState.get('taro-page-picker', ret)
    }
    update &&
      saveData({
        data: ret,
        storagePath: path
      })

    return ret
  }
}
