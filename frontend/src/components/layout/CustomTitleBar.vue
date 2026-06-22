<template>
  <div
    class="custom-titlebar"
    data-tauri-drag-region
    @mousedown="onTitleBarMouseDown"
  >
    <!-- App icon + title -->
    <div class="titlebar-left">
      <img src="/assets/logo.png" alt="" class="titlebar-icon" />
      <span class="titlebar-title">DailyLikeTrees</span>
      <!-- DEBUG: show whether we detected Tauri runtime -->
      <span v-if="!isTauri" class="no-tauri-badge">BROWSER</span>
    </div>

    <!-- Window controls -->
    <div class="titlebar-controls">
      <button class="ctrl-btn ctrl-min" @mousedown.stop @click.stop="handleMinimize" title="最小化">
        <svg width="12" height="12" viewBox="0 0 12 12"><rect y="5" width="12" height="1.2" rx="0.6" fill="currentColor"/></svg>
      </button>
      <button class="ctrl-btn ctrl-max" @mousedown.stop @click.stop="handleToggleMaximize" title="最大化">
        <svg v-if="!isMax" width="12" height="12" viewBox="0 0 12 12"><rect x="1" y="1" width="10" height="10" rx="1.2" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>
        <svg v-else width="12" height="12" viewBox="0 0 12 12"><rect x="3" y="0" width="9" height="9" rx="1.2" fill="none" stroke="currentColor" stroke-width="1.2"/><rect x="0" y="3" width="9" height="9" rx="1.2" fill="var(--color-bg)"/><rect x="0" y="3" width="9" height="9" rx="1.2" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>
      </button>
      <button class="ctrl-btn ctrl-close" @mousedown.stop @click.stop="handleClose" title="关闭">
        <svg width="12" height="12" viewBox="0 0 12 12"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// ── Tauri v2 IPC — bypass @tauri-apps/api NPM package entirely ──
// We talk to the Tauri backend via window.__TAURI_INTERNALS__.invoke().
// This eliminates any bundling / code-split / module-resolution issues.

interface TauriInternals {
  invoke(cmd: string, args?: Record<string, unknown>): Promise<unknown>
  metadata: { currentWindow: { label: string } }
}

function getTauri(): TauriInternals | null {
  if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
    return (window as any).__TAURI_INTERNALS__ as TauriInternals
  }
  return null
}

const tauri = getTauri()
const isTauri = tauri !== null
const winLabel = tauri?.metadata?.currentWindow?.label ?? 'main'

async function invokeWindow(cmd: string) {
  if (!tauri) return
  try {
    await tauri.invoke(`plugin:window|${cmd}`, { label: winLabel })
  } catch { /* ignore */ }
}

const isMax = ref(false)

async function refreshMaxState() {
  if (!tauri) return
  try {
    isMax.value = (await tauri.invoke('plugin:window|is_maximized', { label: winLabel })) as boolean
  } catch { /* ignore */ }
}

async function handleMinimize() {
  await invokeWindow('minimize')
}

async function handleToggleMaximize() {
  await invokeWindow('toggle_maximize')
  await refreshMaxState()
}

async function handleClose() {
  await invokeWindow('close')
}

function onTitleBarMouseDown(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (target.closest('.ctrl-btn')) return
  if (!tauri) return
  // startDragging must be called synchronously from the mousedown handler
  tauri.invoke('plugin:window|start_dragging', { label: winLabel }).catch(() => {})
}

onMounted(() => refreshMaxState())
</script>

<style scoped>
.custom-titlebar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 34px;
  padding: 0 8px 0 14px;
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
  user-select: none;
  -webkit-user-select: none;
  flex-shrink: 0;
}

.titlebar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  pointer-events: none;
}

.titlebar-icon {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  flex-shrink: 0;
}

.titlebar-title {
  font-size: 12px;
  font-weight: var(--fw-medium);
  color: var(--color-text);
  opacity: 0.8;
  letter-spacing: .02em;
}

.no-tauri-badge {
  font-size: 10px;
  font-weight: var(--fw-semibold);
  color: #e81123;
  background: rgba(232, 17, 35, 0.12);
  padding: 1px 6px;
  border-radius: 4px;
}

.titlebar-controls {
  display: flex;
  gap: 2px;
}

.ctrl-btn {
  width: 36px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background .15s, color .15s;
}

.ctrl-btn:hover {
  background: var(--color-hover-bg);
  color: var(--color-text);
}

.ctrl-close:hover {
  background: #e81123;
  color: #fff;
}
</style>
