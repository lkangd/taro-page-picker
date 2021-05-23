import * as path from 'path'
import * as vscode from 'vscode'

type TIconTheme = 'dark' | 'light'

export const getIconPath = (name: string, suffix: string = 'svg', theme?: TIconTheme): vscode.TreeItem['iconPath'] => {
  if (theme) return path.join(__filename, '..', '..', '..', 'resources', theme, `${name}.${suffix}`)

  return {
    // TODO support light icon
    light: path.join(__filename, '..', '..', '..', 'resources', 'dark', `${name}.${suffix}`),
    dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', `${name}.${suffix}`)
  }
}
