import * as path from "path"

export const rootDir = process.cwd()
export const sourceDir = path.resolve(rootDir, "./src")
export const nodeModulesDir = path.resolve(rootDir, "./node_modules")
export const appConfigPath = path.resolve(sourceDir, "./app.config")
