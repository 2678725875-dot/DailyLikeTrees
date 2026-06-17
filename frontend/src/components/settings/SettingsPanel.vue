<template>
  <div class="settings-fab">
    <button class="fab-btn" @click="open = !open" title="设置">
      ⚙
    </button>

    <Teleport to="body">
      <div v-if="open" class="settings-overlay" @click.self="open = false">
        <div class="settings-drawer">
          <h3>设置</h3>

          <div class="setting-item">
            <span>主题</span>
            <button class="toggle-btn" @click="settings.toggleTheme()">
              {{ settings.theme === 'dark' ? '🌙 深色' : '☀️ 浅色' }}
            </button>
          </div>

          <div class="setting-item">
            <span>音量</span>
            <div class="volume-row">
              <input
                type="range"
                min="0"
                max="100"
                :value="audio.masterVolume"
                @input="audio.setMasterVolume(Number(($event.target as HTMLInputElement).value))"
                class="volume-slider"
              />
              <span class="volume-val">{{ audio.masterVolume }}</span>
            </div>
          </div>

          <div class="setting-item">
            <span>静音</span>
            <button
              class="toggle-btn"
              :class="{ active: audio.isMuted }"
              @click="audio.toggleMute()"
            >
              {{ audio.isMuted ? '🔇 已静音' : '🔊 未静音' }}
            </button>
          </div>

          <button class="close-drawer" @click="open = false">关闭</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useSettingsStore } from '../../stores/settings'
import { useAudioStore } from '../../stores/audio'

const settings = useSettingsStore()
const audio = useAudioStore()
const open = ref(false)
</script>

<style scoped>
.settings-fab {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 200;
}

.fab-btn {
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  font-size: 20px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  transition: transform 0.2s;
}

.fab-btn:hover {
  transform: scale(1.08);
}

.settings-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.25);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
}

.settings-drawer {
  position: fixed;
  bottom: 0;
  right: 0;
  width: 300px;
  max-width: 90vw;
  background: var(--color-bg);
  border-radius: 16px 0 0 0;
  padding: 24px;
  box-shadow: -4px -4px 20px rgba(0,0,0,0.1);
  animation: slideUp 0.25s ease-out;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.settings-drawer h3 {
  margin: 0 0 20px;
  color: var(--color-text);
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text);
  font-size: 14px;
}

.volume-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.volume-slider {
  width: 100px;
  accent-color: var(--color-primary);
}

.volume-val {
  font-size: 13px;
  color: var(--color-text-secondary);
  min-width: 28px;
}

.toggle-btn {
  padding: 6px 14px;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: var(--color-bg-secondary);
  color: var(--color-text);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-btn.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.close-drawer {
  margin-top: 16px;
  width: 100%;
  padding: 10px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-bg-secondary);
  color: var(--color-text);
  font-size: 14px;
  cursor: pointer;
}
</style>
