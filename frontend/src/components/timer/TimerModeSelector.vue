<template>
  <div class="mode-selector">
    <button
      v-for="opt in modeOptions"
      :key="opt.value"
      class="mode-btn"
      :class="{ active: store.mode === opt.value }"
      :disabled="store.isRunning"
      @click="store.setMode(opt.value)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { useTimerStore } from '../../stores/timer'
import type { TimerMode } from '../../types/timer'

const store = useTimerStore()

const modeOptions: { value: TimerMode; label: string }[] = [
  { value: 'countdown', label: '倒计时' },
  { value: 'countup', label: '正计时' },
  { value: 'free', label: '自由专注' },
]
</script>

<style scoped>
.mode-selector {
  display: flex;
  gap: 4px;
  background: var(--color-bg-secondary);
  border-radius: 20px;
  padding: 3px;
}

.mode-btn {
  padding: 6px 16px;
  border: none;
  border-radius: 18px;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.mode-btn.active {
  background: var(--color-primary);
  color: white;
  font-weight: 600;
}

.mode-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
