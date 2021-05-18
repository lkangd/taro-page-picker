import * as path from 'path'
import * as vscode from 'vscode'

import { getTreeData, updateEntry } from './utils'
import { Storage } from './storage'

// types
import {
  TreeItemRoot,
  TreeItemSubRoot,
  TreeItemPage,
  TreeItem,
  treeItemRootVerdict,
  treeItemSubRootVerdict,
  treeItemPageVerdict,
  AppConfig,
  StorageItemPage
} from './type'

interface PickViewItem {
  rawData: TreeItem
  label: string
  parent?: string
  children?: any[]
}

export class PickViewProvider implements vscode.TreeDataProvider<PickViewItem> {
  public _onDidChangeTreeData: vscode.EventEmitter<PickViewItem | undefined> = new vscode.EventEmitter<
    PickViewItem | undefined
  >()
  readonly onDidChangeTreeData: vscode.Event<PickViewItem | undefined> = this._onDidChangeTreeData.event

  private treeData!: TreeItemRoot
  private appConfig!: AppConfig

  constructor(private context: vscode.ExtensionContext) {
    this.getTreeData()
  }

  private getTreeData(): void {
    const [treeData, appConfig] = getTreeData()
    this.treeData = treeData
    this.appConfig = appConfig
  }

  getChildren(pickViewItem?: PickViewItem): PickViewItem[] {
    // console.log('treeItem123 :>> ', pickViewItem)
    if (pickViewItem) {
      let ret =
        pickViewItem.children?.map((item: TreeItem): PickViewItem => {
          if (treeItemSubRootVerdict(item)) {
            return {
              label: item.root,
              rawData: item,
              children: item.pages
            }
          }
          if (treeItemPageVerdict(item)) {
            return {
              label: item.path,
              rawData: item,
              parent: item.parent
            }
          }
          return {
            label: '未知',
            rawData: {} as TreeItem
          }
        }) || []

      // make tabbar and selected page first
      const necessary = []
      const picked = []
      const unPicked = []
      // fin.push(...ret.filter(item => !(item.rawData as TreeItemPage).isNecessary).sort(item => (item.rawData as TreeItemPage).isPicked ? -1 : 1))
      // ret = ret.sort(item => (item.rawData as TreeItemPage).isNecessary ? 1 : (item.rawData as TreeItemPage).isPicked ? 1 : -1)
      // console.log('fin :>> ', fin);
      // console.log('ret :>> ', ret);
      // const newRet = []
      for (const item of ret) {
        if ((item.rawData as TreeItemPage).isNecessary) {
          necessary.push(item)
        } else if ((item.rawData as TreeItemPage).isPicked) {
          picked.push(item)
        } else {
          unPicked.push(item)
        }
      }
      console.log('necessary :>> ', necessary)
      return [...necessary, ...picked, ...unPicked]
    }
    // Storage.saveData(this.treeData, this.context)
    console.log('this.treeData :>> ', this.treeData)
    return Object.entries(this.treeData).map(([key, value]) => ({ label: key, rawData: value, children: value }))
  }

  getTreeItem(pickViewItem: PickViewItem): vscode.TreeItem {
    const isSelected =
      (pickViewItem.rawData as TreeItemPage).isNecessary || (pickViewItem.rawData as TreeItemPage).isPicked
    // console.log('(pickViewItem.rawData as TreeItemPage).isPicked :>> ', (pickViewItem.rawData as TreeItemPage).isPicked);
    const contextValue =
      pickViewItem.children && pickViewItem.children.length
        ? undefined
        : (pickViewItem.rawData as TreeItemPage).isPicked
        ? 'treeItemPagePicked'
        : 'treeItemPageUnPicked'
    // console.log('contextValue :>> ', contextValue);
    // console.log('isSelected :>> ', isSelected);
    let label = pickViewItem.label
    if (pickViewItem.children) {
      const pickedChildren = pickViewItem.children.filter(item => !!item.isPicked).length
      label += `(${pickedChildren}/${pickViewItem.children?.length})`
    }
    return {
      id: `${pickViewItem.parent}${pickViewItem.label}`,
      label: isSelected ? label : '',
      description: isSelected ? '' : label,
      collapsibleState:
        pickViewItem.children && pickViewItem.children.length
          ? vscode.TreeItemCollapsibleState.Collapsed
          : vscode.TreeItemCollapsibleState.None,
      tooltip: '页面路径',
      contextValue,
      iconPath: isSelected
        ? path.join(__filename, '..', '..', 'resources', 'dark', 'document.svg')
        : path.join(__filename, '..', '..', 'resources', 'light', 'document.svg')
      // iconPath: {
      //   light: path.join(__filename, '..', '..', 'resources', 'light', 'document.svg'),
      //   dark: path.join(__filename, '..', '..', 'resources', 'dark', 'document.svg')
      // }
    }
  }

  async addNote(): Promise<void> {
    const note = await vscode.window.showInputBox({ placeHolder: '请输入页面备注' })
    if (note === null || note === undefined) {
      return
    }

    // console.log('note :>> ', note)
  }

  pick(pickViewItem: PickViewItem) {
    // console.log('pick page :>> ', pickViewItem);

    ;(pickViewItem.rawData as TreeItemPage).isPicked = true
    // page.
    this._onDidChangeTreeData.fire(undefined)
  }

  unPick(pickViewItem: PickViewItem) {
    // console.log('un pick page :>> ', pickViewItem);

    ;(pickViewItem.rawData as TreeItemPage).isPicked = false
    // page.
    this._onDidChangeTreeData.fire(undefined)
  }

  updateConfig() {
    const storagePages: Record<string, StorageItemPage> = {}
    const pickedPages = this.treeData.pages.reduce((ret, item) => {
      if (item.isPicked) {
        ret.push(item.path)
        storagePages[`${item.parent || ''}${item.path}`] = { id: `${item.parent || ''}${item.path}`, isPicked: true }
      }
      return ret
    }, [] as string[])
    const pickedSubPackages = this.treeData.subPackages?.reduce((ret, item) => {
      const pickedPages = item.pages.reduce((ret, item) => {
        if (item.isPicked) {
          ret.push(item.path)
          storagePages[`${item.parent || ''}${item.path}`] = { id: `${item.parent || ''}${item.path}`, isPicked: true }
        }
        return ret
      }, [] as string[])
      if (pickedPages.length >= 1) {
        ret.push({ ...item, pages: pickedPages })
      }
      return ret
    }, [] as any)
    const appConfig = { ...this.appConfig }
    appConfig.pages = pickedPages
    appConfig.subPackages = pickedSubPackages
    delete appConfig.preloadRule
    updateEntry(appConfig)
    Storage.saveData({ pages: storagePages })
    console.log('pickedPages :>> ', pickedPages)
  }
  refreshConfig() {
    this.getTreeData()
    this._onDidChangeTreeData.fire(undefined)
  }
}
