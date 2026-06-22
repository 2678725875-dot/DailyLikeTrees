/** App settings store — persisted to localStorage + backend. */

import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { Theme } from '../types/settings'
import * as api from '../services/api'

export const useSettingsStore = defineStore('settings', () => {
  const theme = ref<Theme>('light')
  const devMode = ref(false)
  const weatherEnabled = ref(true)
  const floatingBallEnabled = ref(false)
  const initialized = ref(false)

  function applyTheme(t: Theme) {
    document.documentElement.setAttribute('data-theme', t)
  }

  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  function setWeatherEnabled(val: boolean) {
    weatherEnabled.value = val
  }

  function toggleWeatherEnabled() {
    weatherEnabled.value = !weatherEnabled.value
  }

  function setFloatingBallEnabled(val: boolean) {
    floatingBallEnabled.value = val
  }

  function toggleFloatingBallEnabled() {
    floatingBallEnabled.value = !floatingBallEnabled.value
  }

  function enableDevMode() {
    devMode.value = true
    api.updateSettings({ dev_mode: true }).catch(() => {})
  }

  function loadLocal() {
    const savedTheme = localStorage.getItem('theme') as Theme | null
    if (savedTheme === 'light' || savedTheme === 'dark') {
      theme.value = savedTheme
    }
    const savedWeather = localStorage.getItem('weatherEnabled')
    if (savedWeather !== null) weatherEnabled.value = savedWeather === 'true'
    const savedBall = localStorage.getItem('floatingBallEnabled')
    if (savedBall !== null) floatingBallEnabled.value = savedBall === 'true'
    applyTheme(theme.value)
  }

  async function loadSettings() {
    loadLocal()
    try {
      const { data } = await api.getSettings()
      if (data.theme) {
        theme.value = data.theme
        applyTheme(data.theme)
      }
      devMode.value = data.dev_mode === true || data.dev_mode === 'true'
      if (data.weather_enabled !== undefined) weatherEnabled.value = data.weather_enabled === true || data.weather_enabled === 'true'
      if (data.floating_ball_enabled !== undefined) floatingBallEnabled.value = data.floating_ball_enabled === true || data.floating_ball_enabled === 'true'
    } catch (err) {
      console.warn('Failed to load settings from backend, using localStorage:', err)
    }
    initialized.value = true
  }

  // Persist theme changes
  watch(theme, (t) => {
    localStorage.setItem('theme', t)
    applyTheme(t)
    api.updateSettings({ theme: t }).catch(() => {})
  })

  watch(weatherEnabled, (val) => {
    localStorage.setItem('weatherEnabled', String(val))
    api.updateSettings({ weather_enabled: val }).catch(() => {})
  })

  watch(floatingBallEnabled, (val) => {
    localStorage.setItem('floatingBallEnabled', String(val))
    api.updateSettings({ floating_ball_enabled: val }).catch(() => {})
  })

  return {
    theme, devMode, weatherEnabled, floatingBallEnabled, initialized,
    toggleTheme, enableDevMode, loadSettings,
    setWeatherEnabled, toggleWeatherEnabled,
    setFloatingBallEnabled, toggleFloatingBallEnabled,
  }
})
