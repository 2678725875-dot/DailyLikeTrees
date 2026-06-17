<template>
  <header class="app-header">
    <div class="header-left">
      <router-link to="/" class="logo-link">
        <svg width="28" height="28" viewBox="0 0 48 48">
          <rect x="22" y="28" width="4" height="14" rx="1" fill="#6B8E23" />
          <circle cx="24" cy="18" r="14" fill="#6B8E23" opacity="0.8" />
        </svg>
        <span class="logo-text">DailyLikeTrees</span>
      </router-link>
    </div>

    <nav class="header-nav">
      <router-link to="/" class="nav-link" active-class="active">
        <span>⏱</span> 专注
      </router-link>
      <router-link to="/forest" class="nav-link" active-class="active">
        <span>🌳</span> 森林
      </router-link>
    </nav>

    <div class="header-right">
      <AudioControlPanel />
      <button
        class="icon-btn"
        @click="settings.toggleTheme()"
        :title="settings.theme === 'dark' ? '切换到浅色' : '切换到深色'"
      >
        {{ settings.theme === 'dark' ? '☀' : '☾' }}
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useSettingsStore } from '../../stores/settings'
import AudioControlPanel from '../audio/AudioControlPanel.vue'
const settings = useSettingsStore()
</script>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 52px;
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(10px);
  box-shadow: var(--shadow-xs);
}

.header-left {
  display: flex;
  align-items: center;
}

.logo-link {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
}

.logo-text {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.3px;
}

.header-nav {
  display: flex;
  gap: 4px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border-radius: 16px;
  text-decoration: none;
  font-size: 14px;
  color: var(--color-text-secondary);
  transition: background 0.2s, color 0.2s;
}

.nav-link:hover {
  background: var(--color-hover-bg);
}

.nav-link.active {
  background: var(--color-primary);
  color: white;
}

.header-right {
  display: flex;
  align-items: center;
}

.icon-btn {
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 50%;
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.icon-btn:hover {
  background: var(--color-hover-bg);
}
</style>
