<template>
  <div class="bg-forest" v-if="bgFilter">
    <!-- Terrain + trees (low opacity) -->
    <IsometricGrid
      :trees="trees"
      :terrain="terrain"
      :weather="weather"
      :is-background="true"
    />
    <!-- Weather effects at full visibility -->
    <div class="bg-weather-overlay" :class="`weather-${weather}`">
      <!-- Rain -->
      <template v-if="weather === 'rainy' || weather === 'thunderstorm'">
        <div class="rain-container">
          <div v-for="i in (weather === 'thunderstorm' ? 120 : 60)" :key="i" class="raindrop" :style="rainStyle(i)" />
        </div>
        <div v-if="weather === 'thunderstorm'" class="lightning-flash" :class="{ flash: lightningOn }" />
      </template>
      <!-- Sunny glow -->
      <div v-if="weather === 'sunny'" class="sunny-glow" />
      <!-- Cloudy veil -->
      <div v-if="weather === 'cloudy'" class="cloudy-veil">
        <div v-for="i in 6" :key="i" class="cloud-blob" :style="cloudStyle(i)" />
      </div>
    </div>
    <!-- Contrast veil between background and UI -->
    <div class="bg-contrast-veil" />
    <!-- Label -->
    <div class="bg-forest-label">
      {{ bgLabel }}
      <button class="bg-close" @click="clearBg" title="取消背景">×</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useForestStore } from '../../stores/forest'
import { TIME_FILTER_LABELS } from '../../types/forest'
import type { TimeFilter, TerrainType, WeatherType } from '../../types/forest'
import * as api from '../../services/api'
import type { PlantedTree } from '../../types/tree'
import IsometricGrid from './IsometricGrid.vue'

const store = useForestStore()

const trees = ref<PlantedTree[]>([])
const bgFilter = ref<TimeFilter | null>(null)
const terrain = ref<TerrainType>('plain')
const weather = ref<WeatherType>('sunny')
const lightningOn = ref(false)
let lightningTimer: ReturnType<typeof setInterval> | null = null

const bgLabel = computed(() => {
  if (!bgFilter.value) return ''
  return `背景：${TIME_FILTER_LABELS[bgFilter.value]}`
})

// Rain style generator – randomized per drop, stable via seed
const rainStyles = ref<string[]>([])
function rainStyle(i: number): Record<string, string> {
  // Pseudo-random from index
  const s = (i * 137.5 + 251.3) % 1000
  return {
    left: `${(s * 1.7) % 105 - 2.5}%`,
    animationDuration: `${0.4 + (s % 100) / 200}s`,
    animationDelay: `-${(s * 3.3) % 200 / 100}s`,
    opacity: `${0.12 + (s % 100) / 400}`,
    height: `${14 + (s % 100) / 5}px`,
  }
}

function cloudStyle(i: number): Record<string, string> {
  const s = (i * 251.3 + 137.5) % 1000
  return {
    left: `${(s * 1.3) % 110 - 5}%`,
    top: `${5 + (s % 100) / 2.5}%`,
    width: `${100 + (s % 100) / 2}px`,
    height: `${24 + (s % 100) / 4}px`,
    animationDuration: `${18 + (s % 100) / 5}s`,
    animationDelay: `-${(s * 2.7) % 200 / 10}s`,
  }
}

function startLightning() {
  if (weather.value !== 'thunderstorm') return
  lightningTimer = setInterval(() => {
    lightningOn.value = true
    setTimeout(() => { lightningOn.value = false }, 80 + Math.random() * 150)
  }, 2000 + Math.random() * 5000)
}

function stopLightning() {
  if (lightningTimer) { clearInterval(lightningTimer); lightningTimer = null }
  lightningOn.value = false
}

function setBg(filter: TimeFilter) {
  bgFilter.value = filter
  localStorage.setItem('bgForest', filter)
  loadBgTrees()
  emitWeather()
}

function clearBg() {
  bgFilter.value = null
  localStorage.removeItem('bgForest')
  trees.value = []
  stopLightning()
  emitWeather()
}

async function loadBgTrees() {
  if (!bgFilter.value) return
  try {
    const { data } = await api.getTrees(bgFilter.value)
    trees.value = data.trees
    terrain.value = store.terrain
    weather.value = store.weather
    // Restart lightning if thunderstorm
    stopLightning()
    if (weather.value === 'thunderstorm') startLightning()
    emitWeather()
  } catch { trees.value = [] }
}

watch(() => [store.terrain, store.weather], () => {
  terrain.value = store.terrain
  weather.value = store.weather
  stopLightning()
  if (store.weather === 'thunderstorm') startLightning()
  loadBgTrees()
  emitWeather()
})

function emitWeather() {
  window.dispatchEvent(new CustomEvent('bg-weather-update', {
    detail: { weather: weather.value, terrain: terrain.value, active: !!bgFilter.value }
  }))
}

function onBgForestUpdate() {
  const saved = localStorage.getItem('bgForest') as TimeFilter | null
  if (saved && ['today', 'week', 'month', 'total'].includes(saved)) setBg(saved)
  else clearBg()
}

window.addEventListener('bg-forest-update', onBgForestUpdate)
window.addEventListener('storage', (e) => { if (e.key === 'bgForest') onBgForestUpdate() })

onMounted(() => {
  const saved = localStorage.getItem('bgForest') as TimeFilter | null
  if (saved && ['today', 'week', 'month', 'total'].includes(saved)) setBg(saved)
})

onUnmounted(() => {
  window.removeEventListener('bg-forest-update', onBgForestUpdate)
  stopLightning()
})

defineExpose({ setBg, clearBg })
</script>

<style scoped>
.bg-forest {
  position: fixed;
  inset: 0;
  z-index: 0;
  opacity: 0.22;
  pointer-events: none;
}

/* ── Weather overlay (full opacity, between bg and UI) ── */
.bg-weather-overlay {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

/* Rain */
.rain-container {
  position: absolute;
  inset: 0;
  overflow: hidden;
}
.raindrop {
  position: absolute;
  top: -30px;
  width: 1.5px;
  background: linear-gradient(180deg, transparent 0%, rgba(180,210,255,0.5) 30%, rgba(160,200,255,0.7) 100%);
  border-radius: 0 0 2px 2px;
  animation: rain-fall linear infinite;
}
@keyframes rain-fall {
  0% { transform: translateY(-30px) translateX(0); }
  100% { transform: translateY(105vh) translateX(-12px); }
}

/* Lightning */
.lightning-flash {
  position: absolute;
  inset: 0;
  background: rgba(255,255,255,0);
  transition: background 0.06s ease-out;
}
.lightning-flash.flash {
  background: rgba(255,255,255,0.18);
  transition: background 0.02s ease-in;
}

/* Sunny */
.sunny-glow {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255,232,180,0.12) 0%, rgba(255,220,150,0.04) 40%, transparent 70%);
}

/* Cloudy */
.cloudy-veil {
  position: absolute;
  inset: 0;
  overflow: hidden;
}
.cloud-blob {
  position: absolute;
  background: rgba(200,205,220,0.18);
  border-radius: 50%;
  animation: cloud-drift linear infinite;
}
@keyframes cloud-drift {
  0% { transform: translateX(-120px); }
  100% { transform: translateX(calc(100vw + 120px)); }
}

/* ── Contrast veil (between bg forest and main UI) ── */
.bg-contrast-veil {
  position: fixed;
  inset: 0;
  z-index: 0;
  background: rgba(255,255,255,0.55);
  pointer-events: none;
}
[data-theme="dark"] .bg-contrast-veil {
  background: rgba(0,0,0,0.50);
}

/* ── Label ── */
.bg-forest-label {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  padding: 5px 16px;
  border-radius: 14px;
  font-size: 12px;
  font-weight: 500;
  z-index: 5;
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 10px;
  opacity: 0.8;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  backdrop-filter: blur(6px);
  border: 1px solid var(--color-border);
}

.bg-close {
  border: none;
  background: none;
  color: var(--color-text-secondary);
  font-size: 17px;
  cursor: pointer;
  padding: 0 2px;
  line-height: 1;
  border-radius: 4px;
}
.bg-close:hover {
  color: var(--color-text);
  background: var(--color-bg-tertiary);
}
</style>
