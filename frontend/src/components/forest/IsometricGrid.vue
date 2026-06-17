<template>
  <div
    ref="containerRef"
    class="iso-container"
    :class="{ 'is-bg': isBackground }"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointerleave="onPointerUp"
    @wheel="onWheel"
  >
    <canvas ref="canvasRef" class="iso-canvas" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import * as PIXI from 'pixi.js'
import type { PlantedTree } from '../../types/tree'
import type { TerrainType, WeatherType } from '../../types/forest'
import { gridToScreen, depthSortKey } from '../../utils/isometric'
import { TREE_SPECIES } from '../../utils/constants'

const props = defineProps<{
  trees: PlantedTree[]
  terrain: TerrainType
  weather: WeatherType
  isBackground?: boolean
  forceRefresh?: number
}>()

const containerRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

// ── PixiJS objects ──
let app: PIXI.Application | null = null
let gridGraphics: PIXI.Graphics | null = null
let weatherGraphics: PIXI.Graphics | null = null

// ── Camera + Zoom (only grid, not weather) ──
let camX = 0, camY = 0
const MIN_ZOOM = 0.5
const MAX_ZOOM = 3.0
const zoomLevel = ref(1.0)
let isPanning = false
let panStart = { x: 0, y: 0 }

// ── Geometry ──
const TILE_W = 80
const TILE_H = 40
const CUBE_BASE_H = 22
const COLS = computed(() => props.isBackground ? 16 : 8)

// ── Random terrain seed ──
const terrainSeed = ref(Math.random() * 1000)

// ═══════════════════════════════════════════
//  NOISE
// ═══════════════════════════════════════════

function hash33(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123
  return n - Math.floor(n)
}

function smoothNoise(x: number, y: number): number {
  const ix = Math.floor(x), iy = Math.floor(y)
  const fx = x - ix, fy = y - iy
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy)
  const n00 = hash33(ix, iy), n10 = hash33(ix + 1, iy)
  const n01 = hash33(ix, iy + 1), n11 = hash33(ix + 1, iy + 1)
  return n00 * (1 - sx) * (1 - sy) + n10 * sx * (1 - sy) + n01 * (1 - sx) * sy + n11 * sx * sy
}

function fbm(x: number, y: number, octaves: number = 3): number {
  let value = 0, amp = 1, freq = 1, total = 0
  for (let i = 0; i < octaves; i++) {
    value += smoothNoise(x * freq, y * freq) * amp
    total += amp
    amp *= 0.5; freq *= 2.0
  }
  return value / total
}

// ═══════════════════════════════════════════
//  TILE KIND + HEIGHT
// ═══════════════════════════════════════════

type TileKind = 'plain' | 'water' | 'rock' | 'rock_edge'

const FACE_COLORS: Record<TileKind, { top: number; left: number; right: number }> = {
  plain:     { top: 0xc8dda0, left: 0xa8c080, right: 0x8aaa68 },
  water:     { top: 0x88c0e0, left: 0x6aa8cc, right: 0x5090b8 },
  rock:      { top: 0xc0b0a0, left: 0xa89888, right: 0x908070 },
  rock_edge: { top: 0xb8c898, left: 0xa0b880, right: 0x8ca070 },
}

let heightNoiseCache = new Map<string, number>()

function getHeightNoise(gx: number, gy: number): number {
  const key = `${gx},${gy}`
  if (!heightNoiseCache.has(key)) {
    const seed = terrainSeed.value + (props.terrain === 'mountain' ? 100 : props.terrain === 'creek' ? 200 : 0)
    heightNoiseCache.set(key, fbm(gx * 0.6 + seed, gy * 0.6 + seed, 3))
  }
  return heightNoiseCache.get(key)!
}

function getMountainPeaks(rows: number, cols: number): Array<{ gx: number; gy: number }> {
  const s = terrainSeed.value
  const peaks: Array<{ gx: number; gy: number }> = []
  for (let i = 0; i < 3; i++) {
    peaks.push({
      gx: 1 + ((s * (i + 1) * 137.5 + i * 79) % (cols - 2)),
      gy: 0.8 + ((s * (i + 2) * 251.3 + i * 113) % Math.max(1, rows - 1.5)),
    })
  }
  return peaks
}

function getTileKind(gx: number, gy: number, terrain: TerrainType, rows: number, cols: number): TileKind {
  if (terrain === 'plain') return 'plain'

  if (terrain === 'creek') {
    const s = terrainSeed.value
    const creekY = Math.sin(gx * 0.7 + s * 0.3) * 1.6 + Math.cos(gx * 0.45 + s * 0.17) * 0.6 + rows * 0.45
    const dist = Math.abs(gy - creekY)
    if (dist < 0.9) return 'water'
    if (dist < 1.3 && ((gx * 37 + gy * 59 + s * 100) % 100) < 50) return 'water'
    if (dist < 1.8 && ((gx * 73 + gy * 47 + s * 50) % 100) < 15) return 'water'
    return 'plain'
  }

  if (terrain === 'mountain') {
    const peaks = getMountainPeaks(rows, cols)
    let minDist = Infinity
    for (const p of peaks) minDist = Math.min(minDist, Math.sqrt((gx - p.gx) ** 2 + (gy - p.gy) ** 2))
    const rng = ((gx * 47 + gy * 73 + terrainSeed.value * 31) % 100) / 100
    if (minDist < 1.3) return rng < 0.88 ? 'rock' : 'rock_edge'
    if (minDist < 2.2) return rng < 0.65 ? 'rock' : rng < 0.85 ? 'rock_edge' : 'plain'
    if (minDist < 3.2) return rng < 0.22 ? 'rock' : rng < 0.40 ? 'rock_edge' : 'plain'
    if (minDist < 4.5) return rng < 0.06 ? 'rock' : rng < 0.14 ? 'rock_edge' : 'plain'
    return rng < 0.02 ? 'rock_edge' : 'plain'
  }

  return 'plain'
}

function getCubeHeight(kind: TileKind, gx: number, gy: number): number {
  const noise = getHeightNoise(gx, gy)
  switch (kind) {
    case 'rock':      return CUBE_BASE_H * (1.3 + noise * 0.9)
    case 'rock_edge': return CUBE_BASE_H * (0.75 + noise * 0.45)
    case 'water':     return CUBE_BASE_H * (0.3 + noise * 0.1)
    default:          return CUBE_BASE_H * (0.55 + noise * 0.55)
  }
}

// ═══════════════════════════════════════════
//  TREE PLACEMENT
// ═══════════════════════════════════════════

interface TreePlacement { gx: number; gy: number; kind: TileKind }
const treePlacements = ref<Map<number, TreePlacement>>(new Map())

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function assignTreePositions(trees: PlantedTree[], tileKinds: TileKind[][], rows: number, cols: number): Map<number, TreePlacement> {
  const placements = new Map<number, TreePlacement>()
  const available: Array<{ gx: number; gy: number; kind: TileKind }> = []
  for (let gy = 0; gy < rows; gy++) {
    const row = tileKinds[gy]
    if (!row) continue
    for (let gx = 0; gx < cols; gx++)
      if ((row[gx] ?? 'plain') !== 'water')
        available.push({ gx, gy, kind: row[gx] ?? 'plain' })
  }
  shuffle(available)
  for (let i = 0; i < trees.length; i++) {
    if (i < available.length) {
      placements.set(trees[i].id, { ...available[i] })
    } else {
      // Fallback: find any non-water position using modulo over the grid
      let placed = false
      for (let attempt = 0; attempt < rows * cols; attempt++) {
        const gx = (i + attempt) % cols
        const gy = Math.floor((i + attempt) / cols) % rows
        const kind = tileKinds[gy]?.[gx] ?? 'plain'
        if (kind !== 'water') {
          placements.set(trees[i].id, { gx, gy, kind })
          placed = true
          break
        }
      }
      if (!placed) placements.set(trees[i].id, { gx: i % cols, gy: Math.floor(i / cols) % rows, kind: 'plain' })
    }
  }
  return placements
}

// ═══════════════════════════════════════════
//  TREE GROWTH ANIMATION
// ═══════════════════════════════════════════

const ANIM_DURATION = 700, ANIM_STAGGER = 55
const treeAnimProgress = ref<Map<number, number>>(new Map())
let animStartTime = 0, animTreeOrder: number[] = [], isAnimating = false

function startGrowthAnimation(treeIds: number[]): void {
  if (treeIds.length === 0 || !app) return
  app.ticker.remove(onAnimationTick)
  isAnimating = false
  treeAnimProgress.value = new Map(treeIds.map(id => [id, 0]))
  animStartTime = performance.now()
  animTreeOrder = [...treeIds]
  isAnimating = true
  app.ticker.add(onAnimationTick)
}

function onAnimationTick(): void {
  if (!isAnimating || !app) return
  const elapsed = performance.now() - animStartTime
  let allDone = true
  for (let i = 0; i < animTreeOrder.length; i++) {
    const treeId = animTreeOrder[i]
    const treeStart = i * ANIM_STAGGER
    const treeElapsed = elapsed - treeStart
    if (treeElapsed <= 0) { allDone = false; continue }
    if (treeElapsed >= ANIM_DURATION) { treeAnimProgress.value.set(treeId, 1) }
    else {
      const t = treeElapsed / ANIM_DURATION
      treeAnimProgress.value.set(treeId, 1 - Math.pow(1 - t, 3))
      allDone = false
    }
  }
  renderScene()
  if (allDone) { isAnimating = false; app.ticker.remove(onAnimationTick); renderScene() }
}

// ═══════════════════════════════════════════
//  WEATHER STATE (screen-space)
// ═══════════════════════════════════════════

interface Raindrop { x: number; y: number; speed: number; length: number; alpha: number }
interface Splash { x: number; y: number; radius: number; life: number; maxLife: number }
interface Sparkle { x: number; y: number; life: number; maxLife: number; size: number }
interface SplashParticle { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number }

let raindrops: Raindrop[] = []
let splashes: Splash[] = []
let splashParticles: SplashParticle[] = []
let sparkles: Sparkle[] = []
let lightningTimer = 0, lightningAlpha = 0
let cloudOffset = 0
let weatherTickerActive = false
// Pre-computed tile screen-space diamond bounds for rain-tile collision
let tileScreenDiamonds: Array<{ cx: number; cy: number; top: number; bot: number; left: number; right: number; hw: number; hh: number }> = []

function initRaindrops(): void {
  if (!app) return
  const w = app.screen.width, h = app.screen.height
  const count = props.weather === 'thunderstorm' ? 200 : 90
  raindrops = []
  for (let i = 0; i < count; i++) {
    raindrops.push({
      x: Math.random() * w * 1.6 - w * 0.3,
      y: Math.random() * h * 1.6 - h * 0.3,
      speed: 8 + Math.random() * 12,
      length: 12 + Math.random() * 18,
      alpha: 0.18 + Math.random() * 0.32,
    })
  }
  splashes = []
  splashParticles = []
}

function initSparkles(): void {
  if (!app) return
  sparkles = []
  for (let i = 0; i < 25; i++) {
    sparkles.push({
      x: Math.random() * app.screen.width,
      y: Math.random() * app.screen.height * 0.7,
      life: Math.random(),
      maxLife: 2 + Math.random() * 4,
      size: 2 + Math.random() * 4.5,
    })
  }
}

// ── Splash helpers ──

function spawnBottomSplash(x: number, screenH: number): void {
  const y = screenH - 2 - Math.random() * 18
  // Main splash ring
  splashes.push({
    x, y,
    radius: 1.8 + Math.random() * 3.5,
    life: 0,
    maxLife: 0.22 + Math.random() * 0.28,
  })
  // Upward spray droplets
  const count = 2 + Math.floor(Math.random() * 3)
  for (let i = 0; i < count; i++) {
    splashParticles.push({
      x, y,
      vx: (Math.random() - 0.5) * 40,
      vy: -(20 + Math.random() * 50),
      life: 0,
      maxLife: 0.3 + Math.random() * 0.4,
      size: 1 + Math.random() * 2,
    })
  }
}

function spawnTileSplash(x: number, y: number): void {
  // Ring splash on tile
  splashes.push({
    x, y,
    radius: 2 + Math.random() * 3,
    life: 0,
    maxLife: 0.18 + Math.random() * 0.22,
  })
  // Droplets spraying in all directions (mostly upward/outward)
  const count = 2 + Math.floor(Math.random() * 4)
  for (let i = 0; i < count; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.2 // mostly upward
    const speed = 25 + Math.random() * 55
    splashParticles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0,
      maxLife: 0.25 + Math.random() * 0.35,
      size: 1 + Math.random() * 2.2,
    })
  }
}

function onWeatherTick(): void {
  if (!app || !weatherGraphics) return
  const dt = Math.min(app.ticker.deltaMS / 1000, 0.1)

  if (props.weather === 'rainy' || props.weather === 'thunderstorm') {
    // Rebuild tile screen map every tick so splashes stay locked to tiles
    // even while the user is panning/dragging the camera
    buildTileScreenMap()
    const w = app.screen.width, h = app.screen.height
    // Animate rain
    for (const drop of raindrops) {
      drop.y += drop.speed * 60 * dt
      drop.x -= drop.speed * 0.35 * 60 * dt
      // Check tile-top collision (proper diamond formula)
      let hitTile = false
      for (const td of tileScreenDiamonds) {
        if (drop.y >= td.top && drop.y <= td.bot && drop.x >= td.left && drop.x <= td.right) {
          // Correct diamond: |px-cx|/hw + |py-cy|/hh <= 1
          const diamondCY = (td.top + td.bot) / 2
          const diamondHH = (td.bot - td.top) / 2
          const dx = Math.abs(drop.x - td.cx) / td.hw
          const dy = Math.abs(drop.y - diamondCY) / diamondHH
          if (dx + dy <= 1.08) {
            // Raindrop hit this tile top
            spawnTileSplash(drop.x, drop.y)
            drop.y = -40 - Math.random() * 80
            drop.x = Math.random() * w * 1.6 - w * 0.3
            hitTile = true
            break
          }
        }
      }
      if (hitTile) continue
      // Bottom-of-screen splash
      if (drop.y > h + 10) {
        spawnBottomSplash(drop.x, h)
        drop.y = -40 - Math.random() * 60
        drop.x = Math.random() * w * 1.6 - w * 0.3
      }
      if (drop.x < -80) drop.x = w + 40
    }
    // Animate splashes
    for (let i = splashes.length - 1; i >= 0; i--) {
      splashes[i].life += dt
      if (splashes[i].life >= splashes[i].maxLife) splashes.splice(i, 1)
    }
    // Animate splash particles (droplets spraying upward)
    for (let i = splashParticles.length - 1; i >= 0; i--) {
      const p = splashParticles[i]
      p.life += dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vy += 120 * dt // gravity
      if (p.life >= p.maxLife) splashParticles.splice(i, 1)
    }
    // Lightning — less frequent & dimmer in dark mode
    if (props.weather === 'thunderstorm') {
      lightningTimer -= dt
      if (lightningTimer <= 0) {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
        lightningAlpha = isDark ? 0.12 + Math.random() * 0.18 : 0.25 + Math.random() * 0.4
        lightningTimer = isDark ? 3 + Math.random() * 7 : 1.5 + Math.random() * 5
      } else if (lightningAlpha > 0.001) {
        lightningAlpha *= Math.pow(0.015, dt)
      } else {
        lightningAlpha = 0
      }
    }
    drawWeatherOverlay()
    return
  }

  if (props.weather === 'cloudy') {
    cloudOffset += dt * 0.4 // faster drift
    drawWeatherOverlay()
    return
  }

  if (props.weather === 'sunny') {
    for (const s of sparkles) {
      s.life += dt
      if (s.life > s.maxLife) {
        s.life = 0
        s.x = Math.random() * app.screen.width
        s.y = Math.random() * app.screen.height * 0.65
      }
    }
    drawWeatherOverlay()
    return
  }
}

function startWeatherTicker(): void {
  if (!app || weatherTickerActive) return
  app.ticker.add(onWeatherTick)
  weatherTickerActive = true
}

function stopWeatherTicker(): void {
  if (app && weatherTickerActive) {
    app.ticker.remove(onWeatherTick)
    weatherTickerActive = false
  }
}

// ═══════════════════════════════════════════
//  DRAWING
// ═══════════════════════════════════════════

function adjustColor(color: number, factor: number): number {
  const r = Math.min(255, Math.max(0, Math.floor(((color >> 16) & 0xff) * factor)))
  const g = Math.min(255, Math.max(0, Math.floor(((color >> 8) & 0xff) * factor)))
  const b = Math.min(255, Math.max(0, Math.floor((color & 0xff) * factor)))
  return (r << 16) | (g << 8) | b
}

function drawCube(gfx: PIXI.Graphics, gx: number, gy: number, kind: TileKind): void {
  const { x: cx, y: cy } = gridToScreen(gx, gy, { tileWidth: TILE_W, tileHeight: TILE_H, offsetX: 0, offsetY: 0 })
  const h = getCubeHeight(kind, gx, gy)
  const noise = getHeightNoise(gx, gy)
  const colors = FACE_COLORS[kind]
  const HW = TILE_W / 2, HH = TILE_H / 2
  const colorVar = 0.92 + noise * 0.16

  const tTop = { x: cx, y: cy - HH - h }, tRight = { x: cx + HW, y: cy - h }
  const tBottom = { x: cx, y: cy + HH - h }, tLeft = { x: cx - HW, y: cy - h }
  const bTop = { x: cx, y: cy - HH }, bRight = { x: cx + HW, y: cy }
  const bBottom = { x: cx, y: cy + HH }, bLeft = { x: cx - HW, y: cy }

  gfx.beginFill(adjustColor(colors.top, colorVar))
  gfx.moveTo(tTop.x, tTop.y); gfx.lineTo(tRight.x, tRight.y)
  gfx.lineTo(tBottom.x, tBottom.y); gfx.lineTo(tLeft.x, tLeft.y); gfx.closePath()
  gfx.endFill()

  gfx.beginFill(adjustColor(colors.left, colorVar * 0.92))
  gfx.moveTo(tLeft.x, tLeft.y); gfx.lineTo(tBottom.x, tBottom.y)
  gfx.lineTo(bBottom.x, bBottom.y); gfx.lineTo(bLeft.x, bLeft.y); gfx.closePath()
  gfx.endFill()

  gfx.beginFill(adjustColor(colors.right, colorVar * 0.85))
  gfx.moveTo(tRight.x, tRight.y); gfx.lineTo(tBottom.x, tBottom.y)
  gfx.lineTo(bBottom.x, bBottom.y); gfx.lineTo(bRight.x, bRight.y); gfx.closePath()
  gfx.endFill()

  gfx.lineStyle(0.5, 0x000000, 0.05)
  gfx.moveTo(tTop.x, tTop.y); gfx.lineTo(tRight.x, tRight.y)
  gfx.lineTo(tBottom.x, tBottom.y); gfx.lineTo(tLeft.x, tLeft.y); gfx.closePath()
  gfx.moveTo(tTop.x, tTop.y); gfx.lineTo(bBottom.x, bBottom.y)
  gfx.moveTo(tLeft.x, tLeft.y); gfx.lineTo(bRight.x, bRight.y)
  gfx.lineStyle(0)
}

function drawTreeOnCube(gfx: PIXI.Graphics, gx: number, gy: number, kind: TileKind, speciesColor: number, growthStage: number, animProgress: number): void {
  const { x: cx, y: cy } = gridToScreen(gx, gy, { tileWidth: TILE_W, tileHeight: TILE_H, offsetX: 0, offsetY: 0 })
  const h = getCubeHeight(kind, gx, gy)
  const treeX = cx, treeY = cy - h, p = animProgress
  if (p <= 0) return

  const size = 16 + growthStage * 8
  const trunkH = size * 0.42 * p
  const trunkW = Math.max(2, size * 0.1)
  const trunkP = Math.min(1, p / 0.35)
  const trunkActualH = trunkH * trunkP

  gfx.beginFill(0x8B6914, 0.9)
  gfx.drawRect(treeX - trunkW / 2, treeY - trunkActualH * 0.5, trunkW, trunkActualH)
  gfx.endFill()

  if (p > 0.15) {
    const canopyP = (p - 0.15) / 0.85, r = size * 0.26 * canopyP
    const canopyY = treeY - trunkActualH * 0.3
    gfx.beginFill(speciesColor, 0.7 * canopyP)
    gfx.drawCircle(treeX - r * 0.5, canopyY - r * 0.1, r * 0.75)
    gfx.drawCircle(treeX + r * 0.5, canopyY - r * 0.1, r * 0.75)
    gfx.endFill()
    gfx.beginFill(speciesColor, 0.85 * canopyP)
    gfx.drawCircle(treeX, canopyY - r * 0.9, r)
    gfx.endFill()
    if (canopyP > 0.5) {
      gfx.beginFill(0xffffff, 0.12 * (canopyP - 0.5) * 2)
      gfx.drawCircle(treeX - r * 0.2, canopyY - r * 1.15, r * 0.35)
      gfx.endFill()
    }
  }

  if (growthStage === 0 && p > 0.3) {
    const sproutP = (p - 0.3) / 0.7
    gfx.beginFill(speciesColor, 0.9 * sproutP)
    gfx.drawCircle(treeX, treeY - trunkH * 0.5 - 2 * sproutP, 2.5 * sproutP)
    gfx.endFill()
  }
}

// ═══════════════════════════════════════════
//  WEATHER OVERLAY (screen-space)
// ═══════════════════════════════════════════

function drawWeatherOverlay(): void {
  if (!weatherGraphics || !app) return
  weatherGraphics.clear()
  const w = app.screen.width, h = app.screen.height

  // ── Sunny ──
  if (props.weather === 'sunny') {
    // Soft continuous gradient from warm top to transparent bottom
    const strips = 24
    for (let i = 0; i < strips; i++) {
      const t = i / strips
      const alpha = 0.09 * (1 - t) * (1 - t) // quadratic falloff
      const r = 255
      const g = 220 + Math.floor(35 * (1 - t))
      const b = 170 + Math.floor(70 * (1 - t))
      const color = (r << 16) | (g << 8) | b
      const stripH = h / strips
      weatherGraphics.beginFill(color, alpha)
      weatherGraphics.drawRect(0, i * stripH, w, stripH + 1)
      weatherGraphics.endFill()
    }

    // Sun disc near top-right
    const sunX = w * 0.78, sunY = h * 0.12
    // Outer glow
    for (let ring = 3; ring >= 0; ring--) {
      const r = 45 + ring * 22
      const alpha = 0.06 - ring * 0.013
      weatherGraphics.beginFill(0xfff8e0, alpha)
      weatherGraphics.drawCircle(sunX, sunY, r)
      weatherGraphics.endFill()
    }
    // Core
    weatherGraphics.beginFill(0xfffbe8, 0.12)
    weatherGraphics.drawCircle(sunX, sunY, 28)
    weatherGraphics.endFill()

    for (const s of sparkles) {
      const lifeRatio = s.life / s.maxLife
      const alpha = lifeRatio < 0.25 ? lifeRatio / 0.25 * 0.8
        : lifeRatio > 0.75 ? (1 - (lifeRatio - 0.75) / 0.25) * 0.8 : 0.8
      // Brighter center
      weatherGraphics.beginFill(0xffffff, alpha)
      weatherGraphics.drawCircle(s.x, s.y, s.size * 0.6)
      weatherGraphics.endFill()
      // Soft outer glow
      weatherGraphics.beginFill(0xfff8e0, alpha * 0.45)
      weatherGraphics.drawCircle(s.x, s.y, s.size * 2.0)
      weatherGraphics.endFill()
      // Cross sparkle for larger ones (star shape)
      if (s.size > 2.5) {
        weatherGraphics.lineStyle(0.6, 0xffffff, alpha * 0.55)
        const arm = s.size * 2.5
        weatherGraphics.moveTo(s.x - arm, s.y); weatherGraphics.lineTo(s.x + arm, s.y)
        weatherGraphics.moveTo(s.x, s.y - arm); weatherGraphics.lineTo(s.x, s.y + arm)
        // Diagonal arms
        const d = arm * 0.55
        weatherGraphics.moveTo(s.x - d, s.y - d); weatherGraphics.lineTo(s.x + d, s.y + d)
        weatherGraphics.moveTo(s.x + d, s.y - d); weatherGraphics.lineTo(s.x - d, s.y + d)
        weatherGraphics.lineStyle(0)
      }
    }
    return
  }

  // ── Cloudy ──
  if (props.weather === 'cloudy') {
    weatherGraphics.beginFill(0xbcc0cc, 0.10)
    weatherGraphics.drawRect(0, 0, w, h)
    weatherGraphics.endFill()

    const clouds = [
      { x: 0.10, y: 0.08, scale: 1.0 },
      { x: 0.48, y: 0.05, scale: 1.3 },
      { x: 0.30, y: 0.20, scale: 0.85 },
      { x: 0.72, y: 0.10, scale: 0.9 },
      { x: 0.16, y: 0.30, scale: 0.75 },
      { x: 0.58, y: 0.26, scale: 1.0 },
      { x: 0.40, y: 0.38, scale: 0.7 },
    ]

    for (const cloud of clouds) {
      const cx = ((cloud.x + cloudOffset * 0.03) % 1.5 - 0.25) * w
      const cy = cloud.y * h
      const s = cloud.scale
      const baseRx = 80 * s
      const baseRy = 24 * s

      // Draw cumulus cloud as cluster of overlapping ellipses
      // Top bumps (3-5 circles forming the puffy top)
      const topBumps = [
        { dx: -0.35, dy: -0.35, rx: 0.55, ry: 0.55, alpha: 0.28 },
        { dx: -0.10, dy: -0.50, rx: 0.65, ry: 0.60, alpha: 0.32 },
        { dx: 0.18, dy: -0.45, rx: 0.58, ry: 0.55, alpha: 0.30 },
        { dx: 0.42, dy: -0.30, rx: 0.48, ry: 0.45, alpha: 0.26 },
        { dx: 0.55, dy: -0.10, rx: 0.35, ry: 0.38, alpha: 0.20 },
      ]
      // Middle body (wide ellipse)
      const midBlobs = [
        { dx: -0.20, dy: 0.05, rx: 0.75, ry: 0.50, alpha: 0.30 },
        { dx: 0.25, dy: 0.08, rx: 0.70, ry: 0.48, alpha: 0.28 },
      ]
      // Bottom (flatter, darker)
      const botBlobs = [
        { dx: -0.05, dy: 0.35, rx: 0.80, ry: 0.40, alpha: 0.22 },
        { dx: 0.15, dy: 0.30, rx: 0.60, ry: 0.35, alpha: 0.18 },
      ]

      for (const b of topBumps) {
        weatherGraphics.beginFill(0xd8dce8, b.alpha)
        weatherGraphics.drawEllipse(cx + b.dx * baseRx, cy + b.dy * baseRy, b.rx * baseRx, b.ry * baseRy)
        weatherGraphics.endFill()
      }
      for (const b of midBlobs) {
        weatherGraphics.beginFill(0xd0d4e2, b.alpha)
        weatherGraphics.drawEllipse(cx + b.dx * baseRx, cy + b.dy * baseRy, b.rx * baseRx, b.ry * baseRy)
        weatherGraphics.endFill()
      }
      for (const b of botBlobs) {
        weatherGraphics.beginFill(0xc4c8d6, b.alpha)
        weatherGraphics.drawEllipse(cx + b.dx * baseRx, cy + b.dy * baseRy, b.rx * baseRx, b.ry * baseRy)
        weatherGraphics.endFill()
      }
      // Highlight on top-left
      weatherGraphics.beginFill(0xe8ecf4, 0.18)
      weatherGraphics.drawEllipse(cx - 0.12 * baseRx, cy - 0.30 * baseRy, 0.42 * baseRx, 0.38 * baseRy)
      weatherGraphics.endFill()
    }
    return
  }

  // ── Rainy / Thunderstorm ──
  if (props.weather === 'rainy' || props.weather === 'thunderstorm') {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
    const tintAlpha = props.weather === 'thunderstorm' ? 0.20 : 0.10
    const tintColor = props.weather === 'thunderstorm' ? 0x384058 : 0x5870a0

    weatherGraphics.beginFill(tintColor, tintAlpha)
    weatherGraphics.drawRect(0, 0, w, h)
    weatherGraphics.endFill()

    // Lightning flash — yellow in light mode, softer white in dark mode
    if (lightningAlpha > 0.003) {
      const flashColor = isDark ? 0xaaaaaa : 0xffe880
      const flashAlpha = isDark ? lightningAlpha * 0.6 : lightningAlpha
      weatherGraphics.beginFill(flashColor, flashAlpha)
      weatherGraphics.drawRect(0, 0, w, h)
      weatherGraphics.endFill()

      // Bolt
      if (lightningAlpha > 0.06) {
        const boltX = w * 0.25 + Math.random() * w * 0.5
        const boltW = 3 + Math.random() * 4
        const boltColor = isDark ? 0xcccccc : 0xffe880
        const boltAlpha = isDark ? Math.min(1, lightningAlpha * 1.2) : Math.min(1, lightningAlpha * 1.8)
        weatherGraphics.lineStyle(boltW, boltColor, boltAlpha)
        weatherGraphics.moveTo(boltX, 0)
        let by = 0
        while (by < h) {
          const segH = 15 + Math.random() * 45
          const segX = boltX + (Math.random() - 0.5) * 80
          weatherGraphics.lineTo(segX, Math.min(h, by + segH))
          by += segH
        }
        weatherGraphics.lineStyle(0)

        // Branch bolt
        if (Math.random() < 0.4) {
          const branchY = h * 0.2 + Math.random() * h * 0.4
          weatherGraphics.lineStyle(boltW * 0.5, boltColor, boltAlpha * 0.7)
          weatherGraphics.moveTo(boltX, branchY)
          weatherGraphics.lineTo(boltX + (Math.random() - 0.5) * 120, branchY + 40 + Math.random() * 60)
          weatherGraphics.lineStyle(0)
        }
      }
    }

    // Rain streaks — more visible blue in light mode
    const rainColor = isDark ? 0xb8d4ff : 0x4488cc
    for (const drop of raindrops) {
      weatherGraphics.lineStyle(1.3, rainColor, drop.alpha)
      weatherGraphics.moveTo(drop.x, drop.y)
      weatherGraphics.lineTo(drop.x + 2, drop.y + drop.length)
      weatherGraphics.lineStyle(0)
    }

    // Splash rings
    const splashStrokeColor = isDark ? 0xc8e0ff : 0x4488cc
    const splashFillColor = isDark ? 0xd8ecff : 0x5599dd
    const splashDotColor = isDark ? 0xe8f4ff : 0x66aaee
    const splashParticleColor = isDark ? 0xd0e8ff : 0x5599dd
    for (const s of splashes) {
      const progress = s.life / s.maxLife
      const alpha = (1 - progress) * 0.7
      const r = s.radius * (1 + progress * 2.5)
      // Outer fading ring
      weatherGraphics.lineStyle(1.2, splashStrokeColor, alpha * 0.7)
      weatherGraphics.drawCircle(s.x, s.y, r)
      weatherGraphics.lineStyle(0)
      // Inner brighter ring
      weatherGraphics.lineStyle(0.8, splashFillColor, alpha)
      weatherGraphics.drawCircle(s.x, s.y, r * 0.55)
      weatherGraphics.lineStyle(0)
      // Bright center dot
      weatherGraphics.beginFill(splashDotColor, alpha * 0.8)
      weatherGraphics.drawCircle(s.x, s.y, r * 0.2)
      weatherGraphics.endFill()
    }
    // Splash particles (spray droplets)
    for (const p of splashParticles) {
      const progress = p.life / p.maxLife
      const alpha = (1 - progress) * 0.65
      weatherGraphics.beginFill(splashParticleColor, alpha)
      weatherGraphics.drawCircle(p.x, p.y, p.size * (1 - progress * 0.4))
      weatherGraphics.endFill()
    }
    return
  }
}

// ═══════════════════════════════════════════
//  SCENE ASSEMBLY
// ═══════════════════════════════════════════

function computeRows(): number {
  if (props.isBackground) return 10
  const maxY = Math.max(...props.trees.map(t => t.grid_y), 0)
  return Math.max(maxY + 1, 5)
}

function renderScene(): void {
  if (!app || !gridGraphics) return
  gridGraphics.clear()

  const rows = computeRows(), cols = COLS.value
  const tileKinds: TileKind[][] = []
  for (let gy = 0; gy < rows; gy++) {
    tileKinds[gy] = []
    for (let gx = 0; gx < cols; gx++)
      tileKinds[gy][gx] = getTileKind(gx, gy, props.terrain, rows, cols)
  }

  interface Cell { gx: number; gy: number; kind: TileKind }
  const cells: Cell[] = []
  for (let gy = 0; gy < rows; gy++)
    for (let gx = 0; gx < cols; gx++)
      cells.push({ gx, gy, kind: tileKinds[gy][gx] })
  cells.sort((a, b) => depthSortKey(a.gx, a.gy) - depthSortKey(b.gx, b.gy))

  const treeOnCell = new Map<string, { tree: PlantedTree; kind: TileKind }>()
  for (const [id, placement] of treePlacements.value) {
    const tree = props.trees.find(t => t.id === id)
    if (tree) treeOnCell.set(`${placement.gx},${placement.gy}`, { tree, kind: placement.kind })
  }

  for (const cell of cells) {
    drawCube(gridGraphics, cell.gx, cell.gy, cell.kind)
    // Only draw trees on non-water tiles (defense-in-depth)
    if (cell.kind === 'water') continue
    const entry = treeOnCell.get(`${cell.gx},${cell.gy}`)
    if (entry) {
      const species = TREE_SPECIES.find(s => s.id === entry.tree.species_id)
      const leafColor = parseInt((species?.color || '#6B8E23').replace('#', ''), 16)
      const progress = treeAnimProgress.value.get(entry.tree.id) ?? 1
      drawTreeOnCube(gridGraphics, cell.gx, cell.gy, entry.kind, leafColor, entry.tree.growth_stage, progress)
    }
  }

  drawWeatherOverlay()
  buildTileScreenMap()
}

// ═══════════════════════════════════════════
//  TILE SCREEN MAP (for rain-tile collision)
// ═══════════════════════════════════════════

function buildTileScreenMap(): void {
  if (!app) return
  const rows = computeRows(), cols = COLS.value
  const z = zoomLevel.value
  tileScreenDiamonds = []
  for (let gy = 0; gy < rows; gy++) {
    for (let gx = 0; gx < cols; gx++) {
      const kind = getTileKind(gx, gy, props.terrain, rows, cols)
      const { x: ix, y: iy } = gridToScreen(gx, gy, { tileWidth: TILE_W, tileHeight: TILE_H, offsetX: 0, offsetY: 0 })
      const h = getCubeHeight(kind, gx, gy)
      const cx = ix * z + camX
      const cy = iy * z + camY
      const hw = TILE_W / 2 * z
      const hh = TILE_H / 2 * z
      const topY = cy - hh - h * z
      const botY = cy + hh - h * z
      tileScreenDiamonds.push({ cx, cy, top: topY, bot: botY, left: cx - hw, right: cx + hw, hw, hh })
    }
  }
}

// ═══════════════════════════════════════════
//  CAMERA + ZOOM (grid only)
// ═══════════════════════════════════════════

function centerCamera(): void {
  if (!app) return
  const rows = computeRows(), cols = COLS.value
  const center = gridToScreen(cols / 2 - 0.5, rows / 2 - 0.5, { tileWidth: TILE_W, tileHeight: TILE_H, offsetX: 0, offsetY: 0 })
  camX = app.screen.width / 2 - center.x * zoomLevel.value
  camY = app.screen.height * 0.38 - center.y * zoomLevel.value
}

function applyCamera(): void {
  if (!gridGraphics) return
  gridGraphics.x = camX
  gridGraphics.y = camY
  gridGraphics.scale.set(zoomLevel.value)
}

// ── Panning ──
function onPointerDown(e: PointerEvent) {
  if (!(e.target as HTMLElement)?.closest?.('canvas')) return
  isPanning = true
  panStart = { x: e.clientX - camX, y: e.clientY - camY }
}
function onPointerMove(e: PointerEvent) {
  if (!isPanning) return
  camX = e.clientX - panStart.x
  camY = e.clientY - panStart.y
  applyCamera()
}
function onPointerUp() { isPanning = false }

// ── Zoom (wheel) ──
function onWheel(e: WheelEvent) {
  if (!app || !gridGraphics || props.isBackground) return
  e.preventDefault()

  const rect = canvasRef.value?.getBoundingClientRect()
  if (!rect) return

  // Mouse position relative to canvas
  const mx = e.clientX - rect.left
  const my = e.clientY - rect.top

  // World position under mouse before zoom
  const wx = (mx - camX) / zoomLevel.value
  const wy = (my - camY) / zoomLevel.value

  // Apply zoom delta
  const factor = e.deltaY > 0 ? 0.92 : 1.08
  const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomLevel.value * factor))
  zoomLevel.value = newZoom

  // Adjust camera to keep world point under mouse
  camX = mx - wx * newZoom
  camY = my - wy * newZoom
  applyCamera()
}

// ═══════════════════════════════════════════
//  FULL RENDER + LIFECYCLE
// ═══════════════════════════════════════════

function fullRender(forceAnimate = false): void {
  if (!app) return
  const rows = computeRows(), cols = COLS.value

  const tileKinds: TileKind[][] = []
  for (let gy = 0; gy < rows; gy++) {
    tileKinds[gy] = []
    for (let gx = 0; gx < cols; gx++)
      tileKinds[gy][gx] = getTileKind(gx, gy, props.terrain, rows, cols)
  }

  const existingIds = new Set(treePlacements.value.keys())
  const currentIds = new Set(props.trees.map(t => t.id))
  const hasNewTrees = props.trees.some(t => !existingIds.has(t.id))
  const hasRemovedTrees = [...existingIds].some(id => !currentIds.has(id))

  if (hasNewTrees || hasRemovedTrees || treePlacements.value.size === 0 || forceAnimate)
    treePlacements.value = assignTreePositions(props.trees, tileKinds, rows, cols)

  if (forceAnimate) { startGrowthAnimation(props.trees.map(t => t.id)); return }

  const treesToAnimate = props.trees.filter(t => (treeAnimProgress.value.get(t.id) ?? 1) < 1)

  if (treesToAnimate.length === 0 && props.trees.length > 0 && !isAnimating) {
    if (!props.trees.some(t => treeAnimProgress.value.has(t.id))) {
      startGrowthAnimation(props.trees.map(t => t.id)); return
    }
  }

  if (treesToAnimate.length > 0 && !isAnimating) {
    startGrowthAnimation(treesToAnimate.map(t => t.id)); return
  }

  renderScene()
  applyCamera()

  if (props.weather === 'rainy' || props.weather === 'thunderstorm' || props.weather === 'cloudy' || props.weather === 'sunny')
    startWeatherTicker()
  else
    stopWeatherTicker()
}

onMounted(() => {
  if (!canvasRef.value || !containerRef.value) return
  terrainSeed.value = Math.random() * 1000

  const w = containerRef.value.clientWidth || 700
  const h = Math.max(480, containerRef.value.clientHeight || 480)

  app = new PIXI.Application({
    view: canvasRef.value, width: w, height: h,
    backgroundColor: 0x000000, backgroundAlpha: 0,
    antialias: true,
    resolution: window.devicePixelRatio || 1, autoDensity: true,
  })

  gridGraphics = new PIXI.Graphics()
  weatherGraphics = new PIXI.Graphics()
  app.stage.addChild(gridGraphics)
  app.stage.addChild(weatherGraphics)

  if (props.weather === 'rainy' || props.weather === 'thunderstorm') {
    initRaindrops()
    if (props.weather === 'thunderstorm') lightningTimer = 1 + Math.random() * 3
  }
  if (props.weather === 'sunny') initSparkles()

  heightNoiseCache.clear()
  centerCamera()
  fullRender()

  const onResize = () => {
    if (!app || !containerRef.value) return
    const nw = containerRef.value.clientWidth || 700
    const nh = Math.max(480, containerRef.value.clientHeight || 480)
    app.renderer.resize(nw, nh)
    if (props.weather === 'rainy' || props.weather === 'thunderstorm') initRaindrops()
    if (props.weather === 'sunny') initSparkles()
    centerCamera()
    renderScene()
    applyCamera()
  }
  window.addEventListener('resize', onResize)

  onUnmounted(() => {
    window.removeEventListener('resize', onResize)
    stopWeatherTicker()
    if (app) app.ticker.remove(onAnimationTick)
    app?.destroy(true, { children: true })
    app = null; gridGraphics = null; weatherGraphics = null
    heightNoiseCache.clear()
  })
})

// ── Watchers ──

watch(() => props.forceRefresh, () => {
  if (!app) return
  heightNoiseCache.clear()
  treeAnimProgress.value = new Map()
  centerCamera()
  fullRender(true)
})

let prevWeather: WeatherType | null = null
watch(() => [props.trees, props.terrain, props.weather], () => {
  if (!app) return
  const weatherChanged = props.weather !== prevWeather
  prevWeather = props.weather

  // Only restart weather effects when weather actually changed
  if (weatherChanged) {
    stopWeatherTicker()
    if (props.weather === 'rainy' || props.weather === 'thunderstorm') {
      initRaindrops()
      lightningTimer = props.weather === 'thunderstorm' ? 1 + Math.random() * 3 : 0
      lightningAlpha = 0
    }
    if (props.weather === 'sunny') initSparkles()
  }
  heightNoiseCache.clear()

  const rows = computeRows(), cols = COLS.value
  const tileKinds: TileKind[][] = []
  for (let gy = 0; gy < rows; gy++) {
    tileKinds[gy] = []
    for (let gx = 0; gx < cols; gx++)
      tileKinds[gy][gx] = getTileKind(gx, gy, props.terrain, rows, cols)
  }
  treePlacements.value = assignTreePositions(props.trees, tileKinds, rows, cols)

  centerCamera()
  fullRender()
}, { deep: true })
</script>

<style scoped>
.iso-container {
  width: 100%;
  min-height: 480px;
  border-radius: 16px;
  overflow: hidden;
  background: linear-gradient(180deg, #d4dce8 0%, #c8d4e0 40%, #bcc8d4 100%);
  cursor: grab;
  touch-action: none;
}
[data-theme="dark"] .iso-container {
  background: linear-gradient(180deg, #1e2428 0%, #1a2018 40%, #161c14 100%);
}
.iso-container.is-bg {
  border-radius: 0;
  min-height: 100%;
  background: transparent;
  cursor: default;
}
.iso-container:not(.is-bg):active { cursor: grabbing; }
.iso-canvas { width: 100%; height: 100%; display: block; }
</style>
