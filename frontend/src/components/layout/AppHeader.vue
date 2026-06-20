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
        <IconSvg name="timer" :size="16" />
        <span>专注</span>
      </router-link>
      <router-link to="/forest" class="nav-link" active-class="active">
        <IconSvg name="tree" :size="14" />
        <span>森林</span>
      </router-link>
    </nav>

    <div class="header-right">
      <AudioControlPanel />
      <button
        class="icon-btn"
        @click="settings.toggleTheme()"
        :title="settings.theme === 'dark' ? '切换到浅色' : '切换到深色'"
      >
        <IconSvg :name="settings.theme === 'dark' ? 'sun' : 'moon'" :size="18" />
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useSettingsStore } from '../../stores/settings'
import AudioControlPanel from '../audio/AudioControlPanel.vue'
import IconSvg from '../icons/IconSvg.vue'
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
  backdrop-filter: var(--blur-md);
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
  font-weight: var(--fw-semibold);
  color: var(--color-text);
  letter-spacing: -0.5px;
}

.header-nav {
  display: flex;
  gap: 4px;
  position: relative;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 14px;
  border-radius: 8px;
  text-decoration: none;
  font-size: 13px;
  font-weight: var(--fw-medium);
  color: var(--color-text-secondary);
  transition: color var(--transition-base), background var(--transition-base);
  position: relative;
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 50%;
  width: 16px;
  height: 1.5px;
  background: var(--color-primary);
  transform: translateX(-50%) scaleX(0);
  transition: transform var(--transition-base);
  border-radius: 1px;
}

.nav-link:hover {
  color: var(--color-text);
}

.nav-link.active {
  color: var(--color-primary);
}

.nav-link.active::after {
  transform: translateX(-50%) scaleX(1);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.icon-btn {
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

.icon-btn:hover {
  background: var(--color-hover-bg);
}
</style>
