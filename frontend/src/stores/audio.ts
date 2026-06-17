/** Audio engine store — manages Web Audio API state. */

import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAudioStore = defineStore('audio', () => {
  const masterVolume = ref(80)            // 0-100
  const isMuted = ref(false)
  const bgmEnabled = ref(true)
  const ambianceEnabled = ref(true)
  const currentBgmTrack = ref<string | null>(null)
  const activeAmbianceLayers = ref<string[]>([])

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

  return {
    masterVolume, isMuted, bgmEnabled, ambianceEnabled,
    currentBgmTrack, activeAmbianceLayers,
    effectiveVolume, setMasterVolume, toggleMute, setAmbianceLayers,
  }
})
