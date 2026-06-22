#!/usr/bin/env node
/**
 * Regenerate every WorkspAIce app-icon artifact from a single source PNG.
 *
 * Source: design-materials/icon-main.png (1254x1254 RGB, the WorkspAIce W + AI mark).
 * Output surfaces:
 *   - Desktop:  assets/icon.png, icon.icns, icon.ico, icons/{16..1024}.png,
 *               iconTemplate.png (16) + @2x.png (64) + iconTemplateRaw.png (1024) + Preview.png
 *   - Renderer: src/renderer/static/icon.png (1024), favicon.png (32),
 *               src/renderer/logo192.png (192)
 *   - Mobile:   resources/{icon-only,icon-foreground,icon-background}.png (1024),
 *               resources/{splash,splash-dark}.png (2732x2732) — sources for `pnpm mobile:assets`
 *
 * macOS tray template rule: Apple auto-tints menu-bar icons. We generate a
 * grayscale threshold version so the "W" mark reads correctly in both light
 * and dark menu bars. The "AI" badge is dropped — it would be illegible at 16px.
 *
 * Run:  node scripts/regen-app-icons.mjs [--source path/to/icon.png]
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import png2icons from 'png2icons'
import sharp from 'sharp'

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')

const PALETTE = {
  bg: '#F5F5F5', // light background
  bgDark: '#303841', // dark background
  ink: '#303841', // W mark (slate)
  accent: '#76ABAE', // second stroke (teal)
  badge: '#FF5722', // AI badge (orange)
}

const args = process.argv.slice(2)
const sourceArgIdx = args.indexOf('--source')
const SOURCE = sourceArgIdx >= 0
  ? path.resolve(args[sourceArgIdx + 1])
  : path.join(ROOT, 'design-materials/icon-main.png')

const LINUX_SIZES = [16, 24, 32, 48, 64, 96, 128, 256, 512, 1024]
const ICO_SIZES = [16, 24, 32, 48, 64, 128, 256]

async function loadMaster(sourcePath) {
  const buf = await readFile(sourcePath)
  const meta = await sharp(buf).metadata()
  if (!meta.width || !meta.height) throw new Error('source has no dimensions')
  return { buf, width: meta.width, height: meta.height, channels: meta.channels }
}

async function png1024(master) {
  return sharp(master.buf)
    .resize(1024, 1024, { fit: 'contain', background: { r: 245, g: 245, b: 245, alpha: 0 } })
    .png()
    .toBuffer()
}

async function pngAt(size, master) {
  return sharp(master.buf)
    .resize(size, size, { fit: 'contain', background: { r: 245, g: 245, b: 245, alpha: 0 } })
    .png()
    .toBuffer()
}

async function darkBgSplash(master) {
  return sharp({
    create: {
      width: 2732,
      height: 2732,
      channels: 4,
      background: { r: 48, g: 56, b: 65, alpha: 1 },
    },
  })
    .composite([{ input: await sharp(master.buf).resize(1800, 1800, { fit: 'contain', background: { r: 48, g: 56, b: 65, alpha: 0 } }).png().toBuffer(), gravity: 'center' }])
    .png()
    .toBuffer()
}

async function lightBgSplash(master) {
  return sharp({
    create: {
      width: 2732,
      height: 2732,
      channels: 4,
      background: { r: 245, g: 245, b: 245, alpha: 1 },
    },
  })
    .composite([{ input: await sharp(master.buf).resize(1800, 1800, { fit: 'contain', background: { r: 245, g: 245, b: 245, alpha: 0 } }).png().toBuffer(), gravity: 'center' }])
    .png()
    .toBuffer()
}

async function bgIconOnly(master, color) {
  const flat = sharp(master.buf)
    .resize(900, 900, { fit: 'contain', background: { ...color, alpha: 1 } })
    .flatten({ background: color })
    .png()
    .toBuffer()
  return sharp({
    create: { width: 1024, height: 1024, channels: 4, background: color },
  })
    .composite([{ input: flat, gravity: 'center' }])
    .png()
    .toBuffer()
}

async function trayTemplate(size, master) {
  return sharp(master.buf)
    .resize(size, size, { fit: 'cover' })
    .grayscale()
    .normalize()
    .threshold(180)
    .png()
    .toBuffer()
}

async function trayTemplateRaw(master) {
  return sharp(master.buf)
    .resize(1024, 1024, { fit: 'cover' })
    .grayscale()
    .normalize()
    .threshold(180)
    .png()
    .toBuffer()
}

async function trayTemplateRawPreview(master) {
  return sharp(master.buf)
    .resize(1024, 1024, { fit: 'contain', background: { r: 245, g: 245, b: 245, alpha: 1 } })
    .flatten({ background: { r: 245, g: 245, b: 245 } })
    .png()
    .toBuffer()
}

async function write(target, buf) {
  const full = path.join(ROOT, target)
  await mkdir(path.dirname(full), { recursive: true })
  await writeFile(full, buf)
  const sizeKb = (buf.length / 1024).toFixed(1)
  console.log(`  ${target.padEnd(52)} ${buf.length.toString().padStart(8)} B  (${sizeKb} KB)`)
}

async function buildIcns(master1024) {
  const buf = png2icons.createICNS(master1024, png2icons.BICUBIC, 0)
  if (!buf) throw new Error('createICNS returned null')
  return buf
}

async function buildIco(master1024) {
  // Use a multi-size source so the .ico has several resolutions baked in.
  const inputs = await Promise.all(ICO_SIZES.map((s) => pngAt(s, { buf: master1024 })))
  const buf = png2icons.createICO(master1024, png2icons.BICUBIC, 0, true, true)
  if (!buf) throw new Error('createICO returned null')
  return buf
}

async function main() {
  console.log(`Source: ${SOURCE}`)
  const master = await loadMaster(SOURCE)
  console.log(`  ${master.width}x${master.height}, ${master.channels}ch`)

  console.log('\n[desktop / assets/]')
  const master1024 = await png1024(master)
  await write('assets/icon.png', master1024)
  await write('assets/icon-raw.png', master1024)

  for (const size of LINUX_SIZES) {
    await write(`assets/icons/${size}x${size}.png`, await pngAt(size, master))
  }

  await write('assets/icon.icns', await buildIcns(master1024))
  await write('assets/icon.ico', await buildIco(master1024))

  console.log('\n[macOS tray template]')
  await write('assets/iconTemplate.png', await trayTemplate(16, master))
  await write('assets/iconTemplate@2x.png', await trayTemplate(64, master))
  await write('assets/iconTemplateRaw.png', await trayTemplateRaw(master))
  await write('assets/iconTemplateRawPreview.png', await trayTemplateRawPreview(master))

  console.log('\n[renderer / src/renderer/]')
  await write('src/renderer/static/icon.png', master1024)
  await write('src/renderer/static/favicon.png', await pngAt(32, master))
  await write('src/renderer/logo192.png', await pngAt(192, master))
  // favicon.ico — single PNG chunk at 256 inside ICO container for broad browser support.
  await write('src/renderer/favicon.ico', await buildIco(master1024))

  console.log('\n[mobile sources / resources/]')
  await write('resources/icon-only.png', master1024)
  await write('resources/icon-foreground.png', await pngAt(1024, master))
  await write('resources/icon-background.png', await sharp({
    create: { width: 1024, height: 1024, channels: 4, background: PALETTE.bgDark },
  }).png().toBuffer())
  await write('resources/splash.png', await lightBgSplash(master))
  await write('resources/splash-dark.png', await darkBgSplash(master))

  console.log('\nDone.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})