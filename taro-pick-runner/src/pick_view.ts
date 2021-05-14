import * as path from 'path'
import * as vscode from 'vscode'

import { getTreeData } from './utils'

// types
import { TreeItemRoot, TreeItemSubRoot, TreeItemPage, TreeItem, treeItemRootVerdict, treeItemSubRootVerdict, treeItemPageVerdict } from './type'


interface PickViewItem {
  rawData: TreeItem
  label: string
  parent?: string
  children?: any[]
}

export class PickViewProvider implements vscode.TreeDataProvider<PickViewItem> {
  private treeData!: TreeItemRoot

  constructor(private context: vscode.ExtensionContext) {
    this.getTreeData()
  }

  private getTreeData(): void {
    this.treeData = getTreeData()
  }

  getChildren(pickViewItem?: PickViewItem): PickViewItem[] {
    console.log('treeItem123 :>> ', pickViewItem)
    if (pickViewItem) {
      return pickViewItem.children?.map((item: TreeItem): PickViewItem => {
        if (treeItemSubRootVerdict(item)) {
          return {
            label: item.root,
            rawData: item,
            children: item.pages,
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
    }
    return Object.entries(this.treeData).map(([key, value]) => ({ label: key, rawData: value, children: value }))
  }

  getTreeItem(pickViewItem: PickViewItem): vscode.TreeItem {
    return {
      label: pickViewItem.label,
      id: `${pickViewItem.parent}${pickViewItem.label}`,
      collapsibleState: pickViewItem.children && pickViewItem.children.length ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
      description: '这是一段描述',
      tooltip: '页面路径',
      contextValue: pickViewItem.children && pickViewItem.children.length ? undefined : 'treeItemPage',
      iconPath: {
        light: path.join(__filename, '..', '..', 'resources', 'light', 'document.svg'),
        dark: path.join(__filename, '..', '..', 'resources', 'dark', 'document.svg')
      }
    }
  }

  async addNote(): Promise<void> {
    const note = await vscode.window.showInputBox({ placeHolder: '请输入页面备注' })
    if (note === null || note === undefined) { return }

    console.log('note :>> ', note)
  }
}