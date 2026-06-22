<template>
  <div class="weather-status">
    <div class="ws-block ws-time-block" title="当前时间">
      <span class="ws-clock">{{ info.currentTime.value }}</span>
      <span v-if="info.temperature.value !== null" class="ws-date">{{ dateLabel }}</span>
    </div>

    <div v-if="showWeather && info.temperature.value !== null" class="ws-block ws-weather-block" :title="weatherLabel">
      <span class="ws-icon">
        <Sun v-if="info.weatherType.value === 'sunny'" :size="16" />
        <Cloud v-else-if="info.weatherType.value === 'cloudy'" :size="16" />
        <CloudRain v-else-if="info.weatherType.value === 'rainy'" :size="16" />
        <CloudLightning v-else-if="info.weatherType.value === 'thunderstorm'" :size="16" />
        <Loader v-else :size="16" class="ws-loading" />
      </span>
      <span class="ws-temp">{{ info.temperature.value }}°C</span>
      <span class="ws-loc">{{ info.locationName.value }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Sun, Cloud, CloudRain, CloudLightning, Loader } from '@lucide/vue'
import { useWeatherInfo } from '../../composables/useWeatherInfo'

const props = withDefaults(defineProps<{ showWeather?: boolean }>(), { showWeather: true })

const info = useWeatherInfo()

const WEATHER_LABELS: Record<string, string> = {
  sunny: '晴', cloudy: '多云', rainy: '雨', thunderstorm: '雷雨',
}

const weatherLabel = computed(() => WEATHER_LABELS[info.weatherType.value] || '')

const dateLabel = computed(() => {
  const now = new Date()
  const m = now.getMonth() + 1
  const d = now.getDate()
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${m}/${d} ${days[now.getDay()]}`
})
</script>

<style scoped>
.weather-status {
  display: flex;
  align-items: center;
  gap: 8px;
  user-select: none;
  -webkit-user-select: none;
}

.ws-block {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 14px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  white-space: nowrap;
}

.ws-time-block {
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
  padding: 3px 12px;
  min-width: 64px;
}

.ws-clock {
  font-size: 14px;
  font-weight: var(--fw-semibold);
  font-variant-numeric: tabular-nums;
  color: var(--color-text);
  line-height: 1.2;
}

.ws-date {
  font-size: 10px;
  color: var(--color-text-secondary);
  line-height: 1.2;
}

.ws-weather-block {
  font-size: 12px;
  color: var(--color-text);
}

.ws-icon {
  display: flex;
  align-items: center;
  color: var(--color-primary);
}

.ws-temp {
  font-weight: var(--fw-medium);
  min-width: 30px;
}

.ws-loc {
  color: var(--color-text-secondary);
  font-size: 11px;
  max-width: 70px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ws-loading {
  animation: ws-spin 2s linear infinite;
}

@keyframes ws-spin {
  to { transform: rotate(360deg); }
}
</style>
