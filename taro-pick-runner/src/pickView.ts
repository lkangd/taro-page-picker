import * as vscode from 'vscode';

export class PickView {
  constructor(context: vscode.ExtensionContext) {
    try {
      const view = vscode.window.createTreeView('pickView', { treeDataProvider: aNodeWithIdTreeDataProvider(), showCollapseAll: true });
      view
    } catch (e) {
      e
    }

  }
}

const TABS = {
  Actions: {
    ['build:weapp']: {},
    ['build:swan']: {},
    ['build:alipay']: {},
    ['build:tt']: {},
    ['build:h5']: {},
    ['build:rn']: {},
    ['build:qq']: {},
    ['build:jd']: {},
    ['build:quickapp']: {},
    ['dev:weapp']: {},
    ['dev:swan']: {},
    ['dev:alipay']: {},
    ['dev:tt']: {},
    ['dev:h5']: {},
    ['dev:rn']: {},
    ['dev:qq']: {},
    ['dev:quickapp']: {},
  },
  Pages: {
    ['pages/index/index']: {},
    ['pages/other/index']: {},
  },
};
let nodes = {};

function aNodeWithIdTreeDataProvider(): vscode.TreeDataProvider<{ key: string }> {
  return {
    getChildren: (element: { key: string }): { key: string }[] => {
      return getChildren(element ? element.key : undefined).map((key) => getNode(key));
    },
    getTreeItem: (element: { key: string }): vscode.TreeItem => {
      const treeItem = getTreeItem(element.key);
      treeItem.id = element.key;
      return treeItem;
    },
    getParent: ({ key }: { key: string }): { key: string } => {
      const parentKey = key.substring(0, key.length - 1);
      return parentKey ? new Key(parentKey) : void 0;
    },
  };
}

function getChildren(key: string): string[] {
  if (!key) {
    return Object.keys(TABS);
  }
  let treeElement = getTreeElement(key);
  if (treeElement) {
    return Object.keys(treeElement);
  }
  return [];
}

function getTreeItem(key: string): any {
  const treeElement = getTreeElement(key);
  return {
    label: <vscode.TreeItemLabel>{ label: key },
    tooltip: `Tooltip for ${key}`,
    collapsibleState:
      treeElement && Object.keys(treeElement).length ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
  };
}

function getTreeElement(element): any {
  let parent = TABS;
  return parent[element] || [];
}

function getNode(key: string): { key: string } {
  if (!nodes[key]) {
    nodes[key] = new Key(key);
  }
  return nodes[key];
}

class Key {
  constructor(readonly key: string) {}
}
