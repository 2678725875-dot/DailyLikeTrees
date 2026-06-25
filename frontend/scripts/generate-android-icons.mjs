/** Generate Android icon and splash assets from the app logo. */
import sharp from 'sharp'
import { mkdirSync, readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(__dirname, '..')
const logoPath = join(projectRoot, 'public', 'assets', 'logo.png')
const resDir = join(projectRoot, 'android', 'app', 'src', 'main', 'res')

const logo = readFileSync(logoPath)

// ── Icon sizes (mipmap) ──
const ICON_SIZES = {
  mdpi: 48,
  hdpi: 72,
  xhdpi: 96,
  xxhdpi: 144,
  xxxhdpi: 192,
}

const FOREGROUND_SIZES = {
  mdpi: 108,
  hdpi: 162,
  xhdpi: 216,
  xxhdpi: 324,
  xxxhdpi: 432,
}

const SPLASH_SIZES = {
  'drawable-land-mdpi': { w: 480, h: 320 },
  'drawable-land-hdpi': { w: 800, h: 480 },
  'drawable-land-xhdpi': { w: 1280, h: 720 },
  'drawable-land-xxhdpi': { w: 1600, h: 960 },
  'drawable-land-xxxhdpi': { w: 1920, h: 1280 },
  'drawable-port-mdpi': { w: 480, h: 320 },
  'drawable-port-hdpi': { w: 800, h: 480 },
  'drawable-port-xhdpi': { w: 1280, h: 720 },
  'drawable-port-xxhdpi': { w: 1600, h: 960 },
  'drawable-port-xxxhdpi': { w: 1920, h: 1280 },
}

async function generate() {
  console.log('Generating Android icons...')

  // ── Generate round + standard launcher icons ──
  for (const [density, size] of Object.entries(ICON_SIZES)) {
    const dir = join(resDir, `mipmap-${density}`)
    mkdirSync(dir, { recursive: true })

    // Standard icon
    await sharp(logo).resize(size, size).toFile(join(dir, 'ic_launcher.png'))

    // Round icon (same for now — we use a square logo)
    await sharp(logo).resize(size, size).toFile(join(dir, 'ic_launcher_round.png'))
  }

  // ── Generate adaptive icon foreground layers ──
  for (const [density, size] of Object.entries(FOREGROUND_SIZES)) {
    const dir = join(resDir, `mipmap-${density}`)
    mkdirSync(dir, { recursive: true })

    // Foreground: logo scaled to ~60% of the adaptive icon canvas (centered)
    const fgSize = Math.round(size * 0.6)
    await sharp(logo).resize(fgSize, fgSize).toFile(join(dir, 'ic_launcher_foreground.png'))
  }

  // ── Generate splash screens ──
  for (const [dirName, { w, h }] of Object.entries(SPLASH_SIZES)) {
    const dir = join(resDir, dirName)
    mkdirSync(dir, { recursive: true })

    // Splash: logo centered on white background, ~40% of smallest dimension
    const logoSize = Math.round(Math.min(w, h) * 0.35)
    const logoBuf = await sharp(logo).resize(logoSize, logoSize).toBuffer()

    await sharp({
      create: { width: w, height: h, channels: 4, background: { r: 248, g: 250, b: 245, alpha: 1 } }
    })
      .composite([{ input: logoBuf, gravity: 'center' }])
      .toFile(join(dir, 'splash.png'))
  }

  // Copy the main splash (same as port-xxhdpi for default)
  const mainSplash = await sharp({
    create: { width: 1600, height: 960, channels: 4, background: { r: 248, g: 250, b: 245, alpha: 1 } }
  })
    .composite([{
      input: await sharp(logo).resize(300, 300).toBuffer(),
      gravity: 'center'
    }])
    .toFile(join(resDir, 'drawable', 'splash.png'))

  console.log('Done! All Android icons & splash screens generated.')
}

generate().catch(err => { console.error(err); process.exit(1) })
