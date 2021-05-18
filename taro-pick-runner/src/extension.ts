// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'
const fs = require('fs')
const path = require('path')
const babel = require('@babel/core')
import * as json from 'jsonc-parser'

import { PickViewProvider } from './pick_view'
import { Storage } from './storage'

import { recoverOriginConfigFile } from './utils'

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "taro-pick-runner" is now active!')

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand('taro-pick-runner.helloWorld', () => {
    // The code you place here will be executed every time your command is executed

    // Display a message box to the user
    vscode.window.showInformationMessage('Hello World from TaroPickRunner! This is the first step.')
  })

  context.subscriptions.push(disposable)

  disposable = vscode.commands.registerCommand('taro-pick-runner.showTime', () => {
    // The code you place here will be executed every time your command is executed

    // Display a message box to the user
    const code = fs.readFileSync(path.resolve(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath, 'src/app.tsx'), {
      flag: 'r+',
      encoding: 'utf8'
    })
    try {
      console.log('code', code)
      const tree = json.parseTree(code)
      console.log('tree', tree)
      // const script = babel.transformSync('code()', {
      // presets: ['@babel/preset-react', '@babel/preset-typescript'],
      // plugins: [require.resolve('@babel/plugin-proposal-class-properties'), require.resolve('@babel/plugin-proposal-object-rest-spread')],
      // });
      // const fsPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
      // script && console.log(script);
      // fs.writeFileSync(path.resolve(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath, 'src/app2.tsx'), script.code);
    } catch (e) {
      console.log(e)
    }
    vscode.window.showWarningMessage(`Current Time is: ${JSON.stringify(vscode.workspace.workspaceFolders)}`)
  })

  context.subscriptions.push(disposable)

  Storage.mountContext(context)
  Storage.loadData()

  const pickViewProvider = new PickViewProvider(context)
  // vscode.window.registerTreeDataProvider('pickView', pickViewProvider)
  const pickView = vscode.window.createTreeView('pickView', { treeDataProvider: pickViewProvider })
  pickView.onDidChangeSelection((page: any) => {
    console.log('page :>> ', page)
  })
  vscode.commands.registerCommand('pickView.pick', (page: any) => pickViewProvider.pick(page))
  vscode.commands.registerCommand('pickView.unPick', (page: any) => pickViewProvider.unPick(page))
  vscode.commands.registerCommand('taro-pick-runner.updateConfig', () => pickViewProvider.updateConfig())
  vscode.commands.registerCommand('taro-pick-runner.refreshConfig', () => pickViewProvider.refreshConfig())
  vscode.commands.registerCommand('taro-pick-runner.recoverOriginConfigFile', () => {
    recoverOriginConfigFile()
    pickViewProvider._onDidChangeTreeData.fire(undefined)
  })
}

// this method is called when your extension is deactivated
export function deactivate() { }
