<template>
  <div
    class="fb-window"
    data-tauri-drag-region
    @mousedown="onMouseDown"
  >
    <!-- Collapsed: timer + active todo -->
    <div v-if="!expanded" class="fb-mini" @click.stop="expand">
      <div class="fb-mini-timer">{{ displayTime }}</div>
      <div v-if="activeTodoText" class="fb-mini-todo" :title="activeTodoText">{{ activeTodoText }}</div>
    </div>

    <!-- Expanded: timer + full todo list -->
    <div v-else class="fb-panel">
      <div class="fb-panel-header">
        <span class="fb-timer">{{ displayTime }}</span>
        <button class="fb-close" @click.stop="collapse" title="收起">
          <svg width="14" height="14" viewBox="0 0 12 12"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
        </button>
      </div>

      <div v-if="todos.length === 0" class="fb-empty">暂无待办</div>
      <ul v-else class="fb-todo-list">
        <li
          v-for="item in todos"
          :key="item.id"
          class="fb-todo-item"
          :class="{ active: activeTodoId === item.id, completed: item.completed }"
          @click.stop="setActiveTodo(item.id)"
        >
          <span class="fb-dot" />
          <span class="fb-todo-text">{{ item.content }}</span>
          <button
            v-if="activeTodoId === item.id"
            class="fb-clear-active"
            @click.stop="setActiveTodo(null)"
            title="取消正在做"
          >✕</button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'

// ── Tauri detection ──
const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
const tauri = isTauri ? (window as any).__TAURI_INTERNALS__ : null
const tauriInvoke = tauri
  ? (cmd: string, args?: Record<string, unknown>) => tauri.invoke(cmd, args).catch(() => {})
  : null

const winLabel = tauri?.metadata?.currentWindow?.label ?? 'floating-ball'

// ── Local state ──
interface TodoItem {
  id: number
  content: string
  completed: number
}

const timerStatus = ref<string>('idle')
const elapsedSeconds = ref(0)
const targetSeconds = ref(0)
const mode = ref<string>('countdown')
const todos = ref<TodoItem[]>([])
const activeTodoId = ref<number | null>(null)
const expanded = ref(false)

// ── Timer display ──
const displaySeconds = computed(() => {
  if (mode.value === 'countdown') {
    return Math.max(0, targetSeconds.value - elapsedSeconds.value)
  }
  return elapsedSeconds.value
})

const displayTime = computed(() => {
  const total = displaySeconds.value
  const hrs = Math.floor(total / 3600)
  const mins = Math.floor((total % 3600) / 60)
  const secs = total % 60
  if (hrs > 0) return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
})

const activeTodoText = computed(() => {
  const todo = todos.value.find(t => t.id === activeTodoId.value)
  return todo ? todo.content : ''
})

// ── Local timer tick ──
let tickTimer: ReturnType<typeof setInterval> | null = null

function startTicking() {
  if (tickTimer) return
  tickTimer = setInterval(() => {
    if (timerStatus.value === 'running') elapsedSeconds.value++
  }, 1000)
}

function stopTicking() {
  if (tickTimer) { clearInterval(tickTimer); tickTimer = null }
}

// ── Tauri events ──
let unlisten: (() => void) | null = null

async function setupEventListener() {
  if (!isTauri) return
  try {
    const { listen } = await import('@tauri-apps/api/event')
    unlisten = await listen('fb:state', (event: any) => {
      handleStateUpdate(event.payload)
    })

    // Request initial state from main window
    if (tauriInvoke) {
      tauriInvoke('plugin:event|emit', { event: 'fb:request-state', payload: {} })
    }
  } catch (e) {
    console.warn('FloatingBallView: failed to setup event listener', e)
  }
}

function handleStateUpdate(payload: any) {
  if (!payload) return
  if (payload.timerStatus !== undefined) timerStatus.value = payload.timerStatus
  if (payload.elapsedSeconds !== undefined) elapsedSeconds.value = payload.elapsedSeconds
  if (payload.targetSeconds !== undefined) targetSeconds.value = payload.targetSeconds
  if (payload.mode !== undefined) mode.value = payload.mode
  if (payload.todos !== undefined) todos.value = payload.todos
  if (payload.activeTodoId !== undefined) activeTodoId.value = payload.activeTodoId

  if (payload.timerStatus === 'running') startTicking()
  else stopTicking()
}

// ── Drag ──
function onMouseDown(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (target.closest('button') || target.closest('.fb-todo-item')) return
  if (!tauriInvoke) return
  tauriInvoke('plugin:window|start_dragging', { label: winLabel })
}

// ── Expand / collapse + notify main window to resize ──
function expand() {
  expanded.value = true
  notifyResize(260, 380)
}

function collapse() {
  expanded.value = false
  notifyResize(130, 75)
}

function notifyResize(width: number, height: number) {
  if (!tauriInvoke) return
  // Resize own window
  tauriInvoke('plugin:window|set_size', {
    label: winLabel,
    value: { width, height },
  })
}

// ── Set active todo ──
function setActiveTodo(id: number | null) {
  activeTodoId.value = id
  if (tauriInvoke) {
    tauriInvoke('plugin:event|emit', { event: 'fb:set-active', payload: { todoId: id } })
  }
}

// ── Lifecycle ──
onMounted(() => {
  setupEventListener()
})

onUnmounted(() => {
  stopTicking()
  if (unlisten) { unlisten(); unlisten = null }
})
</script>

<style scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.fb-window {
  position: fixed;
  inset: 0;
  user-select: none;
  -webkit-user-select: none;
  font-family: 'Inter', 'SF Pro Display', 'PingFang SC', 'Microsoft YaHei', -apple-system, sans-serif;
  background: transparent;
  overflow: hidden;
}

.fb-mini {
  width: 110px;
  min-height: 56px;
  padding: 8px 12px;
  border-radius: 18px;
  background: rgba(30, 30, 30, 0.94);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.45);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  backdrop-filter: blur(12px);
  margin: 4px;
  transition: transform 0.15s ease, background 0.15s ease;
}

.fb-mini:hover {
  transform: scale(1.04);
  background: rgba(40, 40, 40, 0.96);
}

.fb-mini-timer {
  font-size: 16px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: #4CAF50;
}

.fb-mini-todo {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
  max-width: 95px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fb-panel {
  width: 240px;
  max-height: 360px;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(30, 30, 30, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(16px);
  margin: 4px;
}

.fb-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 8px;
}

.fb-timer {
  font-size: 18px;
  font-weight: 600;
  color: #4CAF50;
  font-variant-numeric: tabular-nums;
}

.fb-close {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.15s, color 0.15s;
}

.fb-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
}

.fb-empty {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
  text-align: center;
  padding: 16px 0;
}

.fb-todo-list {
  list-style: none;
  padding: 0;
  margin: 0;
  overflow-y: auto;
  max-height: 240px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.fb-todo-list::-webkit-scrollbar { width: 3px; }
.fb-todo-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
}

.fb-todo-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background .15s;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
}

.fb-todo-item:hover { background: rgba(255, 255, 255, 0.08); }
.fb-todo-item.active { background: rgba(76, 175, 80, 0.25); color: #fff; }
.fb-todo-item.completed { opacity: 0.4; text-decoration: line-through; }

.fb-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
  opacity: 0.6;
}

.fb-todo-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fb-clear-active {
  width: 18px;
  height: 18px;
  border: none;
  background: transparent;
  color: currentColor;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.15s;
}

.fb-clear-active:hover { background: rgba(255, 255, 255, 0.15); }
</style>
