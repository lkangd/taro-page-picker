/*
 * @Author: Curtis.Liong
 * @Date: 2021-05-24 17:26:51
 * @Last Modified by: Curtis.Liong
 * @Last Modified time: 2021-05-29 17:35:23
 */
// utils
import { Storage } from '../storage'

// types
import { AppConfig, TreeItemRoot, TreeItemSubPackage, TreeItemPage } from '../type'

const getTreeItemPages = (
  pages: string[] = [],
  tabBarPages?: Record<string, true>,
  parent?: TreeItemSubPackage
): TreeItemPage[] => {
  const {
    storageData: { pages: storagePages }
  } = Storage
  const ret: TreeItemPage[] = [...new Set(pages)].map(path => {
    const picked = storagePages?.[`${parent?.root || ''}${path}`]?.picked || tabBarPages?.[path] || false
    const tabbar = tabBarPages?.[path] || false
    const entry = storagePages?.[`${parent?.root || ''}${path}`]?.entry || false
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

export const getTreeData = (appConfig: AppConfig): TreeItemRoot => {
  // tabBar 页面的 map
  const tabBarPageMap: Record<string, true> = (() => {
    if (!appConfig.tabBar) return {}

    return appConfig.tabBar.list.reduce((map, item) => {
      map[item.pagePath] = true
      return map
    }, {} as Record<string, true>)
  })()

  // 主包数据
  const pages: TreeItemPage[] = getTreeItemPages(appConfig.pages, tabBarPageMap)

  // 分包数据
  const subPackages: TreeItemSubPackage[] = (() => {
    const tempRet = [...new Set(appConfig.subPackages || [])]
    return tempRet.map((item: { root: string; pages: string[] }) => {
      const ret: TreeItemSubPackage = { root: item.root, pages: [] }
      ret.pages = getTreeItemPages(item.pages, tabBarPageMap, ret)

      return ret
    })
  })()

  const treeData: TreeItemRoot = { pages }
  subPackages.length && Object.assign(treeData, { subPackages })
  return treeData
}
