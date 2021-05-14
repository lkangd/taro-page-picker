export interface TreeItemRoot {
  pages: TreeItemPage[]           // 主包页面
  subPackages?: TreeItemSubRoot[] // 分包
}

export interface TreeItemSubRoot {
  pages: TreeItemPage[] // 分包页面
  root: string          // 分包 root
}

export interface TreeItemPage {
  path: string         // 页面路径
  isPicked: boolean    // 是否已选中，默认 true
  isNecessary: boolean // 是否必须存在，标记 tabbar
  parent?: string      // 父路径
}

export type TreeItem = TreeItemRoot | TreeItemSubRoot | TreeItemPage

// 小程序的配置格式
export interface AppConfig {
  // 主包路径
  pages: string[]
  // 分包配置
  subPackages?: {
    root: string
    // 分包路径
    pages: string[]
  }[]
  // tabBar 配置
  tabBar?: {
    // 是否自定义 tabBar
    custom?: boolean
    // tabBar 页面
    list: {
      pagePath: string
      text: string
    }[]
  }
}

export const treeItemRootVerdict = (item: any): item is TreeItemRoot => item.pages && Array.isArray(item.pages) && item.root === undefined
export const treeItemSubRootVerdict = (item: any): item is TreeItemSubRoot => item.pages && Array.isArray(item.pages) && item.root !== undefined
export const treeItemPageVerdict = (item: any): item is TreeItemPage => item.path && typeof item.isPicked === 'boolean' && typeof item.isNecessary === 'boolean'