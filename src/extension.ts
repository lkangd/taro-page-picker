/*
 * @Author: Curtis.Liong
 * @Date: 2021-05-24 17:27:25
 * @Last Modified by: Curtis.Liong
 * @Last Modified time: 2021-05-29 19:20:51
 */
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'

// components
import { PickViewProvider } from './pick_view'

// utils
import { getAppConfigProvider } from './utils/app_config'
import { Storage } from './storage'

// types
import { ViewItem } from './type'

// const
import { TPP_GENERATE_FLAG } from './const'

const TPP_GENERATE_REGEXP = new RegExp(TPP_GENERATE_FLAG, 'gmi')

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  Storage.init(context)

  const pickViewProvider = new PickViewProvider(context)
  const pickView = vscode.window.createTreeView('pickView', { treeDataProvider: pickViewProvider })
  pickViewProvider.loadTreeView(pickView)

  vscode.commands.registerCommand('pickView.setEntry', (page: ViewItem) => pickViewProvider.setEntry(page))
  vscode.commands.registerCommand('pickView.unPick', (page: ViewItem) => pickViewProvider.unPick(page))
  vscode.commands.registerCommand('pickView.pick', (page: ViewItem) => pickViewProvider.pick(page))

  vscode.commands.registerCommand('pickView.unPickAll', (page: ViewItem) => pickViewProvider.unPickAll(page))
  vscode.commands.registerCommand('pickView.pickAll', (page: ViewItem) => pickViewProvider.pickAll(page))

  vscode.commands.registerCommand('taro-page-picker.revertConfig', () => pickViewProvider.revertConfig())
  vscode.commands.registerCommand('taro-page-picker.reloadConfig', () => pickViewProvider.reloadConfig())
  vscode.commands.registerCommand('taro-page-picker.saveConfig', () => pickViewProvider.saveConfig())
  vscode.commands.registerCommand('taro-page-picker.showAllPages', () => pickViewProvider.showAllPages())
  vscode.commands.registerCommand('taro-page-picker.showPickedPages', () => pickViewProvider.showPickedPages())

  pickView.onDidChangeSelection(pickViewProvider.showPageTextDocument.bind(pickViewProvider))
  vscode.workspace.onDidChangeTextDocument(evt => {
    if (evt.document.fileName !== pickViewProvider.appConfigProvider?.appEntry) return

    if (TPP_GENERATE_REGEXP.test(evt.document.getText())) {
      if (evt.contentChanges.some(change => change.rangeLength <= 1)) {
        vscode.window.showErrorMessage(`Taro-Page-Picker error: 此文件为 TPP 生成，请勿编辑！！！`)
        return
      }
    } else {
      if (evt.contentChanges.every(change => !TPP_GENERATE_REGEXP.test(change.text))) {
        pickViewProvider.reloadConfig()
        return
      }
    }
  })
}

// this method is called when your extension is deactivated
export function deactivate() {
  getAppConfigProvider()?.revertConfig()
}
