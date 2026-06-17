<template>
  <div class="forest-page">
    <!-- Toast notification -->
    <Transition name="toast">
      <div v-if="toastMsg" class="toast">{{ toastMsg }}</div>
    </Transition>

    <div class="forest-header">
      <h2>🌳 我的专注森林</h2>
      <p class="forest-stats" v-if="!store.loading">
        已种下 <strong>{{ store.stats.count }}</strong> 棵树，
        累计专注 <strong>{{ store.stats.total_minutes }}</strong> 分钟
      </p>
    </div>

    <!-- Time filter tabs -->
    <div class="filter-tabs">
      <button
        v-for="(label, key) in TIME_FILTER_LABELS"
        :key="key"
        class="filter-btn"
        :class="{ active: store.timeFilter === key }"
        @click="onFilterClick(key)"
      >
        {{ label }}
      </button>
      <button
        v-if="store.trees.length > 0"
        class="filter-btn bg-set-btn"
        :class="{ 'bg-active': bgFilter === store.timeFilter }"
        @click="setAsBackground"
        :title="bgFilter === store.timeFilter ? '已设为此森林为背景' : '将此森林设为主页背景'"
      >
        {{ bgFilter === store.timeFilter ? '✅ 已设背景' : '🖼 设为背景' }}
      </button>
    </div>

    <!-- Isometric forest canvas -->
    <div class="forest-canvas-wrapper">
      <IsometricGrid
        :trees="store.trees"
        :terrain="store.terrain"
        :weather="store.weather"
        :force-refresh="store.forceRefresh"
      />
      <div v-if="store.loading" class="loading-overlay">加载中...</div>
      <div v-else-if="store.trees.length === 0" class="empty-overlay">
        <svg width="80" height="80" viewBox="0 0 48 48" opacity="0.25">
          <rect x="22" y="28" width="4" height="14" rx="1" fill="#999" />
          <circle cx="24" cy="18" r="14" fill="#999" opacity="0.6" />
        </svg>
        <p>这个时间范围内还没有种下树木</p>
        <p class="sub-hint">开始一次专注，种下你的第一棵树吧！</p>
      </div>
    </div>

    <!-- Terrain & weather selectors -->
    <div class="config-row">
      <div class="config-group">
        <label>🏞 地形</label>
        <div class="chip-row">
          <button
            v-for="(label, t) in TERRAIN_LABELS"
            :key="t"
            class="chip"
            :class="{ active: store.terrain === t }"
            @click="onTerrainChange(t)"
          >
            {{ label }}
          </button>
        </div>
      </div>
      <div class="config-group">
        <label>🌤 天气</label>
        <div class="chip-row">
          <button
            v-for="(label, w) in WEATHER_LABELS"
            :key="w"
            class="chip"
            :class="{ active: store.weather === w }"
            @click="onWeatherChange(w)"
          >
            {{ label }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useForestStore } from '../stores/forest'
import { useAudioStore } from '../stores/audio'
import { useAudioEngine } from '../composables/useAudioEngine'
import { TIME_FILTER_LABELS, TERRAIN_LABELS, WEATHER_LABELS } from '../types/forest'
import type { TerrainType, WeatherType, TimeFilter } from '../types/forest'
import IsometricGrid from '../components/forest/IsometricGrid.vue'

const store = useForestStore()
const audioStore = useAudioStore()
const engine = useAudioEngine()

// Background feedback state
const bgFilter = ref<string | null>(localStorage.getItem('bgForest'))
const toastMsg = ref('')
let toastTimer: ReturnType<typeof setTimeout> | null = null

function showToast(msg: string) {
  toastMsg.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastMsg.value = '' }, 2000)
}

// Update bgFilter when changed elsewhere
window.addEventListener('bg-forest-update', () => {
  bgFilter.value = localStorage.getItem('bgForest')
})

// ── Terrain + Weather → Ambiance mapping ──

function getAmbianceKeys(terrain: TerrainType, weather: WeatherType): string[] {
  const keys: string[] = []
  // Terrain sounds
  if (terrain === 'creek') keys.push('creek')
  if (terrain === 'mountain') keys.push('wind')
  // Weather sounds
  if (weather === 'rainy') keys.push('rain')
  if (weather === 'thunderstorm') keys.push('thunder')
  // Default forest ambient when nothing else
  if (keys.length === 0) keys.push('forest')
  return keys
}

async function updateAmbiance() {
  if (!audioStore.ambianceEnabled) {
    engine.stopAllAmbiance()
    return
  }
  const keys = getAmbianceKeys(store.terrain, store.weather)
  await engine.playAmbiance(keys)
}

function onTerrainChange(t: TerrainType) {
  store.setTerrain(t)
  updateAmbiance()
}

function onWeatherChange(w: WeatherType) {
  store.setWeather(w)
  updateAmbiance()
}

function onFilterClick(key: TimeFilter) {
  if (store.timeFilter === key) {
    store.refreshAnimation()
  } else {
    store.setTimeFilter(key)
  }
}

// ── BGM watcher ──

watch(() => audioStore.currentBgmTrack, async (track) => {
  if (track) {
    await engine.playBgm(track)
  } else {
    engine.stopBgm()
  }
})

// ── Volume watcher ──

watch(() => audioStore.masterVolume, (vol) => {
  engine.setMasterVolume(audioStore.isMuted ? 0 : vol)
})

watch(() => audioStore.isMuted, (muted) => {
  engine.setMasterVolume(muted ? 0 : audioStore.masterVolume)
})

// ── Lifecycle ──

onMounted(async () => {
  store.fetchTrees()
  // Init audio engine on first user interaction
  await engine.init()
  engine.setMasterVolume(audioStore.masterVolume)
  // Start with default ambiance
  if (audioStore.ambianceEnabled) {
    await updateAmbiance()
  }
})

function setAsBackground() {
  localStorage.setItem('bgForest', store.timeFilter)
  bgFilter.value = store.timeFilter
  showToast(`已将「${TIME_FILTER_LABELS[store.timeFilter]}」森林设为主页背景`)
  window.dispatchEvent(new CustomEvent('bg-forest-update'))
}

onUnmounted(() => {
  engine.dispose()
})
</script>

<style scoped>
.forest-page {
  width: 100%;
  max-width: 780px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.forest-header {
  text-align: center;
}

.forest-header h2 {
  margin: 0;
  font-size: 22px;
  color: var(--color-text);
}

.forest-stats {
  margin: 4px 0 0;
  font-size: 14px;
  color: var(--color-text-secondary);
}

.filter-tabs {
  display: flex;
  gap: 6px;
  justify-content: center;
}

.filter-btn {
  padding: 6px 18px;
  border: 1.5px solid var(--color-border);
  border-radius: 16px;
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.bg-set-btn {
  border-style: dashed;
  font-size: 12px;
}

.bg-set-btn.bg-active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
  border-style: solid;
}

/* Toast */
.toast {
  position: fixed;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  background: var(--color-primary);
  color: white;
  padding: 10px 24px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  pointer-events: none;
}

.toast-enter-active {
  transition: all 0.3s ease-out;
}
.toast-leave-active {
  transition: all 0.25s ease-in;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(-12px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-8px);
}

.forest-canvas-wrapper {
  position: relative;
  min-height: 320px;
  border-radius: 16px;
  overflow: hidden;
  background: var(--color-bg-secondary);
  border: 1.5px solid var(--color-border);
}

.loading-overlay,
.empty-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  font-size: 14px;
  gap: 8px;
}

.sub-hint {
  font-size: 12px;
  opacity: 0.65;
  margin-top: 2px;
}

.config-row {
  display: flex;
  gap: 28px;
  justify-content: center;
  flex-wrap: wrap;
}

.config-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
}

.config-group label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.chip-row {
  display: flex;
  gap: 5px;
}

.chip {
  padding: 6px 14px;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: var(--color-bg-secondary);
  color: var(--color-text);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.chip.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}
</style>
