/*
 * @Author: Curtis.Liong
 * @Date: 2021-05-24 17:27:00
 * @Last Modified by:   Curtis.Liong
 * @Last Modified time: 2021-05-24 17:27:00
 */
import * as path from 'path'
import * as vscode from 'vscode'

type TIconTheme = 'dark' | 'light'

export const getIconPath = (name: string, suffix: string = 'svg', theme?: TIconTheme): vscode.TreeItem['iconPath'] => {
  if (theme) return path.join(__dirname, '..', 'resources', theme, `${name}.${suffix}`)

  return {
    // TODO support light icon
    light: path.join(__dirname, '..', 'resources', 'dark', `${name}.${suffix}`),
    dark: path.join(__dirname, '..', 'resources', 'dark', `${name}.${suffix}`)
  }
}
