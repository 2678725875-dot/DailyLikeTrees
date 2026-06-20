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
          <div v-for="i in (weather === 'thunderstorm' ? 102 : 51)" :key="i" class="raindrop" :style="rainStyle(i)" />
        </div>
        <div v-if="weather === 'thunderstorm'" class="lightning-flash" :class="{ flash: lightningOn }" />
      </template>
      <!-- Sunny glow -->
      <div v-if="weather === 'sunny'" class="sunny-glow"><div></div></div>
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
      <button class="bg-close" @click="clearBg" title="取消背景">
        <IconSvg name="close" :size="12" />
      </button>
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
import IconSvg from '../icons/IconSvg.vue'

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
    left: `${(s * 1.7) % 100}%`,
    top: `${5 + (s % 100) / 2.5}%`,
    width: `${100 + (s % 100) / 2}px`,
    height: `${24 + (s % 100) / 4}px`,
    animationDuration: `${30 + (s % 100) / 3}s`,
    animationDelay: `-${(s * 4.3) % 100}s`,
  }
}

function startLightning() {
  if (weather.value !== 'thunderstorm') return
  function doFlash() {
    if (weather.value !== 'thunderstorm') return
    lightningOn.value = true
    setTimeout(() => {
      lightningOn.value = false
      if (Math.random() < 0.6) {
        setTimeout(() => {
          lightningOn.value = true
          setTimeout(() => { lightningOn.value = false }, 40 + Math.random() * 80)
        }, 80 + Math.random() * 120)
      }
    }, 50 + Math.random() * 100)
    lightningTimer = setTimeout(doFlash, 2000 + Math.random() * 6000) as unknown as number
  }
  lightningTimer = setTimeout(doFlash, 1000 + Math.random() * 3000) as unknown as number
}

function stopLightning() {
  if (lightningTimer) { clearTimeout(lightningTimer as unknown as number); lightningTimer = null }
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
  width: 1px;
  background: linear-gradient(180deg, transparent 0%, rgba(160,200,240,0.0) 20%, rgba(140,185,230,0.4) 60%, rgba(120,170,220,0.65) 100%);
  border-radius: 0 0 1px 1px;
  animation: rain-fall linear infinite;
}
@keyframes rain-fall {
  0% { transform: translateY(-30px) translateX(0); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(105vh) translateX(-15px); opacity: 0.3; }
}

/* Lightning */
.lightning-flash {
  position: absolute;
  inset: 0;
  background: rgba(255,240,200,0);
  transition: background 0.02s ease-out;
}
.lightning-flash.flash {
  background: rgba(255,240,200,0.22);
  transition: background 0.01s ease-in;
}

/* Sunny */
.sunny-glow {
  position: absolute;
  inset: 0;
  overflow: hidden;
}
.sunny-glow::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 55% 45% at 80% 10%, rgba(255,242,185,0.176) 0%, rgba(255,225,150,0.056) 45%, transparent 72%);
}
.sunny-glow::after {
  content: '';
  position: absolute;
  top: -30%;
  right: -15%;
  width: 180%;
  height: 180%;
  background:
    linear-gradient(225deg,
      rgba(255,248,215,0.128) 0%,
      rgba(255,238,185,0.080) 18%,
      rgba(255,228,165,0.032) 38%,
      rgba(255,220,150,0.012) 58%,
      transparent 78%
    );
  transform-origin: 85% 8%;
  pointer-events: none;
  filter: blur(2px);
}
.sunny-glow > div {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(230deg,
      rgba(255,245,200,0.064) 0%,
      rgba(255,235,180,0.024) 25%,
      transparent 55%
    );
  transform-origin: 85% 8%;
  pointer-events: none;
  filter: blur(6px);
}

/* Cloudy */
.cloudy-veil {
  position: absolute;
  inset: 0;
  overflow: hidden;
}
.cloud-blob {
  position: absolute;
  border-radius: 50%;
  animation: cloud-drift linear infinite;
}
.cloud-blob::before,
.cloud-blob::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  background: inherit;
}
.cloud-blob::before {
  width: 70%;
  height: 120%;
  top: -40%;
  left: 15%;
}
.cloud-blob::after {
  width: 55%;
  height: 90%;
  top: -25%;
  right: 10%;
}
.cloud-blob {
  background: rgba(200,205,220,0.18);
}
@keyframes cloud-drift {
  0% { transform: translateX(0); }
  100% { transform: translateX(100vw); }
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
  cursor: pointer;
  padding: 2px;
  line-height: 1;
  border-radius: var(--radius-xs);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}
.bg-close:hover {
  color: var(--color-text);
  background: var(--color-bg-tertiary);
}
</style>
