/**
 * Root postinstall script.
 * 
 * NOTE: We intentionally do NOT run electron-builder install-app-deps here.
 * With pnpm workspaces, electron-builder install-app-deps corrupts the shared
 * node_modules by running pnpm install --production in release/app.
 * 
 * Native module rebuilding is handled by:
 * 1. release/app/postinstall runs electron-rebuild for native deps in release/app
 * 2. The build process handles the rest
 */
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Run native dependency check
try {
    require('./check-native-dep.cjs')
} catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
        console.log('Native dependency check skipped: module not found')
    } else {
        throw e
    }
}

// Electron >=42 no longer downloads its binary in its own postinstall script;
// it downloads on first run of the *bin* script. electron-vite and Playwright
// _electron spawn the binary path directly, so ensure the dist exists here.
// pnpm gives each electron version a fresh package dir, so a plain existence
// check is enough to detect a version bump.
const electronDir = path.dirname(require.resolve('electron/package.json'))
const electronDist = path.join(electronDir, 'dist')
const electronPathTxt = path.join(electronDir, 'path.txt')
if (!fs.existsSync(electronDist) || !fs.existsSync(electronPathTxt)) {
    const installScript = path.join(electronDir, 'install.js')
    if (fs.existsSync(installScript)) {
        console.log('[postinstall] Electron dist missing; downloading via electron install.js ...')
        execSync(`node ${JSON.stringify(installScript)}`, { cwd: electronDir, stdio: 'inherit' })
    } else {
        console.warn('[postinstall] Electron dist missing and install.js not found; run the electron bin once to download it')
    }
}

console.log('Postinstall complete (skipping electron-builder install-app-deps for pnpm compatibility)')
