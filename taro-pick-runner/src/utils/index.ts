/*
 * @Author: Curtis.Liong
 * @Date: 2021-05-27 14:58:15
 * @Last Modified by: Curtis.Liong
 * @Last Modified time: 2021-05-27 14:59:34
 */
import * as path from 'path'

// const
import { TPP_STORAGE_NAME } from '../const'

export const entryToVscodeDir = (appEntry: string) =>
  path.join(appEntry.replace(/\/src\/app\..*$/, ''), '.vscode', TPP_STORAGE_NAME)