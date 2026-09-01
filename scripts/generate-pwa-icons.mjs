/**
 * Gera ícones PWA/favicon e splash nativo a partir de public/brand-logo.png.
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

/** Splash de abertura: brasão centrado em fundo navy com brilho e anéis dourados */
async function writeSplash(outName, width, height) {
  const crestSize = Math.round(Math.min(width, height) * 0.42)
  const glowSize = Math.round(crestSize * 1.55)

  const glowSvg = Buffer.from(`
    <svg width="${glowSize}" height="${glowSize}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="g" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#FBC02D" stop-opacity="0.45"/>
          <stop offset="45%" stop-color="#FBC02D" stop-opacity="0.12"/>
          <stop offset="100%" stop-color="#FBC02D" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="${glowSize / 2}" cy="${glowSize / 2}" r="${glowSize / 2}" fill="url(#g)"/>
    </svg>
  `)

  const ringSvg = Buffer.from(`
    <svg width="${glowSize}" height="${glowSize}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${glowSize / 2}" cy="${glowSize / 2}" r="${glowSize * 0.42}"
        fill="none" stroke="#FBC02D" stroke-opacity="0.35" stroke-width="2"
        stroke-dasharray="8 10"/>
      <circle cx="${glowSize / 2}" cy="${glowSize / 2}" r="${glowSize * 0.48}"
        fill="none" stroke="#FBC02D" stroke-opacity="0.18" stroke-width="1.5"/>
    </svg>
  `)

  const crest = await sharp(source)
    .resize(crestSize, crestSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()

  const glow = await sharp(glowSvg).png().toBuffer()
  const rings = await sharp(ringSvg).png().toBuffer()

  await sharp({
    create: { width, height, channels: 4, background: THEME_BG },
  })
    .composite([
      { input: glow, gravity: 'center' },
      { input: rings, gravity: 'center' },
      { input: crest, gravity: 'center' },
    ])
    .png()
    .toFile(join(publicDir, outName))
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

  const splashes = [
    ['splash-1125x2436.png', 1125, 2436], // iPhone X / XS / 11 Pro
    ['splash-1170x2532.png', 1170, 2532], // iPhone 12 / 13 / 14
    ['splash-1179x2556.png', 1179, 2556], // iPhone 14 Pro / 15 Pro
    ['splash-1284x2778.png', 1284, 2778], // iPhone 12/13/14 Pro Max
    ['splash-1290x2796.png', 1290, 2796], // iPhone 14/15 Pro Max
    ['splash-1080x1920.png', 1080, 1920], // Android genérico
  ]
  for (const [name, w, h] of splashes) {
    await writeSplash(name, w, h)
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
