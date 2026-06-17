<template>
  <div class="home-view">
    <BackgroundForest ref="bgRef" />
    <!-- Global weather effects from background forest -->
    <div v-if="bgWeather" class="global-weather" :class="`gw-${bgWeather}`">
      <!-- Rain -->
      <template v-if="bgWeather === 'rainy' || bgWeather === 'thunderstorm'">
        <div class="gw-rain-container">
          <div v-for="i in (bgWeather === 'thunderstorm' ? 100 : 50)" :key="'r'+i" class="gw-raindrop" :style="gwRainStyle(i)" />
        </div>
        <div v-if="bgWeather === 'thunderstorm'" class="gw-lightning-flash" :class="{ flash: gwLightning }" />
      </template>
      <!-- Sunny glow -->
      <div v-if="bgWeather === 'sunny'" class="gw-sunny-glow" />
      <!-- Cloudy veil -->
      <div v-if="bgWeather === 'cloudy'" class="gw-cloudy-veil">
        <div v-for="i in 5" :key="'c'+i" class="gw-cloud-blob" :style="gwCloudStyle(i)" />
      </div>
    </div>
    <CircularTimer />
    <TodoBoard />
    <SettingsPanel />
    <DevTestButton />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useForestStore } from '../stores/forest'
import { useAudioStore } from '../stores/audio'
import { useAudioEngine } from '../composables/useAudioEngine'
import type { WeatherType, TerrainType } from '../types/forest'
import CircularTimer from '../components/timer/CircularTimer.vue'
import TodoBoard from '../components/board/TodoBoard.vue'
import SettingsPanel from '../components/settings/SettingsPanel.vue'
import BackgroundForest from '../components/forest/BackgroundForest.vue'
import DevTestButton from '../components/settings/DevTestButton.vue'

const forestStore = useForestStore()
const audioStore = useAudioStore()
const engine = useAudioEngine()

const bgWeather = ref<WeatherType | null>(null)
const gwLightning = ref(false)
let lightningTimer: ReturnType<typeof setInterval> | null = null

// ── Weather style generators ──
function gwRainStyle(i: number): Record<string, string> {
  const s = (i * 137.5 + 251.3) % 1000
  return {
    left: `${(s * 1.7) % 105 - 2.5}%`,
    animationDuration: `${0.45 + (s % 100) / 180}s`,
    animationDelay: `-${(s * 3.3) % 200 / 100}s`,
    opacity: `${0.08 + (s % 100) / 500}`,
    height: `${12 + (s % 100) / 6}px`,
  }
}

function gwCloudStyle(i: number): Record<string, string> {
  const s = (i * 251.3 + 137.5) % 1000
  return {
    left: `${(s * 1.3) % 110 - 5}%`,
    top: `${5 + (s % 100) / 3}%`,
    width: `${80 + (s % 100) / 2.5}px`,
    height: `${22 + (s % 100) / 5}px`,
    animationDuration: `${20 + (s % 100) / 4}s`,
    animationDelay: `-${(s * 2.7) % 200 / 10}s`,
  }
}

function startGlobalLightning() {
  stopGlobalLightning()
  lightningTimer = setInterval(() => {
    gwLightning.value = true
    setTimeout(() => { gwLightning.value = false }, 70 + Math.random() * 130)
  }, 1800 + Math.random() * 4500)
}

function stopGlobalLightning() {
  if (lightningTimer) { clearInterval(lightningTimer); lightningTimer = null }
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

// ── Ambiance mapping (same logic as ForestViewPage) ──

function getAmbianceKeys(terrain: TerrainType, weather: WeatherType): string[] {
  const keys: string[] = []
  if (terrain === 'creek') keys.push('creek')
  if (terrain === 'mountain') keys.push('wind')
  if (weather === 'rainy') keys.push('rain')
  if (weather === 'thunderstorm') keys.push('thunder')
  if (keys.length === 0) keys.push('forest')
  return keys
}

async function updateAmbiance() {
  if (!audioStore.ambianceEnabled) {
    engine.stopAllAmbiance()
    return
  }
  const keys = getAmbianceKeys(forestStore.terrain, forestStore.weather)
  await engine.playAmbiance(keys)
}

// ── Watchers ──

// Watch forest store weather for real-time changes (shared with BackgroundForest)
watch(() => forestStore.weather, () => {
  const hasBg = !!localStorage.getItem('bgForest')
  if (hasBg) applyWeather(forestStore.weather)
  updateAmbiance()
})

watch(() => audioStore.currentBgmTrack, async (track) => {
  if (track) {
    await engine.playBgm(track)
  } else {
    engine.stopBgm()
  }
})

watch(() => audioStore.masterVolume, (vol) => {
  engine.setMasterVolume(audioStore.isMuted ? 0 : vol)
})

watch(() => audioStore.isMuted, (muted) => {
  engine.setMasterVolume(muted ? 0 : audioStore.masterVolume)
})

watch(() => audioStore.ambianceEnabled, () => {
  updateAmbiance()
})

// Watch forest store weather for real-time changes (shared with BackgroundForest)
watch(() => forestStore.weather, () => {
  const hasBg = !!localStorage.getItem('bgForest')
  if (hasBg) applyWeather(forestStore.weather)
})

onMounted(async () => {
  window.addEventListener('bg-weather-update', onBgWeatherUpdate)
  syncWeatherFromStore()
  // Init audio engine
  await engine.init()
  engine.setMasterVolume(audioStore.masterVolume)
  if (audioStore.ambianceEnabled) {
    await updateAmbiance()
  }
  // Resume BGM if one was already selected
  if (audioStore.currentBgmTrack) {
    await engine.playBgm(audioStore.currentBgmTrack)
  }
})

function onBgWeatherUpdate(e: Event) {
  const detail = (e as CustomEvent).detail as { weather: WeatherType; active: boolean }
  if (!detail.active) { applyWeather(null); return }
  applyWeather(detail.weather)
}

onUnmounted(() => {
  window.removeEventListener('bg-weather-update', onBgWeatherUpdate)
  stopGlobalLightning()
})
</script>

<style scoped>
.home-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40px;
  width: 100%;
  max-width: 560px;
  padding-top: 20px;
  padding-bottom: 40px;
  position: relative;
  z-index: 1;
}

/* ── Global weather overlay (above main content) ── */
.global-weather {
  position: fixed;
  inset: 0;
  z-index: 10;
  pointer-events: none;
}

/* Rain — blue in light mode, light blue in dark mode */
.gw-rain-container {
  position: absolute;
  inset: 0;
  overflow: hidden;
}
.gw-raindrop {
  position: absolute;
  top: -25px;
  width: 1.2px;
  background: linear-gradient(180deg, transparent 0%, rgba(90,140,210,0.50) 30%, rgba(60,120,200,0.65) 100%);
  border-radius: 0 0 1.5px 1.5px;
  animation: gw-rain-fall linear infinite;
}
[data-theme="dark"] .gw-raindrop {
  background: linear-gradient(180deg, transparent 0%, rgba(160,200,240,0.45) 30%, rgba(140,190,240,0.6) 100%);
}

/* Lightning — yellow flash in light mode, dimmer in dark mode */
.gw-lightning-flash {
  position: absolute;
  inset: 0;
  background: rgba(255,232,128,0);
  transition: background 0.05s ease-out;
}
.gw-lightning-flash.flash {
  background: rgba(255,232,128,0.20);
  transition: background 0.03s ease-in;
}
[data-theme="dark"] .gw-lightning-flash.flash {
  background: rgba(200,200,200,0.10);
}

/* Sunny */
.gw-sunny-glow {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255,232,180,0.10) 0%, rgba(255,220,150,0.03) 45%, transparent 75%);
}

/* Cloudy */
.gw-cloudy-veil {
  position: absolute;
  inset: 0;
  overflow: hidden;
}
.gw-cloud-blob {
  position: absolute;
  background: rgba(190,198,215,0.13);
  border-radius: 50%;
  animation: gw-cloud-drift linear infinite;
}
[data-theme="dark"] .gw-cloud-blob {
  background: rgba(180,185,200,0.10);
}
@keyframes gw-cloud-drift {
  0% { transform: translateX(-100px); }
  100% { transform: translateX(calc(100vw + 100px)); }
}
@keyframes gw-rain-fall {
  0% { transform: translateY(-25px) translateX(0); }
  100% { transform: translateY(105vh) translateX(-10px); }
}
</style>
