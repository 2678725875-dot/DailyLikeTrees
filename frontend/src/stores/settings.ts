/** App settings store — persisted to localStorage + backend. */

import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { Theme } from '../types/settings'
import * as api from '../services/api'

export const useSettingsStore = defineStore('settings', () => {
  const theme = ref<Theme>('light')
  const initialized = ref(false)

  function applyTheme(t: Theme) {
    document.documentElement.setAttribute('data-theme', t)
  }

  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  async function loadSettings() {
    // Load from localStorage immediately
    const savedTheme = localStorage.getItem('theme') as Theme | null
    if (savedTheme === 'light' || savedTheme === 'dark') {
      theme.value = savedTheme
    }
    applyTheme(theme.value)

    // Sync with backend (non-blocking)
    try {
      const { data } = await api.getSettings()
      if (data.theme) {
        theme.value = data.theme
        applyTheme(data.theme)
      }
    } catch (err) {
      console.warn('Failed to load settings from backend, using localStorage:', err)
    }
    initialized.value = true
  }

  // Persist theme changes
  watch(theme, (t) => {
    localStorage.setItem('theme', t)
    applyTheme(t)
    // Sync to backend (fire-and-forget)
    api.updateSettings({ theme: t }).catch(() => {})
  })

  return { theme, initialized, toggleTheme, loadSettings }
})
