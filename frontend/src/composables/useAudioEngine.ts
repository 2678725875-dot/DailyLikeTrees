/** Web Audio API engine — layered ambiance mixing + BGM.
 *
 *  Singleton — all components share the same AudioContext & layers.
 *
 *  Usage:
 *    const engine = useAudioEngine()
 *    await engine.init()
 *    engine.playAmbiance(['creek', 'rain'])
 *    engine.setMasterVolume(0.8)
 */

import { ref, readonly } from 'vue'
import { ASSET_PATHS } from '../utils/assetPaths'

interface AudioLayer {
  source: AudioBufferSourceNode | null
  gain: GainNode
  buffer: AudioBuffer | null
  path: string
}

// ── Module-level singleton state ──
let ctx: AudioContext | null = null
const masterGain = ref<GainNode | null>(null)
const initialized = ref(false)
const activeLayers = new Map<string, AudioLayer>()
const audioBuffers = new Map<string, AudioBuffer>()

let bgmSource: AudioBufferSourceNode | null = null
let bgmGain: GainNode | null = null

export function useAudioEngine() {
  // ── Initialization (must be called from a user gesture) ──

  async function init(): Promise<void> {
    if (initialized.value) return
    try {
      ctx = new AudioContext()
      const gain = ctx.createGain()
      gain.gain.value = 0.8
      gain.connect(ctx.destination)
      masterGain.value = gain
      initialized.value = true
    } catch (err) {
      console.warn('Web Audio API not available:', err)
    }
  }

  // ── Buffer loading ──

  async function loadBuffer(url: string): Promise<AudioBuffer | null> {
    if (!ctx) return null
    if (audioBuffers.has(url)) return audioBuffers.get(url)!

    try {
      const response = await fetch(url)
      if (!response.ok) {
        console.warn(`Audio file not found: ${url}`)
        return null
      }
      const arrayBuffer = await response.arrayBuffer()
      const buffer = await ctx.decodeAudioData(arrayBuffer)
      audioBuffers.set(url, buffer)
      return buffer
    } catch {
      return null
    }
  }

  // ── Ambiance layers ──

  function stopAllAmbiance(): void {
    for (const [key, layer] of activeLayers) {
      try { layer.source?.stop() } catch { /* already stopped */ }
      activeLayers.delete(key)
    }
  }

  async function playAmbiance(keys: string[]): Promise<void> {
    if (!ctx || !masterGain.value) return

    // Stop layers no longer needed
    for (const [key, layer] of activeLayers) {
      if (!keys.includes(key)) {
        try { layer.source?.stop() } catch { /* ok */ }
        activeLayers.delete(key)
      }
    }

    // Start new layers
    for (const key of keys) {
      if (activeLayers.has(key)) continue

      const path = (ASSET_PATHS.audio.ambiance as Record<string, string>)[key]
      if (!path) continue

      const buffer = await loadBuffer(path)
      if (!buffer) continue

      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.loop = true

      const gain = ctx.createGain()
      gain.gain.value = 0.5
      gain.connect(masterGain.value!)

      source.connect(gain)
      source.start()

      activeLayers.set(key, { source, gain, buffer, path })
    }
  }

  function setLayerVolume(key: string, vol: number): void {
    const layer = activeLayers.get(key)
    if (layer) layer.gain.gain.value = Math.max(0, Math.min(1, vol))
  }

  // ── BGM ──

  async function playBgm(trackKey: string): Promise<void> {
    if (!ctx || !masterGain.value) return
    stopBgm()

    const path = (ASSET_PATHS.audio.music as Record<string, string>)[trackKey]
    if (!path) return

    const buffer = await loadBuffer(path)
    if (!buffer) return

    bgmSource = ctx.createBufferSource()
    bgmSource.buffer = buffer
    bgmSource.loop = true

    bgmGain = ctx.createGain()
    bgmGain.gain.value = 0.4
    bgmGain.connect(masterGain.value)

    bgmSource.connect(bgmGain)
    bgmSource.start()
  }

  function stopBgm(): void {
    try { bgmSource?.stop() } catch { /* ok */ }
    bgmSource = null
    bgmGain = null
  }

  // ── Master volume ──

  function setMasterVolume(percent: number): void {
    if (masterGain.value) {
      masterGain.value.gain.value = Math.max(0, Math.min(1, percent / 100))
    }
  }

  function mute(): void {
    if (masterGain.value) masterGain.value.gain.value = 0
  }

  function unmute(percent: number = 80): void {
    if (masterGain.value) masterGain.value.gain.value = percent / 100
  }

  // ── Cleanup ──

  function dispose(): void {
    stopAllAmbiance()
    stopBgm()
    ctx?.close()
    ctx = null
    masterGain.value = null
    initialized.value = false
    audioBuffers.clear()
  }

  return {
    initialized: readonly(initialized),
    init,
    playAmbiance,
    stopAllAmbiance,
    setLayerVolume,
    playBgm,
    stopBgm,
    setMasterVolume,
    mute,
    unmute,
    dispose,
  }
}
