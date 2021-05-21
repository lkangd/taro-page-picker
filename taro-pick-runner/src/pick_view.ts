import * as path from 'path'
import * as vscode from 'vscode'

import { getTreeData, updateEntry } from './utils'
import { Storage } from './storage'

// types
import {
  TreeItemPage,
  TreeItemRoot,
  TreeItemSubPackage,
  TreeItem,
  treeItemPageVerdict,
  treeItemSubPackageVerdict,
  treeItemSubRootVerdict,
  AppConfig,
  ViewItem,
  StorageItemPage
} from './type'

enum ContextValue {
  root = 'root',
  rootSub = 'rootSub',
  package = 'package',
  packageSub = 'packageSub',
  pagePicked = 'pagePicked',
  pageUnPicked = 'pageUnPicked',
  pageTabbar = 'pageTabbar',
  pageEntry = 'pageEntry'
}

interface TreeItemDisplayInfo {
  label: vscode.TreeItem['label']
  description: vscode.TreeItem['description']
  tooltip: vscode.TreeItem['tooltip']
}

export class PickViewProvider implements vscode.TreeDataProvider<ViewItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<ViewItem | undefined> = new vscode.EventEmitter<
    ViewItem | undefined
  >()
  readonly onDidChangeTreeData: vscode.Event<ViewItem | undefined> = this._onDidChangeTreeData.event

  private treeData!: TreeItemRoot
  private appConfig!: AppConfig
  private entry?: TreeItemPage

  constructor() {
    this.getTreeData()
  }

  refreshTreeView(viewItem?: ViewItem) {
    this._onDidChangeTreeData.fire(viewItem)
  }

  /**
   * 获取 tree data
   * 并初始化相关状态
   * @private
   * @memberof PickViewProvider
   */
  private getTreeData(): void {
    const [treeData, appConfig] = getTreeData()
    this.treeData = treeData
    this.appConfig = appConfig
    this.entry = undefined
  }

  /**
   * 根据ViewItem 的类型获取对应的 context value
   * 用于不同操作按钮的展示
   * @private
   * @param {ViewItem} viewItem
   * @return {*}
   * @memberof PickViewProvider
   */
  private _getTreeItemContextValue(viewItem: ViewItem) {
    if (typeof viewItem.children !== 'undefined') {
      if (treeItemSubRootVerdict(viewItem.rawData)) return ContextValue.rootSub
      if (treeItemSubPackageVerdict(viewItem.rawData)) return ContextValue.packageSub
      return ContextValue.package
    }
    // if ((viewItem.rawData as TreeItemPage).entry) return ContextValue.pageEntry
    if ((viewItem.rawData as TreeItemPage).tabbar) return ContextValue.pageTabbar
    if ((viewItem.rawData as TreeItemPage).picked) return ContextValue.pagePicked
    return ContextValue.pageUnPicked
  }

  /**
   * 根据 ViewItem 的类型获取对应的展示文本
   * @private
   * @param {ViewItem} viewItem
   * @return {*} {TreeItemDisplayInfo}
   * @memberof PickViewProvider
   */
  private _getTreeItemDisplayInfo(viewItem: ViewItem): TreeItemDisplayInfo {
    if (viewItem.children) {
      if (treeItemSubRootVerdict(viewItem.rawData))
        return { label: viewItem.label, description: `(${viewItem.children.length})`, tooltip: '分包总块' }

      const pickedChildren = viewItem.children.filter(item => treeItemPageVerdict(item) && item.picked).length
      return {
        label: viewItem.label,
        description: `(${pickedChildren}/${viewItem.children.length})`,
        tooltip: '主包/分包,点击右侧操作符切换选择所有/取消所有'
      }
    }
    if (treeItemPageVerdict(viewItem.rawData)) {
      const isPicked = viewItem.rawData.entry || viewItem.rawData.tabbar || viewItem.rawData.picked
      const tooltip = '页面,点击右侧操作符切换选择'
      return isPicked
        ? { label: viewItem.label, description: '', tooltip }
        : { label: '', description: viewItem.label, tooltip }
    }
    return { label: viewItem.label, description: '', tooltip: '未知,请检查插件是否运行错误.' }
  }

  /**
   * 根据 ViewItem 的类型类获取对应的 icon
   * @private
   * @param {ViewItem} viewItem
   * @return {*}  {vscode.TreeItem['iconPath']}
   * @memberof PickViewProvider
   */
  private _getTreeItemIcon(viewItem: ViewItem): vscode.TreeItem['iconPath'] {
    if (viewItem.children) {
      if (treeItemSubPackageVerdict(viewItem.rawData)) {
        return path.join(__filename, '..', '..', 'resources', 'dark', 'package-sub.svg')
      }
      return path.join(__filename, '..', '..', 'resources', 'dark', 'package.svg')
    }
    if (treeItemPageVerdict(viewItem.rawData)) {
      switch (true) {
        case viewItem.rawData.entry:
          return path.join(__filename, '..', '..', 'resources', 'dark', 'page-entry.svg')
        case viewItem.rawData.tabbar:
          return path.join(__filename, '..', '..', 'resources', 'dark', 'page-tabbar.svg')
        case viewItem.rawData.picked:
          return path.join(__filename, '..', '..', 'resources', 'dark', 'page-picked.svg')
        default:
          return path.join(__filename, '..', '..', 'resources', 'dark', 'page-un-picked.svg')
      }
    }
    return ''
  }

  /**
   * 根据 ViewItem 的类型获取对应的展开状态
   * @private
   * @param {ViewItem} viewItem
   * @return {*}  {vscode.TreeItem['collapsibleState']}
   * @memberof PickViewProvider
   */
  private _getTreeItemCSBState(viewItem: ViewItem): vscode.TreeItem['collapsibleState'] {
    switch (true) {
      case !viewItem.children || !viewItem.children.length:
        return vscode.TreeItemCollapsibleState.None
      case viewItem.children?.some(item => treeItemPageVerdict(item)) && !(<TreeItemSubPackage>viewItem.rawData)?.root:
        return vscode.TreeItemCollapsibleState.Expanded
      default:
        return vscode.TreeItemCollapsibleState.Collapsed
    }
  }

  /**
   * 根据 ViewItem 的类型获取对应的 TreeItem
   * @param {ViewItem} viewItem
   * @return {*}  {vscode.TreeItem}
   * @memberof PickViewProvider
   */
  getTreeItem(viewItem: ViewItem): vscode.TreeItem {
    const displayInfo = this._getTreeItemDisplayInfo(viewItem)
    return {
      id: viewItem.id,
      label: displayInfo?.label,
      description: displayInfo?.description,
      tooltip: displayInfo?.tooltip,
      contextValue: this._getTreeItemContextValue(viewItem),
      iconPath: this._getTreeItemIcon(viewItem),
      collapsibleState: this._getTreeItemCSBState(viewItem)
    }
  }

  /**
   * 天才第一步
   * 获取每个可展开节点的后代
   * 当 viewItem 为空时，为顶级根
   * @param {ViewItem} [viewItem]
   * @return {*}  {ViewItem[]}
   * @memberof PickViewProvider
   */
  getChildren(viewItem?: ViewItem): ViewItem[] {
    if (!viewItem) {
      console.log('TPR Load Tree Data:>> ', this.treeData)
      return Object.entries(this.treeData).map(([key, value]) => ({ rawData: value, label: key, children: value }))
    }

    const unSortChildren = viewItem.children || []
    viewItem.children = Object.values(
      unSortChildren.reduce(
        (ret, item) => {
          switch (true) {
            case (<TreeItemPage>item).entry:
              this.entry = <TreeItemPage>item
              ret.entry.push(item)
              break
            case (<TreeItemPage>item).tabbar:
              // set first picked main package page the entry page
              if (!this.entry && treeItemPageVerdict(item) && !item.parent) {
                this.entry = item
                item.entry = true
                ret.entry.push(item)
              } else {
                ret.tabbar.push(item)
              }
              break
            case (<TreeItemPage>item).picked:
              // set first picked main package page the entry page
              if (!this.entry && treeItemPageVerdict(item) && !item.parent) {
                this.entry = item
                item.entry = true
                ret.entry.push(item)
              } else {
                ret.picked.push(item)
              }
              break
            default:
              ret.unPicked.push(item)
              break
          }
          return ret
        },
        { entry: [], tabbar: [], picked: [], unPicked: [] } as Record<string, (TreeItemPage | TreeItemSubPackage)[]>
      )
    ).reduce((ret, sort) => [...ret, ...sort], [])

    if (this.entry && viewItem.children.some(item => treeItemPageVerdict(item))) {
      this.entry.sibling = <TreeItemPage[]>viewItem.children
    }

    const ret =
      viewItem.children?.map((item: TreeItem): ViewItem => {
        if (treeItemSubPackageVerdict(item)) return { rawData: item, label: item.root, children: item.pages }
        if (treeItemPageVerdict(item)) return { rawData: item, label: item.path, parent: item.parent, id: item.id }
        return { label: '未知', rawData: {} as TreeItem }
      }) || []

    return ret
  }

  /**
   * 找到第一个选中的主包并设置为 entry
   * @memberof PickViewProvider
   */
  private _setFirstPickedEntry() {
    if (!this.entry || !this.entry.sibling) return

    const sibling = this.entry.sibling
    this.entry.entry = false
    const firstPickedPage = sibling.find(item => item.picked)
    if (firstPickedPage) {
      this.entry = firstPickedPage
      firstPickedPage.entry = true
    }
  }

  /**
   * 设置 page 为 entry page
   * 只对 main package 的页面有效
   * @param {ViewItem} viewItem
   * @memberof PickViewProvider
   */
  setEntry(viewItem: ViewItem) {
    if (!treeItemPageVerdict(viewItem.rawData) || viewItem.rawData.parent) return
    if (this.entry) {
      this.entry.entry = false
    }

    viewItem.rawData.picked = true
    viewItem.rawData.entry = true
    this.entry = viewItem.rawData
    this.refreshTreeView()
  }

  /**
   * 选择指定的页面
   * tabBar 页面将会被忽略
   * @param {ViewItem} viewItem
   * @memberof PickViewProvider
   */
  pick(viewItem: ViewItem) {
    if (!treeItemPageVerdict(viewItem.rawData) || viewItem.rawData.tabbar) return

    viewItem.rawData.picked = true
    this.refreshTreeView()
  }

  /**
   * 取消选择指定的页面
   * tabBar 页面将会被忽略
   * @param {ViewItem} viewItem
   * @memberof PickViewProvider
   */
  unPick(viewItem: ViewItem) {
    if (!treeItemPageVerdict(viewItem.rawData) || viewItem.rawData.tabbar) return

    viewItem.rawData.picked = false
    if (viewItem.rawData.entry) {
      viewItem.rawData.entry = false
      this._setFirstPickedEntry()
    }
    this.refreshTreeView()
  }

  /**
   * 选择所有[分包页面 | 主包页面]
   * tabBar 页面将会被忽略
   * @param {ViewItem} viewItem
   * @memberof PickViewProvider
   */
  pickAll(viewItem: ViewItem) {
    viewItem.children?.forEach(item => treeItemPageVerdict(item) && !item.tabbar && (item.picked = true))
    this.refreshTreeView()
  }

  /**
   * 取消选择所有[分包页面 | 主包页面]
   * tabBar 页面将会被忽略
   * @param {ViewItem} viewItem
   * @memberof PickViewProvider
   */
  unPickAll(viewItem: ViewItem) {
    viewItem.children?.forEach(item => {
      if (!treeItemPageVerdict(item) || item.tabbar) return
      item.picked = false
      item.entry = false
    })
    this._setFirstPickedEntry()
    this.refreshTreeView()
  }

  /**
   * 重新读取原始配置文件
   * @memberof PickViewProvider
   */
  reloadConfig() {
    this.getTreeData()
    this.refreshTreeView()
  }

  /**
   * 生成并保存配置
   * @memberof PickViewProvider
   */
  saveConfig() {
    const storagePages: Record<string, StorageItemPage> = {}

    // main package
    const pickedPages = Object.values(
      this.treeData.pages.reduce(
        (ret, item) => {
          const storagePage: StorageItemPage = { id: item.id!, picked: true }
          switch (true) {
            case item.entry:
              storagePage.entry = true
              ret.entry.push(item.path)
              break
            case item.tabbar:
              ret.tabbar.push(item.path)
              break
            case item.picked:
              ret.picked.push(item.path)
              break
            default:
              storagePage.picked = false
              ret.unPicked.push(item.path)
              break
          }
          // only save picked page
          if (storagePage.picked) {
            storagePages[item.id!] = storagePage
          }
          return ret
        },
        { entry: [], tabbar: [], picked: [], unPicked: [] } as Record<string, string[]>
      )
    ).reduce((ret, sort) => [...ret, ...sort], [])

    // sub packages
    const pickedSubPackages = this.treeData.subPackages?.reduce((ret, item) => {
      const pickedPages = item.pages.reduce((ret, item) => {
        if (item.picked) {
          ret.push(item.path)
          storagePages[item.id!] = { id: item.id!, picked: true }
        }
        return ret
      }, [] as string[])
      pickedPages.length >= 1 && ret.push({ ...item, pages: pickedPages })

      return ret
    }, [] as any)

    const appConfig = { ...this.appConfig }
    appConfig.pages = pickedPages
    appConfig.subPackages = pickedSubPackages
    delete appConfig.preloadRule // delete preload rule
    updateEntry(appConfig)
    Storage.saveData({ pages: storagePages })
  }
}
