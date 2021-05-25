/*
 * @Author: Curtis.Liong
 * @Date: 2021-05-24 17:33:11
 * @Last Modified by: Curtis.Liong
 * @Last Modified time: 2021-05-25 13:15:16
 */
import * as fs from 'fs'
import * as path from 'path'
import * as vscode from 'vscode'

// const
import { TPR_STORAGE_NAME } from './const'

// utils
import { getAppConfigProvider } from './utils/app_config'

// types
import { StorageData } from './type'

export namespace Storage {
  export let storageData: StorageData = { pages: {}, scenes: {} }
  export let context: vscode.ExtensionContext
  export let storagePath: string

  export const init = (extensionContext: vscode.ExtensionContext) => {
    context = extensionContext
    loadData()
  }

  export const getStoragePath = (): string | undefined => {
    const appEntry = getAppConfigProvider().findAppEntry()
    if (!appEntry) return

    return path.join(appEntry.replace(/\/src\/app\..*$/, ''), '.vscode', TPR_STORAGE_NAME)
  }

  export const canSaveDataVerdict = () => {
    // TODO make this configurable
    let ret: boolean = true

    if (!getStoragePath()) {
      ret = false
    }

    return ret
  }

  /**
   * 保存配置文件到.vscode/taro-pick-runner.json 中
   * 如果没有权限，则 fallback 到 workspaceState 中
   * @return {StorageData}
   */
  export const saveData = (toSaveData: StorageData, overWrite = false) => {
    console.log(`========================================`)
    console.log(`Taro-Pick-Runner Save Data`, toSaveData)
    console.log(`========================================`)
    if (overWrite) {
      storageData = toSaveData
    } else {
      if (toSaveData.originAppFile !== undefined) {
        storageData.originAppFile = toSaveData.originAppFile
      }
      if (toSaveData.pages !== undefined) {
        storageData.pages = { ...(toSaveData.pages || {}) }
      }
      if (toSaveData.scenes !== undefined) {
        storageData.scenes = { ...(toSaveData.scenes || {}) }
      }
    }

    const _canSaveDataToProject = canSaveDataVerdict()
    if (_canSaveDataToProject) {
      const toSavePath: string = getStoragePath()!
      !fs.existsSync(path.dirname(toSavePath)) && fs.mkdirSync(path.dirname(toSavePath))
      fs.writeFileSync(toSavePath, JSON.stringify(storageData, null, '\t'))
    } else {
      context.workspaceState.update('taro-pick-runner', JSON.stringify(storageData, null, '\t'))
    }
  }

  /**
   * 读取配置文件.vscode/taro-pick-runner.json
   * 如果没有权限，则 fallback 到 workspaceState 中
   * @return {StorageData}
   */
  export const loadData = () => {
    const _canSaveDataToProject = canSaveDataVerdict()

    if (_canSaveDataToProject) {
      const toLoadPath: string = getStoragePath()!
      if (!fs.existsSync(toLoadPath)) return storageData

      try {
        storageData = JSON.parse(fs.readFileSync(toLoadPath).toString())
      } catch (e) {
        vscode.window.showErrorMessage(`Taro-Pick-Runner error: load storage "${String(e)}"`)
      }
    } else {
      storageData = context.workspaceState.get('taro-pick-runner', storageData)
    }

    return storageData
  }
}
