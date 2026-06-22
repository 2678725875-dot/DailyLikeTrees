<template>
  <div class="audio-panel">
    <button class="audio-trigger" @click="open = !open" title="音乐与环境音">
      <IconSvg name="music" :size="18" />
    </button>

    <Teleport to="body">
      <div v-if="open" class="audio-dropdown-overlay" @click.self="open = false">
        <div class="audio-dropdown">
          <h3>声音设置</h3>

          <!-- Master volume -->
          <div class="audio-row">
            <span class="row-label">主音量</span>
            <div class="volume-row">
              <input
                type="range" min="0" max="100"
                :value="audio.masterVolume"
                @input="onVolumeChange"
                class="volume-slider"
              />
              <span class="vol-num">{{ audio.masterVolume }}</span>
            </div>
          </div>

          <!-- Mute -->
          <div class="audio-row">
            <span class="row-label">静音</span>
            <button
              class="mini-btn"
              :class="{ on: audio.isMuted }"
              @click="toggleMute"
            >
              <IconSvg :name="audio.isMuted ? 'volume-off' : 'volume-on'" :size="14" />
              {{ audio.isMuted ? '已静音' : '播放中' }}
            </button>
          </div>

          <!-- Ambiance -->
          <div class="audio-row">
            <span class="row-label">环境音</span>
            <button
              class="mini-btn"
              :class="{ on: audio.ambianceEnabled }"
              @click="toggleAmbiance"
            >
              {{ audio.ambianceEnabled ? '开启' : '关闭' }}
            </button>
          </div>
          <div class="audio-sub-row">
            <span class="sub-label">地形</span>
            <button
              class="mini-btn"
              :class="{ on: audio.terrainEnabled }"
              @click="audio.toggleTerrain()"
            >
              {{ audio.terrainEnabled ? '开启' : '关闭' }}
            </button>
          </div>
          <div class="audio-sub-row">
            <span class="sub-label">天气</span>
            <button
              class="mini-btn"
              :class="{ on: audio.weatherEnabled }"
              @click="audio.toggleWeather()"
            >
              {{ audio.weatherEnabled ? '开启' : '关闭' }}
            </button>
          </div>

          <!-- BGM selector -->
          <div class="audio-row">
            <span class="row-label">背景音乐</span>
          </div>
          <div class="bgm-grid">
            <button
              v-for="track in bgmTracks"
              :key="track.key"
              class="bgm-btn"
              :class="{ active: audio.currentBgmTrack === track.key }"
              @click="selectBgm(track.key)"
            >
              <IconSvg :name="track.icon" :size="14" />
              {{ track.label }}
            </button>
            <button
              v-if="audio.currentBgmTrack"
              class="bgm-btn stop"
              @click="stopBgm"
            >
              停止
            </button>
          </div>

          <button class="close-panel" @click="open = false">关闭</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAudioStore } from '../../stores/audio'
import IconSvg from '../icons/IconSvg.vue'

const audio = useAudioStore()
const open = ref(false)

const bgmTracks = [
  { key: 'calm1', label: '舒缓钢琴', icon: 'piano' },
  { key: 'calm2', label: '轻弦乐', icon: 'headphones' },
  { key: 'calm3', label: '自然白噪', icon: 'leaf' },
]

function onVolumeChange(e: Event) {
  const val = Number((e.target as HTMLInputElement).value)
  audio.setMasterVolume(val)
}

function toggleMute() {
  audio.toggleMute()
}

function toggleAmbiance() {
  audio.toggleAmbiance()
}

function selectBgm(key: string) {
  audio.currentBgmTrack = key
}

function stopBgm() {
  audio.currentBgmTrack = null
}
</script>

<style scoped>
.audio-panel {
  position: relative;
}

.audio-trigger {
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background var(--transition-fast);
}

.audio-trigger:hover {
  background: var(--color-hover-bg);
}

.audio-dropdown-overlay {
  position: fixed;
  inset: 0;
  z-index: 1001;
  background: rgba(0,0,0,0.2);
}

.audio-dropdown {
  position: fixed;
  top: 56px;
  right: 16px;
  width: 280px;
  background: var(--color-bg);
  border-radius: var(--radius-md);
  padding: 20px;
  box-shadow: var(--shadow-md);
  animation: audio-drop-in 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes audio-drop-in {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

.audio-dropdown h3 {
  margin: 0 0 14px;
  font-size: 14px;
  font-weight: var(--fw-medium);
  color: var(--color-text);
}

.audio-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border);
}

.audio-sub-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0 4px 16px;
  border-bottom: 1px solid var(--color-border);
}

.row-label {
  font-size: 13px;
  font-weight: var(--fw-regular);
  color: var(--color-text);
}

.sub-label {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.volume-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.volume-slider {
  width: 80px;
  accent-color: var(--color-primary);
}

.vol-num {
  font-size: 12px;
  color: var(--color-text-secondary);
  min-width: 24px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.mini-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg-secondary);
  color: var(--color-text);
  font-size: 12px;
  font-weight: var(--fw-regular);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.mini-btn.on {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.bgm-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 8px 0 14px;
}

.bgm-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg-secondary);
  color: var(--color-text);
  font-size: 12px;
  font-weight: var(--fw-regular);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.bgm-btn.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.bgm-btn.stop {
  color: var(--color-danger);
  border-color: var(--color-danger);
}

.close-panel {
  width: 100%;
  margin-top: 8px;
  padding: 8px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg-secondary);
  color: var(--color-text);
  font-size: 13px;
  font-weight: var(--fw-regular);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.close-panel:hover {
  background: var(--color-hover-bg);
}
</style>
