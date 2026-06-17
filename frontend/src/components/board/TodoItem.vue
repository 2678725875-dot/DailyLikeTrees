<template>
  <li class="todo-item" :class="{ completed: item.completed }">
    <button
      class="check-btn"
      :class="{ checked: item.completed }"
      @click="store.toggleTodo(item.id)"
      title="切换完成状态"
    >
      <span v-if="item.completed">✓</span>
    </button>

    <span
      v-if="!editing"
      class="todo-content"
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
      class="delete-btn"
      @click="store.removeTodo(item.id)"
      title="删除"
    >
      ×
    </button>
  </li>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useTodosStore } from '../../stores/todos'
import type { TodoItem } from '../../types/todo'

const props = defineProps<{ item: TodoItem }>()
const store = useTodosStore()

const editing = ref(false)
const editText = ref('')
const editInput = ref<HTMLInputElement | null>(null)

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
  border-radius: 10px;
  transition: background 0.2s;
}

.todo-item.completed {
  opacity: 0.55;
}

.check-btn {
  width: 22px;
  height: 22px;
  border: 2px solid var(--color-border);
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: white;
  flex-shrink: 0;
  transition: background 0.2s, border-color 0.2s;
}

.check-btn.checked {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.todo-content {
  flex: 1;
  font-size: 14px;
  color: var(--color-text);
  cursor: default;
}

.completed .todo-content {
  text-decoration: line-through;
  color: var(--color-text-secondary);
}

.todo-edit-input {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid var(--color-primary);
  border-radius: 6px;
  font-size: 14px;
  background: var(--color-bg);
  color: var(--color-text);
  outline: none;
}

.delete-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 18px;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s, color 0.2s;
}

.todo-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  color: var(--color-danger, #e74c3c);
}
</style>
