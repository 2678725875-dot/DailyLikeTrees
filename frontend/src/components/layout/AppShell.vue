<template>
  <div class="app-shell">
    <CustomTitleBar />
    <AppHeader />
    <main class="main-content">
      <router-view />
    </main>
    <FloatingBall />
  </div>
</template>

<script setup lang="ts">
import CustomTitleBar from './CustomTitleBar.vue'
import AppHeader from './AppHeader.vue'
import FloatingBall from './FloatingBall.vue'
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 24px 64px;
  position: relative;
  z-index: 1;
  overflow-y: auto;
  overflow-x: hidden;
}
</style>
