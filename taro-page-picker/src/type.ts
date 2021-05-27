/*
 * @Author: Curtis.Liong
 * @Date: 2021-05-24 17:33:17
 * @Last Modified by:   Curtis.Liong
 * @Last Modified time: 2021-05-24 17:33:17
 */
//#region treeItem
export interface TreeItemPage {
  path: string                // 页面路径
  picked: boolean             // 是否已选中，默认 true
  tabbar: boolean             // 是否必须存在，标记 tabbar
  entry: boolean              // 是否 entry 页面
  id?: string                 // 唯一 id，由 parent.root 和 path 组成
  parent?: TreeItemSubPackage // 父路径，分包子页面才具有这个属性
  sibling?: TreeItemPage[]    // 同级的其它页面（包含自己）
}
export interface TreeItemSubPackage {
  pages: TreeItemPage[] // 分包页面
  root: string          // 分包 root
}
export interface TreeItemRoot {
  pages: TreeItemPage[]              // 主包页面
  subPackages?: TreeItemSubPackage[] // 分包
}

export type TreeItem = TreeItemRoot | TreeItemSubPackage | TreeItemPage

export interface ViewItem {
  rawData: TreeItem
  label: string
  id?: string
  parent?: TreeItemSubPackage
  children?: (TreeItemPage | TreeItemSubPackage)[]
}

export const treeItemPageVerdict = (item: any): item is TreeItemPage =>
  item.path && typeof item.picked === 'boolean' && typeof item.tabbar === 'boolean'
export const treeItemSubPackageVerdict = (item: any): item is TreeItemSubPackage =>
  item.pages && Array.isArray(item.pages) && item.root !== undefined
export const treeItemSubRootVerdict = (item: any): item is TreeItemSubPackage[] =>
  Array.isArray(item) && item.every(i => treeItemSubPackageVerdict(i))
export const treeItemRootVerdict = (item: any): item is TreeItemRoot =>
  item.pages && Array.isArray(item.pages) && item.root === undefined

//#endregion

//#region mini app config
export interface TabBarConfigItem {
  pagePath: string // 路由
  text: string     // 标题
}
export interface TabBarConfig {
  custom?: boolean          // 是否自定义 tabBar
  list: TabBarConfigItem[]  // tabBar 页面列表
}
export interface SubPackage {
  root: string    // 分包父路径
  pages: string[] // 分包路径
}
export interface AppConfig {
  pages: string[]             // 主包路径
  subPackages?: SubPackage[]  // 分包配置
  tabBar?: TabBarConfig       // tabBar 配置
  preloadRule?: any           // 分包预加载规则，最终生成会删除
}
//#endregion

//#region Storage
export interface StorageItemPage {
  id: string
  picked: boolean
  entry?: boolean
  note?: string
}
export interface StorageItemScene {
  name: string
  pages: Record<string, StorageItemPage>
}
export interface StorageData {
  pages?: Record<string, StorageItemPage>
  scenes?: Record<string, StorageItemScene>
  originAppFile?: string
}
//#endregion
