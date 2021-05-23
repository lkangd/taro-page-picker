import * as fs from 'fs'
import * as path from 'path'
import * as vscode from 'vscode'
import { parse } from '@babel/parser'
import traverse from '@babel/traverse'
import generator from '@babel/generator'

import { Storage } from '../storage'

// const
import { TPR_GENERATE_FLAG, TPR_WARNING } from '../const'

// types
import { AppConfig, TreeItemRoot, TreeItemSubPackage, TreeItemPage } from '../type'

const DEFAULT_APP_CONFIG: AppConfig = { pages: [] }

let originAst: any
let appEntry: any

export const getAppConfig = (): AppConfig => {
  const appEntryBase = vscode.workspace.workspaceFolders?.[0].uri.fsPath
  if (!appEntryBase) throw new Error('目录不存在')

  const files = ['js', 'ts', 'jsx', 'tsx'].map(ext => `${path.resolve(appEntryBase, './src')}/app.${ext}`)

  appEntry = files.find(ext => fs.existsSync(ext))
  if (!appEntry) return DEFAULT_APP_CONFIG

  let rawFile = fs.readFileSync(appEntry, 'utf-8')
  if (new RegExp(TPR_GENERATE_FLAG, 'gmi').test(rawFile)) {
    const { originAppFile } = Storage.storageData
    if (!originAppFile || /TPR_GENERATE_FLAG/gim.test(originAppFile)) {
      throw new Error('读取备份配置错误，找不到备份的原始文件且当前为 TPR 生成的配置文件')
    }
    rawFile = originAppFile
  } else {
    Storage.saveData({ originAppFile: rawFile })
  }
  originAst = parse(rawFile, {
    sourceType: 'module',
    plugins: ['classProperties', 'jsx', 'typescript']
  })

  let retAst: any
  traverse(originAst, {
    enter(path) {
      if (path.node.type === 'ClassProperty' && (path.node?.key as { name: string }).name === 'config') {
        retAst = path.node.value
      }
    }
  })

  const appConfigStr = generator(retAst).code
  if (!appConfigStr) {
    return DEFAULT_APP_CONFIG
  }

  try {
    const appConfig: AppConfig = new Function(`return ${appConfigStr}`)()
    if (Object.prototype.toString.call(appConfig) === '[object Object]') {
      return appConfig
    }

    throw new Error('解析错误' + appConfig)
  } catch (err) {
    console.log('err :>> ', err)
    return DEFAULT_APP_CONFIG
  }
}

const processOriginPages = (
  pages: string[] = [],
  tabBarPages?: Record<string, true>,
  parent?: TreeItemSubPackage
): TreeItemPage[] => {
  const {
    storageData: { pages: storagePages }
  } = Storage
  const ret: TreeItemPage[] = pages.map(path => {
    const picked = storagePages?.[`${parent?.root || ''}${path}`]?.picked || tabBarPages?.[path] || false
    const tabbar = tabBarPages?.[path] || false
    const entry = false
    const ret = {
      path,
      picked,
      tabbar,
      entry,
      parent
    }
    Object.defineProperty(ret, 'id', {
      get() {
        return `${ret.parent?.root || ''}${ret.path}`
      }
    })
    return ret
  })

  return ret
}

export const getTreeData = (): [TreeItemRoot, AppConfig] => {
  const appConfig: AppConfig = getAppConfig()
  const tabBarPagesMap: Record<string, true> = (() => {
    if (!appConfig.tabBar) return {}

    return appConfig.tabBar.list.reduce((map, item) => {
      map[item.pagePath] = true

      return map
    }, {} as Record<string, true>)
  })()

  const pages: TreeItemPage[] = processOriginPages(appConfig.pages, tabBarPagesMap)
  const subPackages: TreeItemSubPackage[] = (() => {
    const tempRet = appConfig.subPackages || []
    return tempRet.map((item: { root: string; pages: string[] }) => {
      const ret: TreeItemSubPackage = { root: item.root, pages: [] }
      ret.pages = processOriginPages(item.pages, tabBarPagesMap, ret)

      return ret
    })
  })()

  return [
    {
      pages,
      subPackages
    },
    appConfig
  ]
}

export const updateEntry = (appConfig: any) => {
  const appConfigAst: any = parse(
    `class App extends Component {
        config: Config = ${JSON.stringify({ ...appConfig }, null, '\t')}
  }`,
    {
      sourceType: 'module',
      plugins: ['classProperties', 'jsx', 'typescript']
    }
  )
  let _appConfigAst: any
  traverse(appConfigAst, {
    enter(path) {
      if (path.node.type === 'ClassProperty' && (path.node?.key as { name: string }).name === 'config') {
        _appConfigAst = path.node.value
      }
    }
  })

  traverse(originAst, {
    enter(path) {
      if (path.node.type === 'ClassProperty' && (path.node?.key as { name: string }).name === 'config') {
        path.node.value = _appConfigAst
      }
    }
  })

  const appEntryCode = `${TPR_WARNING}${
    generator(originAst, {
      comments: false,
      filename: 'filename test',
      jsescOption: { quotes: 'single' }
    }).code
  }${TPR_WARNING}`

  fs.writeFileSync(appEntry, appEntryCode)
}

export const revertConfig = () => {
  if (!Storage.storageData.originAppFile) return

  fs.writeFileSync(appEntry, Storage.storageData.originAppFile)
}
