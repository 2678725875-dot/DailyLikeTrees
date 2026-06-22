<!-- Mobile Forest View — full-width isometric forest with horizontal
     filter scroll and bottom-sheet terrain/weather controls. -->
<template>
  <div class="mobile-forest">
    <!-- Header -->
    <div class="mf-header">
      <h2><IconSvg name="tree" :size="20" /> 专注森林</h2>
      <p class="mf-stats" v-if="!store.loading">
        {{ store.stats.count }} 棵树 · {{ store.stats.total_minutes }} 分钟
      </p>
    </div>

    <!-- Filter tabs (horizontal scroll) -->
    <div class="mf-filters">
      <button
        v-for="(label, key) in TIME_FILTER_LABELS"
        :key="key"
        class="mf-filter-chip"
        :class="{ active: store.timeFilter === key }"
        @click="onFilterClick(key)"
      >
        {{ label }}
      </button>
    </div>

    <!-- Forest canvas -->
    <div class="mf-canvas-wrap">
      <IsometricGrid
        :trees="store.trees"
        :terrain="store.terrain"
        :weather="store.weather"
        :force-refresh="store.forceRefresh"
      />
      <div v-if="store.loading" class="mf-loading">加载中...</div>
      <div v-else-if="store.trees.length === 0" class="mf-empty">
        <IconSvg name="tree" :size="48" />
        <p>还没有种下树木</p>
        <p class="mf-empty-hint">开始一次专注，种下你的第一棵树吧！</p>
      </div>
    </div>

    <!-- Terrain & Weather chips -->
    <div class="mf-config">
      <div class="mf-config-row">
        <span class="mf-config-label">地形</span>
        <div class="mf-chip-scroll">
          <button
            v-for="(label, t) in TERRAIN_LABELS"
            :key="t"
            class="mf-chip"
            :class="{ active: store.terrain === t }"
            @click="onTerrainChange(t)"
          >{{ label }}</button>
        </div>
      </div>
      <div class="mf-config-row">
        <span class="mf-config-label">天气</span>
        <div class="mf-chip-scroll">
          <button
            v-for="(label, w) in WEATHER_LABELS"
            :key="w"
            class="mf-chip"
            :class="{ active: store.weather === w }"
            @click="onWeatherChange(w)"
          >{{ label }}</button>
        </div>
      </div>
      <!-- Set as background -->
      <button
        v-if="store.trees.length > 0"
        class="mf-bg-btn"
        :class="{ active: bgFilter === store.timeFilter }"
        @click="setAsBackground"
      >
        <IconSvg name="image" :size="14" />
        {{ bgFilter === store.timeFilter ? '已设背景' : '设为背景' }}
      </button>
    </div>

    <!-- Toast -->
    <Transition name="toast">
      <div v-if="toastMsg" class="mf-toast">{{ toastMsg }}</div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useForestStore } from '../../stores/forest'
import { TIME_FILTER_LABELS, TERRAIN_LABELS, WEATHER_LABELS } from '../../types/forest'
import type { TerrainType, WeatherType, TimeFilter } from '../../types/forest'
import IsometricGrid from '../../components/forest/IsometricGrid.vue'
import IconSvg from '../../components/icons/IconSvg.vue'

const store = useForestStore()

const bgFilter = ref<string | null>(localStorage.getItem('bgForest'))
const toastMsg = ref('')
let toastTimer: ReturnType<typeof setTimeout> | null = null

function showToast(msg: string) {
  toastMsg.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastMsg.value = '' }, 2000)
}

function onTerrainChange(t: TerrainType) { store.setTerrain(t) }
function onWeatherChange(w: WeatherType) { store.setWeather(w) }

function onFilterClick(key: TimeFilter) {
  if (store.timeFilter === key) { store.refreshAnimation() }
  else { store.setTimeFilter(key) }
}

function setAsBackground() {
  localStorage.setItem('bgForest', store.timeFilter)
  bgFilter.value = store.timeFilter
  showToast(`已将「${TIME_FILTER_LABELS[store.timeFilter]}」森林设为主页背景`)
  window.dispatchEvent(new CustomEvent('bg-forest-update'))
}

onMounted(() => {
  store.fetchTrees()
})
</script>

<style scoped>
.mobile-forest {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100%;
  padding: 0 8px 100px;
  gap: 12px;
}

.mf-header {
  text-align: center;
  padding: 8px 0 0;
}
.mf-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: var(--fw-medium);
  color: var(--color-text);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.mf-stats {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--color-text-secondary);
}

/* ── Filters ── */
.mf-filters {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding: 0 4px 4px;
  -webkit-overflow-scrolling: touch;
}
.mf-filters::-webkit-scrollbar { display: none; }
.mf-filter-chip {
  flex-shrink: 0;
  padding: 6px 14px;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: var(--fw-medium);
  cursor: pointer;
  white-space: nowrap;
}
.mf-filter-chip.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

/* ── Canvas ── */
.mf-canvas-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  max-height: 50vh;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
}
.mf-loading,
.mf-empty {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  font-size: 13px;
  gap: 6px;
  pointer-events: none;
}
.mf-empty-hint {
  font-size: 12px;
  opacity: 0.6;
}

/* ── Config ── */
.mf-config {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.mf-config-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.mf-config-label {
  font-size: 11px;
  font-weight: var(--fw-medium);
  color: var(--color-text-secondary);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  flex-shrink: 0;
  width: 36px;
}
.mf-chip-scroll {
  display: flex;
  gap: 5px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  flex: 1;
}
.mf-chip-scroll::-webkit-scrollbar { display: none; }
.mf-chip {
  flex-shrink: 0;
  padding: 5px 12px;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: var(--color-bg-secondary);
  color: var(--color-text);
  font-size: 12px;
  cursor: pointer;
}
.mf-chip.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}
.mf-bg-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  font-size: 12px;
  cursor: pointer;
  margin-top: 4px;
}
.mf-bg-btn.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

/* ── Toast ── */
.mf-toast {
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  background: var(--color-primary);
  color: white;
  padding: 8px 24px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: var(--fw-medium);
  box-shadow: var(--shadow-md);
  pointer-events: none;
}
.toast-enter-active { transition: all 0.3s ease; }
.toast-leave-active { transition: all 0.2s ease-in; }
.toast-enter-from,
.toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(10px); }
</style>
