/*
 * @Author: Curtis.Liong
 * @Date: 2021-05-24 17:27:25
 * @Last Modified by: Curtis.Liong
 * @Last Modified time: 2021-05-25 13:09:14
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

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  Storage.init(context)

  const pickViewProvider = new PickViewProvider(context)
  const pickView = vscode.window.createTreeView('pickView', { treeDataProvider: pickViewProvider })
  pickView.onDidChangeSelection(selection => { console.log(selection) })

  vscode.commands.registerCommand('pickView.setEntry', (page: ViewItem) => pickViewProvider.setEntry(page))
  vscode.commands.registerCommand('pickView.unPick', (page: ViewItem) => pickViewProvider.unPick(page))
  vscode.commands.registerCommand('pickView.pick', (page: ViewItem) => pickViewProvider.pick(page))

  vscode.commands.registerCommand('pickView.unPickAll', (page: ViewItem) => pickViewProvider.unPickAll(page))
  vscode.commands.registerCommand('pickView.pickAll', (page: ViewItem) => pickViewProvider.pickAll(page))

  vscode.commands.registerCommand('taro-page-picker.revertConfig', () => pickViewProvider.revertConfig())
  vscode.commands.registerCommand('taro-page-picker.reloadConfig', () => pickViewProvider.reloadConfig())
  vscode.commands.registerCommand('taro-page-picker.saveConfig', () => pickViewProvider.saveConfig())
}

// this method is called when your extension is deactivated
export function deactivate() { getAppConfigProvider()?.revertConfig() }
