/** Audio engine store — manages Web Audio API state.
 *
 *  All settings are persisted to localStorage so user preferences
 *  survive page reloads and browser sessions.
 */

import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const STORAGE_KEY = 'dlt_audio_settings'

interface PersistedAudio {
  masterVolume?: number
  isMuted?: boolean
  bgmEnabled?: boolean
  ambianceEnabled?: boolean
  terrainEnabled?: boolean
  weatherEnabled?: boolean
  currentBgmTrack?: string | null
}

function loadFromStorage(): PersistedAudio {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export const useAudioStore = defineStore('audio', () => {
  // ── Load persisted ──
  const saved = loadFromStorage()

  const masterVolume = ref(saved.masterVolume ?? 80)            // 0-100
  const isMuted = ref(saved.isMuted ?? false)
  const bgmEnabled = ref(saved.bgmEnabled ?? true)
  const ambianceEnabled = ref(saved.ambianceEnabled ?? true)
  const terrainEnabled = ref(saved.terrainEnabled ?? true)
  const weatherEnabled = ref(saved.weatherEnabled ?? true)
  const currentBgmTrack = ref<string | null>(saved.currentBgmTrack ?? null)
  const activeAmbianceLayers = ref<string[]>([])

  // ── Persist on any change ──

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      masterVolume: masterVolume.value,
      isMuted: isMuted.value,
      bgmEnabled: bgmEnabled.value,
      ambianceEnabled: ambianceEnabled.value,
      terrainEnabled: terrainEnabled.value,
      weatherEnabled: weatherEnabled.value,
      currentBgmTrack: currentBgmTrack.value,
    }))
  }

  watch(
    [masterVolume, isMuted, bgmEnabled, ambianceEnabled, terrainEnabled, weatherEnabled, currentBgmTrack],
    () => persist(),
  )

  // Computed effective volume (0-1 for Web Audio API)
  function effectiveVolume(): number {
    if (isMuted.value) return 0
    return masterVolume.value / 100
  }

  function setMasterVolume(vol: number) {
    masterVolume.value = Math.max(0, Math.min(100, vol))
  }

  function toggleMute() {
    isMuted.value = !isMuted.value
  }

  function setAmbianceLayers(layers: string[]) {
    activeAmbianceLayers.value = layers
  }

  // ── Ambiance toggle (main) — cascades to subs ──

  function toggleAmbiance() {
    ambianceEnabled.value = !ambianceEnabled.value
    if (!ambianceEnabled.value) {
      // Turning main OFF → turn both subs OFF
      terrainEnabled.value = false
      weatherEnabled.value = false
    } else {
      // Turning main ON → turn both subs ON
      terrainEnabled.value = true
      weatherEnabled.value = true
    }
  }

  // ── Sub toggles — automatically sync main ──

  function toggleTerrain() {
    terrainEnabled.value = !terrainEnabled.value
    syncMainFromSubs()
  }

  function toggleWeather() {
    weatherEnabled.value = !weatherEnabled.value
    syncMainFromSubs()
  }

  /** If both subs are OFF → main OFF. If either is ON → main ON. */
  function syncMainFromSubs() {
    if (!terrainEnabled.value && !weatherEnabled.value) {
      ambianceEnabled.value = false
    } else {
      ambianceEnabled.value = true
    }
  }

  return {
    masterVolume, isMuted, bgmEnabled, ambianceEnabled,
    terrainEnabled, weatherEnabled,
    currentBgmTrack, activeAmbianceLayers,
    effectiveVolume, setMasterVolume, toggleMute, setAmbianceLayers,
    toggleAmbiance, toggleTerrain, toggleWeather,
  }
})
