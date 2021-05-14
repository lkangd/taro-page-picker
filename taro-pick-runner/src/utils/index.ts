import * as fs from 'fs'
import * as path from 'path'
import * as vscode from 'vscode'
import { parse } from '@babel/parser'
import traverse from '@babel/traverse'
import generator from '@babel/generator'

// types
import { AppConfig, TreeItemRoot, TreeItemSubRoot, TreeItemPage } from '../type';

const DEFAULT_APP_CONFIG: AppConfig = { pages: [] }

export const getAppConfig = (): AppConfig => {
  const appEntryBase = vscode.workspace.workspaceFolders?.[0].uri.fsPath
  const files = ['js', 'ts', 'jsx', 'tsx'].map(ext => `${path.resolve(appEntryBase!, './src')}/app.${ext}`)

  const appEntry = files.find((ext) => fs.existsSync(ext))
  if (!appEntry) { return DEFAULT_APP_CONFIG }

  const rawFile = fs.readFileSync(appEntry, 'utf-8')
  const originAst = parse(rawFile, {
    sourceType: 'module',
    plugins: ['classProperties', 'jsx', 'typescript'],
  })

  let retAst: any
  traverse(originAst, {
    enter(path) {
      if (
        path.node.type === 'ClassProperty' &&
        (path.node?.key as { name: string }).name === 'config'
      ) {
        retAst = path.node.value
      }
    },
  })

  const appConfigStr = generator(retAst).code
  if (!appConfigStr) { return DEFAULT_APP_CONFIG }

  try {
    const appConfig: AppConfig = new Function(`return ${appConfigStr}`)()
    if (Object.prototype.toString.call(appConfig) === '[object Object]') { return appConfig }

    throw new Error('解析错误' + appConfig)
  } catch (err) {
    return DEFAULT_APP_CONFIG
  }
}

const processOriginPages = (pages: string[], parent?: string, tabBarPages?: Record<string, true>): TreeItemPage[] => {
  return pages.map(path => ({
    path,
    isPicked: true,
    isNecessary: tabBarPages?.[path] || false,
    parent
  }))
}

export const getTreeData = (): TreeItemRoot => {
  const appConfig: AppConfig = getAppConfig()
  const tabBarPagesMap: Record<string, true> = (() => {
    if (!appConfig.tabBar) { return {} }

    return appConfig.tabBar.list.reduce((map, item) => {
      map[item.pagePath] = true
      return map
    }, {} as Record<string, true>)
  })()

  const pages: TreeItemPage[] = processOriginPages(appConfig.pages || [], undefined, tabBarPagesMap)
  const subPackages: TreeItemSubRoot[] = (() => {
    const tempRet = appConfig.subPackages || []
    return tempRet.map((item: { root: string, pages: string[] }) => ({
      root: item.root,
      pages: processOriginPages(item.pages || [], item.root)
    }))
  })()

  return {
    pages,
    subPackages
  }
}