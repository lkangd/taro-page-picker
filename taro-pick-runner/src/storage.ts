import * as fs from 'fs'
import * as path from 'path'
import * as vscode from 'vscode'

// types
import { StorageData } from './type'

export namespace Storage {
  export let storageData: StorageData = { pages: {}, scenes: {} }
  export let context: vscode.ExtensionContext

  export const mountContext = (extensionContext: vscode.ExtensionContext) => context = extensionContext

  export const canSaveDataVerdict = () => {
    // TODO make this configurable
    let ret: boolean = true
    // TODO multiple root support
    if (!vscode.workspace.workspaceFolders || (vscode.workspace.workspaceFolders.length > 1)) {
      ret = false
    }

    return ret
  }

  export const saveData = (toSaveData: StorageData, overWrite = false) => {
    console.log('storageData :>> ', storageData);
    if (overWrite) {
      storageData = toSaveData
    } else {
      storageData = { pages: { ...(storageData.pages || {}), ...(toSaveData.pages || {}) }, scenes: { ...(storageData.scenes || {}), ...(toSaveData.scenes || {}) }, originConfigFile: toSaveData.originConfigFile || storageData.originConfigFile }
    }

    const _canSaveDataToProject = canSaveDataVerdict()

    if (_canSaveDataToProject) {
      const toSavePath: string = path.join(vscode.workspace.workspaceFolders![0].uri.fsPath, '.vscode', 'taro-pick-runner.json')
      !fs.existsSync(path.dirname(toSavePath)) && fs.mkdirSync(path.dirname(toSavePath))

      fs.writeFileSync(toSavePath, JSON.stringify(storageData, null, '\t'))
    } else {
      context.workspaceState.update('taro-pick-runner', JSON.stringify(storageData))
    }
  }

  export const loadData = () => {
    const _canSaveDataToProject = canSaveDataVerdict()

    if (_canSaveDataToProject) {
      const toLoadPath: string = path.join(vscode.workspace.workspaceFolders![0].uri.fsPath, '.vscode', 'taro-pick-runner.json')

      if (!fs.existsSync(toLoadPath)) { return storageData }

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