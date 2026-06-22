<template>
  <li class="todo-item" :class="{ completed: item.completed, active: store.activeTodoId === item.id }">
    <button
      class="check-btn"
      :class="{ checked: item.completed }"
      @click="store.toggleTodo(item.id)"
      title="切换完成状态"
    >
      <IconSvg v-if="item.completed" name="check" :size="12" />
    </button>

    <span
      v-if="!editing"
      class="todo-content"
      :title="store.activeTodoId === item.id ? '当前正在做' : '双击编辑，单击设为正在做'"
      @click="setActive"
      @dblclick="startEdit"
    >
      {{ item.content }}
    </span>

    <input
      v-else
      ref="editInput"
      v-model="editText"
      class="todo-edit-input"
      @blur="finishEdit"
      @keydown.enter="finishEdit"
      @keydown.escape="cancelEdit"
    />

    <button
      v-if="store.activeTodoId !== item.id"
      class="active-btn"
      @click="setActive"
      title="设为正在做"
    >
      <IconSvg name="play" :size="12" />
    </button>

    <button
      v-if="store.activeTodoId === item.id"
      class="active-btn is-active"
      @click="store.setActiveTodo(null)"
      title="取消正在做"
    >
      <IconSvg name="pause" :size="12" />
    </button>

    <button
      class="delete-btn"
      @click="store.removeTodo(item.id)"
      title="删除"
    >
      <IconSvg name="close" :size="14" />
    </button>
  </li>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useTodosStore } from '../../stores/todos'
import type { TodoItem } from '../../types/todo'
import IconSvg from '../icons/IconSvg.vue'

const props = defineProps<{ item: TodoItem } >()
const store = useTodosStore()

const editing = ref(false)
const editText = ref('')
const editInput = ref<HTMLInputElement | null>(null)

function setActive() {
  store.setActiveTodo(props.item.id)
}

function startEdit() {
  editText.value = props.item.content
  editing.value = true
  nextTick(() => editInput.value?.focus())
}

function finishEdit() {
  if (editText.value.trim() && editText.value !== props.item.content) {
    store.editTodo(props.item.id, editText.value.trim())
  }
  editing.value = false
}

function cancelEdit() {
  editing.value = false
}
</script>

<style scoped>
.todo-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast), box-shadow var(--transition-fast);
  border: 1px solid transparent;
}

.todo-item:hover {
  background: var(--color-hover-bg);
}

.todo-item.completed {
  opacity: 0.45;
}

.todo-item.active {
  border-color: var(--color-primary);
  background: var(--color-bg);
  box-shadow: 0 0 0 1px var(--color-primary);
}

.check-btn {
  width: 20px;
  height: 20px;
  border: 1.5px solid var(--color-border);
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
  transition: all var(--transition-fast);
}

.check-btn.checked {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.todo-content {
  flex: 1;
  font-size: 14px;
  font-weight: var(--fw-regular);
  color: var(--color-text);
  cursor: pointer;
}

.todo-content:hover {
  color: var(--color-primary);
}

.completed .todo-content {
  text-decoration: line-through;
  color: var(--color-text-secondary);
}

.todo-edit-input {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-xs);
  font-size: 14px;
  background: var(--color-bg);
  color: var(--color-text);
  outline: none;
}

.active-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: var(--color-text-tertiary);
  cursor: pointer;
  border-radius: var(--radius-xs);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity var(--transition-fast), color var(--transition-fast), background var(--transition-fast);
}

.todo-item:hover .active-btn {
  opacity: 1;
}

.active-btn:hover {
  color: var(--color-primary);
  background: var(--color-bg);
}

.active-btn.is-active {
  opacity: 1;
  color: var(--color-primary);
  background: var(--color-bg);
}

.delete-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: var(--color-text-tertiary);
  cursor: pointer;
  border-radius: var(--radius-xs);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity var(--transition-fast), color var(--transition-fast);
}

.todo-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  color: var(--color-danger);
}
</style>
