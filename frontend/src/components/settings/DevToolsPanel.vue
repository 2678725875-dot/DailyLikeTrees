<!-- Floating developer tools panel — visible only when devMode is enabled.
     Positioned bottom-left, contains batch plant + clear trees tools. -->
<template>
  <div class="dev-tools-panel" :class="{ collapsed: isCollapsed }">
    <!-- Toggle header -->
    <button class="dev-header" @click="isCollapsed = !isCollapsed" title="开发者工具">
      <IconSvg name="sparkle" :size="14" />
      <span class="dev-title">开发者工具</span>
      <span class="collapse-arrow">{{ isCollapsed ? '▲' : '▼' }}</span>
    </button>

    <!-- Tool body -->
    <div v-if="!isCollapsed" class="dev-body">
      <!-- ── Batch plant ── -->
      <div class="tool-section">
        <label class="tool-label">批量种树</label>
        <div class="tool-row">
          <input
            type="number"
            class="qty-input"
            v-model.number="plantCount"
            min="1"
            max="1000"
            @keydown.enter="batchPlant"
          />
          <span class="unit">棵</span>
          <button class="tool-btn plant-btn" @click="batchPlant" :disabled="planting">
            <IconSvg name="tree" :size="12" />
            {{ planting ? `种植中 ${plantProgress}...` : '种植' }}
          </button>
        </div>
      </div>

      <!-- ── Clear trees ── -->
      <div class="tool-section">
        <label class="tool-label">清空树木</label>
        <div class="tool-row">
          <select class="filter-select" v-model="clearFilter">
            <option value="today">今日</option>
            <option value="week">本周</option>
            <option value="total">总计</option>
          </select>
          <button
            class="tool-btn clear-btn"
            @click="confirmClear"
            :disabled="clearing"
          >
            <IconSvg name="trash" :size="12" />
            {{ clearing ? '清空中...' : '清空' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Clear confirmation mini-dialog -->
    <Teleport to="body">
      <div v-if="showClearConfirm" class="dev-confirm-overlay" @click.self="showClearConfirm = false">
        <div class="dev-confirm-dialog">
          <p>
            确定要<strong>清空「{{ clearFilterLabel }}」</strong>的所有树木吗？
          </p>
          <p class="dev-confirm-warn">此操作不可撤销。</p>
          <div class="dev-confirm-actions">
            <button class="confirm-btn cancel" @click="showClearConfirm = false">取消</button>
            <button class="confirm-btn proceed" @click="doClear">确定清空</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { completeSession, deleteTrees } from '../../services/api'
import { useForestStore } from '../../stores/forest'
import IconSvg from '../icons/IconSvg.vue'

const forestStore = useForestStore()

// ── Panel state ──
const isCollapsed = ref(false)

// ── Batch plant ──
const plantCount = ref(1)
const planting = ref(false)
const plantProgress = ref('')

const SPECIES = Array.from({ length: 37 }, (_, i) => `tree${i + 1}`)
const DURATIONS = [10, 20, 35, 65]  // minutes → different growth stages

async function batchPlant() {
  const count = Math.max(1, Math.min(1000, plantCount.value))
  planting.value = true

  try {
    for (let i = 0; i < count; i++) {
      const speciesId = SPECIES[Math.floor(Math.random() * SPECIES.length)]
      const durationMin = DURATIONS[Math.floor(Math.random() * DURATIONS.length)]
      const now = new Date()
      const startedAt = new Date(now.getTime() - durationMin * 60 * 1000).toISOString()

      await completeSession({
        timer_mode: 'countdown',
        target_seconds: durationMin * 60,
        actual_seconds: durationMin * 60,
        species_id: speciesId,
        started_at: startedAt,
        ended_at: now.toISOString(),
      })

      plantProgress.value = `${i + 1}/${count}`
    }

    forestStore.fetchTrees()
  } catch (err) {
    console.error('Batch plant failed:', err)
  } finally {
    planting.value = false
    plantProgress.value = ''
  }
}

// ── Clear trees ──
const clearFilter = ref<'today' | 'week' | 'total'>('today')
const clearing = ref(false)
const showClearConfirm = ref(false)

const clearFilterLabel = computed(() => {
  const map: Record<string, string> = { today: '今日', week: '本周', total: '总计' }
  return map[clearFilter.value] || clearFilter.value
})

function confirmClear() {
  showClearConfirm.value = true
}

async function doClear() {
  showClearConfirm.value = false
  clearing.value = true
  try {
    await deleteTrees(clearFilter.value)
    forestStore.fetchTrees()
  } catch (err) {
    console.error('Clear trees failed:', err)
  } finally {
    clearing.value = false
  }
}
</script>

<style scoped>
.dev-tools-panel {
  position: fixed;
  bottom: 20px;
  left: 20px;
  z-index: 300;
  width: 240px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  font-size: 12px;
  overflow: hidden;
  transition: box-shadow var(--transition-fast);
}

.dev-tools-panel:hover {
  box-shadow: var(--shadow-lg);
}

/* ── Header ── */
.dev-header {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  border: none;
  background: var(--color-bg-secondary);
  color: var(--color-text);
  font-size: 12px;
  font-weight: var(--fw-medium);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.dev-header:hover {
  background: var(--color-hover-bg);
}

.dev-title {
  flex: 1;
  text-align: left;
}

.collapse-arrow {
  font-size: 10px;
  color: var(--color-text-tertiary);
}

/* ── Body ── */
.dev-body {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.tool-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tool-label {
  font-size: 11px;
  font-weight: var(--fw-medium);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.tool-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* ── Quantity input ── */
.qty-input {
  width: 64px;
  padding: 6px 8px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg-secondary);
  color: var(--color-text);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  text-align: center;
  outline: none;
  transition: border-color var(--transition-fast);
}

.qty-input:focus {
  border-color: var(--color-primary);
}

.qty-input::-webkit-inner-spin-button,
.qty-input::-webkit-outer-spin-button {
  opacity: 1;
}

.unit {
  color: var(--color-text-tertiary);
  font-size: 12px;
}

/* ── Filter select ── */
.filter-select {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg-secondary);
  color: var(--color-text);
  font-size: 12px;
  outline: none;
  cursor: pointer;
}

.filter-select:focus {
  border-color: var(--color-primary);
}

/* ── Tool buttons ── */
.tool-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg-secondary);
  color: var(--color-text);
  font-size: 12px;
  font-weight: var(--fw-medium);
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--transition-fast);
}

.plant-btn:hover:not(:disabled) {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.clear-btn:hover:not(:disabled) {
  background: var(--color-danger, #e05555);
  color: white;
  border-color: var(--color-danger, #e05555);
}

.tool-btn:disabled {
  opacity: 0.5;
  cursor: wait;
}

/* ── Clear confirmation dialog ── */
.dev-confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dev-confirm-dialog {
  width: 320px;
  max-width: 90vw;
  background: var(--color-bg);
  border-radius: var(--radius-md);
  padding: 22px 20px 16px;
  box-shadow: var(--shadow-lg);
  text-align: center;
  animation: confirm-pop 0.2s ease-out;
}

@keyframes confirm-pop {
  from { transform: scale(0.92); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.dev-confirm-dialog p {
  margin: 0 0 6px;
  font-size: 13px;
  color: var(--color-text);
  line-height: 1.5;
}

.dev-confirm-warn {
  font-size: 12px !important;
  color: var(--color-danger, #e05555) !important;
  margin-bottom: 14px !important;
}

.dev-confirm-actions {
  display: flex;
  gap: 8px;
}

.confirm-btn {
  flex: 1;
  padding: 8px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: var(--fw-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.confirm-btn.cancel {
  background: var(--color-bg-secondary);
  color: var(--color-text);
}

.confirm-btn.proceed {
  background: var(--color-danger, #e05555);
  color: white;
  border-color: var(--color-danger, #e05555);
}
</style>
