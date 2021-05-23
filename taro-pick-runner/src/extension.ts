// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'

// components
import { PickViewProvider } from './pick_view'

// utils
import { revertConfig } from './utils'
import { Storage } from './storage'

// types
import { ViewItem } from './type'

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  Storage.mountContext(context)
  Storage.loadData()

  const pickViewProvider = new PickViewProvider()
  const pickView = vscode.window.createTreeView('pickView', { treeDataProvider: pickViewProvider })
  pickView.onDidChangeSelection(selection => { console.log(selection) })

  vscode.commands.registerCommand('pickView.setEntry', (page: ViewItem) => pickViewProvider.setEntry(page))
  vscode.commands.registerCommand('pickView.unPick', (page: ViewItem) => pickViewProvider.unPick(page))
  vscode.commands.registerCommand('pickView.pick', (page: ViewItem) => pickViewProvider.pick(page))

  vscode.commands.registerCommand('pickView.unPickAll', (page: ViewItem) => pickViewProvider.unPickAll(page))
  vscode.commands.registerCommand('pickView.pickAll', (page: ViewItem) => pickViewProvider.pickAll(page))

  vscode.commands.registerCommand('taro-pick-runner.revertConfig', () => pickViewProvider.revertConfig())
  vscode.commands.registerCommand('taro-pick-runner.reloadConfig', () => pickViewProvider.reloadConfig())
  vscode.commands.registerCommand('taro-pick-runner.saveConfig', () => pickViewProvider.saveConfig())
}

// this method is called when your extension is deactivated
export function deactivate() { revertConfig() }
