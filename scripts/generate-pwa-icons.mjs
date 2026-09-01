/**
 * Gera ícones PWA/favicon a partir de public/brand-logo.png (brasão oficial BMB).
 * Rode: pnpm icons:generate
 */
import { writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import pngToIco from 'png-to-ico'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')
const source = join(publicDir, 'brand-logo.png')

/** theme_color / background do manifest (#1B263B) */
const THEME_BG = { r: 27, g: 38, b: 59, alpha: 1 }

async function writeSquare(outName, size, { maskable = false } = {}) {
  const outPath = join(publicDir, outName)

  if (!maskable) {
    await sharp(source).resize(size, size, { fit: 'cover' }).png().toFile(outPath)
    return
  }

  const inner = Math.round(size * 0.78)
  const logo = await sharp(source)
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()

  await sharp({
    create: { width: size, height: size, channels: 4, background: THEME_BG },
  })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toFile(outPath)
}

async function main() {
  const tasks = [
    ['icon-192.png', 192],
    ['icon-512.png', 512],
    ['apple-touch-icon.png', 180],
    ['favicon-32.png', 32],
    ['favicon-16.png', 16],
    ['icon-192-maskable.png', 192, { maskable: true }],
    ['icon-512-maskable.png', 512, { maskable: true }],
  ]

  for (const [name, size, opts = {}] of tasks) {
    await writeSquare(name, size, opts)
    console.log(`✓ ${name}`)
  }

  const ico = await pngToIco([
    join(publicDir, 'favicon-16.png'),
    join(publicDir, 'favicon-32.png'),
  ])
  writeFileSync(join(publicDir, 'favicon.ico'), ico)
  console.log('✓ favicon.ico')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
