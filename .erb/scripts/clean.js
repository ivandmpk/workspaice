import fs from 'fs'
import path from 'path'
import { rimrafSync } from 'rimraf'
import { fileURLToPath } from 'url'

// Inline path constants previously imported from ../configs/webpack.paths
// (that file was part of the legacy Webpack setup, which has been removed).
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootPath = path.join(__dirname, '../..')
const releasePath = path.join(rootPath, 'release')
const appPath = path.join(releasePath, 'app')
const dllPath = path.join(__dirname, '../dll')

const foldersToRemove = [
  path.join(appPath, 'dist'),         // distPath
  path.join(appPath, 'node_modules'), // appNodeModulesPath
  path.join(releasePath, 'build'),    // buildPath
  dllPath,
]

foldersToRemove.forEach((folder) => {
    if (fs.existsSync(folder)) rimrafSync(folder)
})
