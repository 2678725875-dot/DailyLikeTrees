<template>
  <div class="settings-fab">
    <button class="fab-btn" @click="open = !open" title="设置">
      <IconSvg name="settings" :size="20" />
    </button>

    <Teleport to="body">
      <div v-if="open" class="settings-overlay" @click.self="open = false">
        <div class="settings-drawer">
          <h3>设置</h3>

          <div class="setting-item">
            <span>主题</span>
            <button class="toggle-btn" @click="settings.toggleTheme()">
              <IconSvg :name="settings.theme === 'dark' ? 'moon' : 'sun'" :size="14" />
              {{ settings.theme === 'dark' ? '深色' : '浅色' }}
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
              <IconSvg :name="audio.isMuted ? 'volume-off' : 'volume-on'" :size="14" />
              {{ audio.isMuted ? '已静音' : '未静音' }}
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
import IconSvg from '../icons/IconSvg.vue'

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
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-md);
  transition: transform var(--transition-fast);
}

.fab-btn:hover {
  transform: scale(1.05);
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
  border-radius: var(--radius-md) var(--radius-md) 0 0;
  padding: 24px;
  box-shadow: var(--shadow-md);
  animation: drawer-slide-in 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes drawer-slide-in {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.settings-drawer h3 {
  margin: 0 0 20px;
  font-size: 16px;
  font-weight: var(--fw-medium);
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
  font-weight: var(--fw-regular);
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
  font-size: 12px;
  color: var(--color-text-secondary);
  min-width: 28px;
  font-variant-numeric: tabular-nums;
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg-secondary);
  color: var(--color-text);
  font-size: 12px;
  font-weight: var(--fw-regular);
  cursor: pointer;
  transition: all var(--transition-fast);
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
  border-radius: var(--radius-sm);
  background: var(--color-bg-secondary);
  color: var(--color-text);
  font-size: 13px;
  font-weight: var(--fw-regular);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.close-drawer:hover {
  background: var(--color-hover-bg);
}
</style>
