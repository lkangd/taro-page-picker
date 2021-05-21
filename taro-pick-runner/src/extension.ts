// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'

import { revertConfig } from './utils'
import { PickViewProvider } from './pick_view'
import { Storage } from './storage'

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  Storage.mountContext(context)
  Storage.loadData()

  const pickViewProvider = new PickViewProvider()
  const pickView = vscode.window.createTreeView('pickView', { treeDataProvider: pickViewProvider })
  pickView.onDidChangeSelection(page => { console.log(page) })

  vscode.commands.registerCommand('pickView.setEntry', (page: any) => pickViewProvider.setEntry(page))
  vscode.commands.registerCommand('pickView.unPick', (page: any) => pickViewProvider.unPick(page))
  vscode.commands.registerCommand('pickView.pick', (page: any) => pickViewProvider.pick(page))

  vscode.commands.registerCommand('pickView.unPickAll', (page: any) => pickViewProvider.unPickAll(page))
  vscode.commands.registerCommand('pickView.pickAll', (page: any) => pickViewProvider.pickAll(page))

  vscode.commands.registerCommand('taro-pick-runner.revertConfig', () => {
    revertConfig()
    pickViewProvider.refreshTreeView()
  })
  vscode.commands.registerCommand('taro-pick-runner.reloadConfig', () => pickViewProvider.reloadConfig())
  vscode.commands.registerCommand('taro-pick-runner.saveConfig', () => pickViewProvider.saveConfig())
}

// this method is called when your extension is deactivated
export function deactivate() { revertConfig() }
