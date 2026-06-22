<template>
  <div class="home-view">
    <BackgroundForest ref="bgRef" />
    <!-- Global weather effects from background forest -->
    <div v-if="bgWeather" class="global-weather" :class="`gw-${bgWeather}`">
      <!-- Rain -->
      <template v-if="bgWeather === 'rainy' || bgWeather === 'thunderstorm'">
        <div class="gw-rain-container">
          <div v-for="i in (bgWeather === 'thunderstorm' ? 102 : 51)" :key="'r'+i" class="gw-raindrop" :style="gwRainStyle(i)" />
        </div>
        <div v-if="bgWeather === 'thunderstorm'" class="gw-lightning-flash" :class="lightningClass" />
      </template>
      <!-- Sunny glow -->
      <div v-if="bgWeather === 'sunny'" class="gw-sunny-glow"><div></div></div>
      <!-- Cloudy veil -->
      <div v-if="bgWeather === 'cloudy'" class="gw-cloudy-veil">
        <div v-for="i in 5" :key="'c'+i" class="gw-cloud-blob" :style="gwCloudStyle(i)" />
      </div>
    </div>

    <!-- Status bar -->
    <div class="status-bar">
      <span class="status-label">
        <IconSvg name="timer" :size="12" /> FOCUS MODE
      </span>
      <span class="status-divider">·</span>
      <span class="status-value">{{ modeLabel }}</span>
      <span class="status-divider">·</span>
      <span class="status-value">{{ statsFilterLabel }} 已种 {{ forestStore.stats.count }} 棵</span>
    </div>

    <CircularTimer />

    <TodoBoard />
    <SettingsPanel />
    <DevToolsPanel v-if="settings.devMode" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useForestStore } from '../stores/forest'
import { useTimerStore } from '../stores/timer'
import type { WeatherType, TimeFilter } from '../types/forest'
import { TIME_FILTER_LABELS } from '../types/forest'
import * as api from '../services/api'
import CircularTimer from '../components/timer/CircularTimer.vue'
import TodoBoard from '../components/board/TodoBoard.vue'
import SettingsPanel from '../components/settings/SettingsPanel.vue'
import BackgroundForest from '../components/forest/BackgroundForest.vue'
import DevToolsPanel from '../components/settings/DevToolsPanel.vue'
import IconSvg from '../components/icons/IconSvg.vue'
import { useSettingsStore } from '../stores/settings'

const settings = useSettingsStore()

// ── Default background on first launch ──
// Must run during setup (before template mount) so BackgroundForest
// sees the saved filter when its onMounted fires.
const validFilters: TimeFilter[] = ['today', 'week', 'month', 'total']
const savedFilter = localStorage.getItem('bgForest') as TimeFilter | null
if (!savedFilter || !validFilters.includes(savedFilter)) {
  localStorage.setItem('bgForest', 'today')
}

const forestStore = useForestStore()
const timerStore = useTimerStore()

const modeLabel = computed(() => {
  const labels: Record<string, string> = { countdown: '倒计时', countup: '正计时', free: '自由专注' }
  return labels[timerStore.mode] || '专注'
})

const activeStatsFilter = ref<TimeFilter>('today')
const statsFilterLabel = computed(() => TIME_FILTER_LABELS[activeStatsFilter.value])

const lightningClass = computed(() => ({
  flash: gwLightning.value,
}))

const bgWeather = ref<WeatherType | null>(null)
const gwLightning = ref(false)
let lightningTimer: ReturnType<typeof setTimeout> | null = null

// ── Weather style generators ──
function gwRainStyle(i: number): Record<string, string> {
  const s = (i * 137.5 + 251.3) % 1000
  const isThunder = bgWeather.value === 'thunderstorm'
  return {
    left: `${(s * 1.7) % 108 - 4}%`,
    animationDuration: `${(isThunder ? 0.35 : 0.5) + (s % 100) / 220}s`,
    animationDelay: `-${(s * 3.3) % 200 / 100}s`,
    opacity: `${0.15 + (s % 100) / 350}`,
    height: `${(isThunder ? 16 : 10) + (s % 100) / 5}px`,
  }
}

function gwCloudStyle(i: number): Record<string, string> {
  const s = (i * 251.3 + 137.5) % 1000
  return {
    left: `${(s * 1.7) % 100}%`,
    top: `${5 + (s % 100) / 3}%`,
    width: `${80 + (s % 100) / 2.5}px`,
    height: `${22 + (s % 100) / 5}px`,
    animationDuration: `${32 + (s % 100) / 4}s`,
    animationDelay: `-${(s * 4.3) % 100}s`,
  }
}

function startGlobalLightning() {
  stopGlobalLightning()
  function doFlash() {
    if (!bgWeather.value) return
    // First bright flash
    gwLightning.value = true
    setTimeout(() => {
      gwLightning.value = false
      // Second weaker flash (realistic double-strike)
      if (Math.random() < 0.6) {
        setTimeout(() => {
          gwLightning.value = true
          setTimeout(() => { gwLightning.value = false }, 40 + Math.random() * 80)
        }, 80 + Math.random() * 120)
      }
    }, 50 + Math.random() * 100)
    // Schedule next strike
    lightningTimer = setTimeout(doFlash, 2000 + Math.random() * 6000) as unknown as number
  }
  lightningTimer = setTimeout(doFlash, 1000 + Math.random() * 3000) as unknown as number
}

function stopGlobalLightning() {
  if (lightningTimer) { clearTimeout(lightningTimer); lightningTimer = null }
  gwLightning.value = false
}

function applyWeather(w: WeatherType | null) {
  if (!w) {
    bgWeather.value = null
    stopGlobalLightning()
    return
  }
  bgWeather.value = w
  if (w === 'thunderstorm') startGlobalLightning()
  else stopGlobalLightning()
}

function syncWeatherFromStore() {
  const hasBg = !!localStorage.getItem('bgForest')
  if (!hasBg) {
    applyWeather(null)
    return
  }
  applyWeather(forestStore.weather)
}

// ── Watchers ──

// Watch forest store weather for real-time visual weather effects (shared with BackgroundForest)
watch(() => forestStore.weather, () => {
  const hasBg = !!localStorage.getItem('bgForest')
  if (hasBg) applyWeather(forestStore.weather)
})

// ── Listen for background updates from ForestViewPage ──
function onBgForestUpdate() {
  const filter = localStorage.getItem('bgForest') as TimeFilter | null
  if (filter && validFilters.includes(filter)) {
    activeStatsFilter.value = filter
    api.getTrees(filter).then(({ data }) => {
      forestStore.stats = data.stats
    }).catch(() => {})
  }
}
window.addEventListener('bg-forest-update', onBgForestUpdate)

onMounted(async () => {
  window.addEventListener('bg-weather-update', onBgWeatherUpdate)

  // Use the filter that was saved during setup (guaranteed non-null)
  const filter = (localStorage.getItem('bgForest') || 'today') as TimeFilter
  if (validFilters.includes(filter)) activeStatsFilter.value = filter

  // BackgroundForest.loadBgTrees() sets forestStore.stats once it resolves.
  // As a safety net (e.g. slow backend), retry fetching stats ourselves if
  // they are still zero after a short wait.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { data } = await api.getTrees(filter)
      if (data.stats.count > 0 || attempt >= 2) {
        forestStore.stats = data.stats
        break
      }
    } catch { /* keep trying */ }
    if (attempt < 2) await new Promise(r => setTimeout(r, 1000))
  }

  syncWeatherFromStore()
})

function onBgWeatherUpdate(e: Event) {
  const detail = (e as CustomEvent).detail as { weather: WeatherType; active: boolean }
  if (!detail.active) { applyWeather(null); return }
  applyWeather(detail.weather)
}

onUnmounted(() => {
  window.removeEventListener('bg-weather-update', onBgWeatherUpdate)
  window.removeEventListener('bg-forest-update', onBgForestUpdate)
  stopGlobalLightning()
})
</script>

<style scoped>
.home-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 48px;
  width: 100%;
  max-width: 480px;
  padding-top: 32px;
  padding-bottom: 48px;
  position: relative;
  z-index: 1;
}

/* ── Status Bar ── */
.status-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: var(--fw-medium);
  letter-spacing: 0.12em;
  color: var(--color-text-secondary);
  text-transform: uppercase;
}

.status-label {
  display: flex;
  align-items: center;
  gap: 4px;
}

.status-divider {
  color: var(--color-text-tertiary);
}

/* ── Global weather overlay (above main content) ── */
.global-weather {
  position: fixed;
  inset: 0;
  z-index: 10;
  pointer-events: none;
}

/* ══ RAIN ══ */
.gw-rain-container {
  position: absolute;
  inset: 0;
  overflow: hidden;
}
.gw-raindrop {
  position: absolute;
  top: -30px;
  width: 1px;
  background: linear-gradient(180deg, transparent 0%, rgba(120,160,220,0.0) 20%, rgba(100,150,210,0.45) 60%, rgba(80,130,200,0.7) 100%);
  border-radius: 0 0 1px 1px;
  animation: gw-rain-fall linear infinite;
}
[data-theme="dark"] .gw-raindrop {
  background: linear-gradient(180deg, transparent 0%, rgba(140,180,230,0.0) 20%, rgba(130,170,220,0.40) 60%, rgba(110,160,210,0.65) 100%);
}
@keyframes gw-rain-fall {
  0% { transform: translateY(-30px) translateX(0); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(105vh) translateX(-15px); opacity: 0.3; }
}

/* ══ LIGHTNING ══ */
.gw-lightning-flash {
  position: absolute;
  inset: 0;
  background: rgba(255,240,200,0);
  transition: background 0.02s ease-out;
}
.gw-lightning-flash.flash {
  background: rgba(255,240,200,0.25);
  transition: background 0.01s ease-in;
}
.gw-lightning-flash.flash-fade {
  background: rgba(255,240,200,0.08);
  transition: background 0.15s ease-out;
}
[data-theme="dark"] .gw-lightning-flash.flash {
  background: rgba(200,210,230,0.15);
}
[data-theme="dark"] .gw-lightning-flash.flash-fade {
  background: rgba(200,210,230,0.04);
}

/* ══ SUNNY ══ */
.gw-sunny-glow {
  position: absolute;
  inset: 0;
  overflow: hidden;
  animation: gw-sunny-breathe 7s ease-in-out infinite;
}
/* Ambient radial glow */
.gw-sunny-glow::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 55% 45% at 80% 10%, rgba(255,242,185,0.176) 0%, rgba(255,225,150,0.056) 45%, transparent 72%);
}
/* Primary directional beam */
.gw-sunny-glow::after {
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
/* Secondary softer beam overlay */
.gw-sunny-glow > div {
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
[data-theme="dark"] .gw-sunny-glow::before {
  background:
    radial-gradient(ellipse 55% 45% at 80% 10%, rgba(255,242,185,0.088) 0%, rgba(255,225,150,0.028) 45%, transparent 72%);
}
[data-theme="dark"] .gw-sunny-glow::after {
  background:
    linear-gradient(225deg,
      rgba(255,248,215,0.072) 0%,
      rgba(255,238,185,0.040) 18%,
      rgba(255,228,165,0.016) 38%,
      transparent 60%
    );
}
[data-theme="dark"] .gw-sunny-glow > div {
  background:
    linear-gradient(230deg,
      rgba(255,245,200,0.040) 0%,
      rgba(255,235,180,0.016) 25%,
      transparent 50%
    );
}
@keyframes gw-sunny-breathe {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.78; }
}

/* ══ CLOUDY ══ */
.gw-cloudy-veil {
  position: absolute;
  inset: 0;
  overflow: hidden;
}
.gw-cloud-blob {
  position: absolute;
  border-radius: 50%;
  animation: gw-cloud-drift linear infinite;
}
/* Multi-layer cloud: each blob is a cluster of 3 overlapping ellipses via box-shadow */
.gw-cloud-blob::before,
.gw-cloud-blob::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  background: inherit;
}
.gw-cloud-blob::before {
  width: 70%;
  height: 120%;
  top: -40%;
  left: 15%;
}
.gw-cloud-blob::after {
  width: 55%;
  height: 90%;
  top: -25%;
  right: 10%;
}

.gw-cloud-blob {
  background: rgba(200,205,220,0.15);
}
[data-theme="dark"] .gw-cloud-blob {
  background: rgba(180,185,200,0.10);
}

@keyframes gw-cloud-drift {
  0% { transform: translateX(0); }
  100% { transform: translateX(100vw); }
}
</style>
