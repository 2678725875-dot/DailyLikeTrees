/** Global ambiance controller — persistent audio state watchers.
 *
 *  Each view previously had its own watchers for ambianceEnabled,
 *  terrainEnabled, weatherEnabled, etc.  Those watchers died when
 *  the view unmounted during route transitions — so toggling a
 *  button mid-transition had no effect.
 *
 *  This composable is used ONCE in App.vue (which never unmounts)
 *  so the watchers stay alive for the entire session.
 */

import { watch, onMounted } from 'vue'
import { useForestStore } from '../stores/forest'
import { useAudioStore } from '../stores/audio'
import { useAudioEngine } from './useAudioEngine'
import type { TerrainType, WeatherType } from '../types/forest'

const TERRAIN_KEYS = new Set(['plain', 'creek', 'mountain'])
const WEATHER_KEYS = new Set(['sunny', 'cloudy', 'rain', 'thunder'])

export function useAmbianceController() {
  const forestStore = useForestStore()
  const audioStore = useAudioStore()
  const engine = useAudioEngine()

  function getAmbianceKeys(terrain: TerrainType, weather: WeatherType): string[] {
    const keys: string[] = []
    if (terrain === 'plain') keys.push('plain')
    else if (terrain === 'creek') keys.push('creek')
    else if (terrain === 'mountain') keys.push('mountain')
    if (weather === 'sunny') keys.push('sunny')
    else if (weather === 'cloudy') keys.push('cloudy')
    else if (weather === 'rainy') keys.push('rain')
    else if (weather === 'thunderstorm') keys.push('thunder')
    return keys
  }

  async function updateAmbiance() {
    if (!audioStore.ambianceEnabled) {
      engine.stopAllAmbiance()
      return
    }
    const allKeys = getAmbianceKeys(forestStore.terrain, forestStore.weather)
    const keys = allKeys.filter(k => {
      if (TERRAIN_KEYS.has(k)) return audioStore.terrainEnabled
      if (WEATHER_KEYS.has(k)) return audioStore.weatherEnabled
      return false
    })
    await engine.playAmbiance(keys)
  }

  // ── Persistent watchers (never unmount — App.vue is always alive) ──

  watch(() => audioStore.ambianceEnabled, () => updateAmbiance())
  watch(() => audioStore.terrainEnabled, () => updateAmbiance())
  watch(() => audioStore.weatherEnabled, () => updateAmbiance())
  watch(() => forestStore.terrain, () => updateAmbiance())
  watch(() => forestStore.weather, () => updateAmbiance())

  // BGM
  watch(() => audioStore.currentBgmTrack, async (track) => {
    if (track) await engine.playBgm(track)
    else engine.stopBgm()
  })

  // Volume
  watch(() => audioStore.masterVolume, (vol) => {
    engine.setMasterVolume(audioStore.isMuted ? 0 : vol)
  })
  watch(() => audioStore.isMuted, (muted) => {
    engine.setMasterVolume(muted ? 0 : audioStore.masterVolume)
  })

  // ── Init on first user gesture ──
  onMounted(async () => {
    await engine.init()
    engine.setMasterVolume(audioStore.masterVolume)
    if (audioStore.ambianceEnabled) await updateAmbiance()
    if (audioStore.currentBgmTrack) await engine.playBgm(audioStore.currentBgmTrack)
  })

  return { updateAmbiance }
}
