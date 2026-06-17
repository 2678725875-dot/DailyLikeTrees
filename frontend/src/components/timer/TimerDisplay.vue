<template>
  <div class="timer-display" :class="statusClass">
    <div class="mode-label">{{ modeLabel }}</div>
    <span class="time-text">{{ store.formattedTime }}</span>
    <div v-if="store.mode === 'free' && store.isIdle" class="free-hint">
      专注 30 秒以上即可种树
    </div>
    <div v-else-if="store.mode === 'free' && store.isRunning && store.elapsedSeconds < 30" class="free-hint running">
      再坚持 {{ 30 - store.elapsedSeconds }} 秒即可种树
    </div>
    <div v-else-if="store.mode !== 'free' && (store.isIdle || store.isCompleted)" class="target-hint">
      {{ targetLabel }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTimerStore } from '../../stores/timer'

const store = useTimerStore()

const modeLabel = computed(() => {
  const labels: Record<string, string> = {
    countdown: '倒计时', countup: '正计时', free: '自由专注',
  }
  return labels[store.mode] || ''
})

const targetLabel = computed(() => {
  const mins = Math.floor(store.targetSeconds / 60)
  const secs = store.targetSeconds % 60
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60)
    const rm = mins % 60
    return rm > 0 ? `目标 ${hrs} 小时 ${rm} 分钟` : `目标 ${hrs} 小时`
  }
  if (secs > 0) return `目标 ${mins} 分 ${secs} 秒`
  return `目标 ${mins} 分钟`
})

const statusClass = computed(() => ({
  running: store.isRunning,
  paused: store.isPaused,
}))
</script>

<style scoped>
.timer-display {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.mode-label {
  font-size: 11px;
  color: var(--color-text-secondary);
  letter-spacing: 1px;
}

.time-text {
  font-size: 38px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: 2px;
  color: var(--color-text);
  line-height: 1.1;
}

.running .time-text { color: var(--color-primary); }

.paused .time-text {
  opacity: 0.55;
  animation: blink 1.2s ease-in-out infinite;
}

@keyframes blink {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 1; }
}

.free-hint {
  font-size: 11px;
  color: var(--color-text-secondary);
  opacity: 0.7;
  margin-top: 2px;
}

.free-hint.running {
  color: var(--color-primary);
  opacity: 0.8;
}

.target-hint {
  font-size: 11px;
  color: var(--color-text-secondary);
  opacity: 0.6;
  margin-top: 2px;
}
</style>
