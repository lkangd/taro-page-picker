/*
 * @Author: Curtis.Liong
 * @Date: 2021-05-27 14:58:15
 * @Last Modified by: Curtis.Liong
 * @Last Modified time: 2021-05-27 14:59:34
 */
import * as fs from 'fs'
import * as path from 'path'

// const
import { TPP_STORAGE_NAME, TPP_SUFFIX_TYPE } from '../const'

// type
import { TreeItemRoot, TreeItemSubPackage, TreeItemPage } from '../type'

export const entryToVscodeDir = (appEntry: string) => {
  const appEntrySeparate = appEntry.split(path.sep)
  const retAppEntry = appEntrySeparate
    .join('/')
    .replace(/\/src\/app\..*$/, '')
    .split('/')
    .join(path.sep)
  return path.join(retAppEntry, '.vscode', TPP_STORAGE_NAME)
}

export const findPagePath = (fsPath: string): string | undefined => {
  return TPP_SUFFIX_TYPE.map(ext => `${fsPath}.${ext}`).find(ext => fs.existsSync(ext))
}

export const calAPCount = (root: TreeItemRoot): { all: number; picked: number } => {
  let all = 0
  let picked = 0
  // main pages
  for (const page of root.pages) {
    all++
    page.picked && (picked++)
  }
  // sub packages pages
  for (const subPackage of (root.subPackages || [])) {
    for (const page of subPackage.pages) {
      all++
      page.picked && (picked++)
    }
  }

  return { all, picked }
}
