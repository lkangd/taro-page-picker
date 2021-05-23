import * as fs from 'fs'
import * as path from 'path'
import * as vscode from 'vscode'

// types
import { StorageData } from './type'

export namespace Storage {
  export let storageData: StorageData = { pages: {}, scenes: {} }
  export let context: vscode.ExtensionContext

  export const mountContext = (extensionContext: vscode.ExtensionContext) => (context = extensionContext)
  export const getStoragePath = () =>
    path.join(vscode.workspace.workspaceFolders![0].uri.fsPath, '.vscode', 'taro-pick-runner.json')

  export const canSaveDataVerdict = () => {
    // TODO make this configurable
    let ret: boolean = true
    // TODO multiple root support
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length > 1) {
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
      const toSavePath: string = getStoragePath()
      !fs.existsSync(path.dirname(toSavePath)) && fs.mkdirSync(path.dirname(toSavePath))
      fs.writeFileSync(toSavePath, JSON.stringify(storageData, null, '\t'))
    } else {
      context.workspaceState.update('taro-pick-runner', JSON.stringify(storageData))
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
      const toLoadPath: string = getStoragePath()
      if (!fs.existsSync(toLoadPath)) return storageData

      try {
        storageData = JSON.parse(fs.readFileSync(toLoadPath).toString())
      } catch (e) {
        vscode.window.showErrorMessage(`Taro-Pick-Runner load storage error: ${String(e)}`)
      }
    } else {
      storageData = context.workspaceState.get('taro-pick-runner', storageData)
    }

    return storageData
  }
}
