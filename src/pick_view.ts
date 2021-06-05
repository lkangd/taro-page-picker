/*
 * @Author: Curtis.Liong
 * @Date: 2021-05-24 17:33:03
 * @Last Modified by: Curtis.Liong
 * @Last Modified time: 2021-05-29 18:42:28
 */
import * as path from 'path'
import * as vscode from 'vscode'

// utils
import { getAppConfigProvider, TAppConfigProvider } from './utils/app_config'
import { entryToVscodeDir, findPagePath, calAPCount } from './utils'
import { getTreeData } from './utils/tree_data'
import { getIconPath } from './utils/get_icon'
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

  public appConfigProvider?: TAppConfigProvider
  private showPickedOnly: boolean = false
  private treeView?: vscode.TreeView<ViewItem>
  private treeData!: TreeItemRoot
  private entry?: TreeItemPage
  private rootChildren?: ViewItem[]

  constructor(private context: vscode.ExtensionContext) {
    this.appConfigProvider = getAppConfigProvider()
    this.appConfigProvider && Storage.loadData({ path: entryToVscodeDir(this.appConfigProvider.appEntry!) })
    this.getTreeData()
    vscode.commands.executeCommand('setContext', 'TPP.showPickedOnly', false)
  }

  private _updateTreeViewDisplay() {
    if (!this.treeView) return

    if (this.appConfigProvider?.appConfig.pages.length) {
      this.treeView.message = undefined
    } else {
      this.treeView.message = '没有找到有效的 Taro 配置文件'
    }

    if (!this.treeData) {
      this.treeView.description = undefined
      return
    }
    // 已选页面/总页面
    const { all, picked } = calAPCount(this.treeData)
    if (all) {
      this.treeView.description = `(${picked}/${all})`
    } else {
      this.treeView.description = undefined
    }
  }
  loadTreeView(treeView: vscode.TreeView<ViewItem>) {
    treeView.message = '配置加载中...'
    this.treeView = treeView
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
    const config: AppConfig | undefined = this.appConfigProvider?.findAppConfig()
    if (!config) return

    this.treeData = getTreeData(config)
    this.entry = undefined
    this.appConfigProvider &&
      Storage.saveData({
        data: { originAppFile: this.appConfigProvider.appFile },
        storagePath: entryToVscodeDir(this.appConfigProvider.appEntry!)
      })
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
        return getIconPath('package-sub')
      }
      return getIconPath('package')
    }
    if (treeItemPageVerdict(viewItem.rawData)) {
      switch (true) {
        case viewItem.rawData.entry:
          return getIconPath('page-entry')
        case viewItem.rawData.tabbar:
          return getIconPath('page-tabbar')
        case viewItem.rawData.picked:
          return getIconPath('page-picked')
        default:
          return getIconPath('page-un-picked')
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
      console.log('TPP Load Tree Data:>> ', this.treeData)
      this._updateTreeViewDisplay()
      this.rootChildren = Object.entries(this.treeData).map(([key, value]) => ({ rawData: value, label: key, children: value }))
      return this.rootChildren
    }

    // handle non-page children
    if (treeItemSubPackageVerdict(viewItem.children?.[0])) {
      const ret = (
        viewItem.children?.map((item: TreeItem): ViewItem => {
          if (treeItemSubPackageVerdict(item)) return { rawData: item, label: item.root, children: item.pages }
          return { label: '未知', rawData: {} as TreeItem }
        }) || []
      )
      if (this.showPickedOnly) {
        return ret.filter(subPackage => subPackage.children?.some((item) => (item as TreeItemPage).picked))
      } else {
        return ret
      }
    }

    // find entry
    const unSortChildren = viewItem.children || []
    const existEntryIdx = unSortChildren.findIndex(item => (<TreeItemPage>item).entry)
    if (existEntryIdx >= 0) {
      this.entry = unSortChildren[existEntryIdx] as TreeItemPage
      this.entry.entry = true
      this.entry.sibling = <TreeItemPage[]>viewItem.children
    }

    viewItem.children = Object.values(
      unSortChildren.reduce(
        (ret, item) => {
          switch (true) {
            case (<TreeItemPage>item).entry:
              ret.entry.push(item)
              break
            case (<TreeItemPage>item).tabbar:
              ret.tabbar.push(item)
              break
            case (<TreeItemPage>item).picked:
              ret.picked.push(item)
              break
            case this.showPickedOnly:
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

    // if haven't a entry, set first picked page to entry
    if (!this.entry && treeItemPageVerdict(viewItem.children[0]) && viewItem.children[0].picked) {
      this.entry = viewItem.children[0]
      this.entry.entry = true
      this.entry.sibling = <TreeItemPage[]>viewItem.children
    }

    return (
      viewItem.children?.map((item: TreeItem): ViewItem => {
        if (treeItemPageVerdict(item)) return { rawData: item, label: item.path, parent: item.parent, id: item.id }

        return { label: '未知', rawData: {} as TreeItem }
      }) || []
    )
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
    let includeEntryVerdict = false
    viewItem.children?.forEach(item => {
      if (!treeItemPageVerdict(item)) return

      includeEntryVerdict = includeEntryVerdict || item.entry
      if (item.tabbar) return

      item.entry = false
      item.picked = false
    })
    includeEntryVerdict && this._setFirstPickedEntry()
    this.refreshTreeView()
  }

  /**
   * 还原原始配置文件
   * @memberof PickViewProvider
   */
  revertConfig() {
    this.appConfigProvider?.revertConfig()
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
              break
          }
          // only save picked page
          if (storagePage.picked) {
            storagePages[item.id!] = storagePage
          }
          return ret
        },
        { entry: [], tabbar: [], picked: [] } as Record<string, string[]>
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

    const appConfig = { ...this.appConfigProvider?.appConfig }
    appConfig.pages = pickedPages
    appConfig.subPackages = pickedSubPackages
    delete appConfig.preloadRule // delete preload rule

    this.appConfigProvider?.updateAppFile(appConfig as AppConfig)
    this.appConfigProvider &&
      Storage.saveData({
        data: { pages: storagePages },
        storagePath: entryToVscodeDir(this.appConfigProvider.appEntry!)
      })
  }

  /**
   * 选中类型为 page 的 viewItem 时
   * 自动打开对应的文件在视窗内
   * 否则，打开配置文件
   * @param {vscode.TreeViewSelectionChangeEvent<ViewItem>} selection
   * @memberof PickViewProvider
   */
  showPageTextDocument(selection: vscode.TreeViewSelectionChangeEvent<ViewItem>) {
    if (!treeItemPageVerdict(selection.selection?.[0].rawData)) {
      const appEntry = this.appConfigProvider?.appEntry
      if (appEntry && appEntry !== vscode.window.activeTextEditor?.document.uri.fsPath) {
        vscode.window.showTextDocument(vscode.Uri.file(appEntry), { preview: false })
      }
      return
    }

    const pageRawData = selection.selection?.[0].rawData
    const pagePathName = path.join(
      this.appConfigProvider?.workspaceFolder?.uri.fsPath || '',
      'src',
      pageRawData.parent?.root || '',
      pageRawData.path
    )
    const pagePath = findPagePath(pagePathName)
    if (pagePath) {
      vscode.window.showTextDocument(vscode.Uri.file(pagePath))
    } else {
      vscode.window.showWarningMessage(`Taro-Page-Picker warning: 路径对应的页面文件（${pagePathName}）不存在`)
    }
  }

  showAllPages() {
    this.showPickedOnly = false
    vscode.commands.executeCommand('setContext', 'TPP.showPickedOnly', false)
    this.refreshTreeView()
  }

  showPickedPages() {
    this.showPickedOnly = true
    vscode.commands.executeCommand('setContext', 'TPP.showPickedOnly', true)
    this.refreshTreeView()
  }
}
