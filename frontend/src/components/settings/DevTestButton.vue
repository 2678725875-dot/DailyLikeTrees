<template>
  <button class="dev-btn" @click="quickPlant" :disabled="planting" title="开发者测试：快速种树">
    {{ planting ? '🌱...' : '🧪 测试种树' }}
  </button>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { completeSession } from '../../services/api'
import { useTimerStore } from '../../stores/timer'
import { useForestStore } from '../../stores/forest'

const store = useTimerStore()
const forestStore = useForestStore()
const planting = ref(false)

const SPECIES = ['oak', 'pine', 'cherry', 'bonsai']
const DURATIONS = [10, 20, 35, 65]  // minutes → different growth stages

async function quickPlant() {
  planting.value = true
  try {
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

    // Refresh forest if we're on that page
    forestStore.fetchTrees()
    // Also store reference for celebration
    store.currentSessionId = Date.now()
    store.elapsedSeconds = durationMin * 60
  } catch (err) {
    console.error('Quick plant failed:', err)
  } finally {
    planting.value = false
  }
}
</script>

<style scoped>
.dev-btn {
  position: fixed;
  bottom: 20px;
  left: 20px;
  z-index: 300;
  padding: 8px 16px;
  border: 1px dashed var(--color-border);
  border-radius: 16px;
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  font-size: 12px;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.dev-btn:hover {
  opacity: 1;
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.dev-btn:disabled {
  opacity: 0.4;
  cursor: wait;
}
</style>
