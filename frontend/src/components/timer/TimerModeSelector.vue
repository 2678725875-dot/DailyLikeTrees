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
  gap: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.mode-btn {
  padding: 6px 14px;
  border: none;
  border-right: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: var(--fw-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.mode-btn:last-child {
  border-right: none;
}

.mode-btn.active {
  background: var(--color-primary);
  color: white;
}

.mode-btn:hover:not(.active):not(:disabled) {
  background: var(--color-hover-bg);
}

.mode-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
