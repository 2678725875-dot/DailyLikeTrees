<template>
  <form class="add-form" @submit.prevent="handleSubmit">
    <input
      v-model="text"
      class="add-input"
      placeholder="添加新任务..."
      maxlength="200"
    />
    <button
      type="submit"
      class="add-btn"
      :disabled="!text.trim()"
    >
      +
    </button>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useTodosStore } from '../../stores/todos'

const store = useTodosStore()
const text = ref('')

function handleSubmit() {
  const content = text.value.trim()
  if (!content) return
  store.addTodo(content)
  text.value = ''
}
</script>

<style scoped>
.add-form {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.add-input {
  flex: 1;
  padding: 10px 14px;
  border: 1.5px solid var(--color-border);
  border-radius: 10px;
  font-size: 14px;
  background: var(--color-bg-secondary);
  color: var(--color-text);
  outline: none;
  transition: border-color 0.2s;
}

.add-input:focus {
  border-color: var(--color-primary);
}

.add-input::placeholder {
  color: var(--color-text-secondary);
  opacity: 0.6;
}

.add-btn {
  width: 42px;
  height: 42px;
  border: none;
  border-radius: 10px;
  background: var(--color-primary);
  color: white;
  font-size: 22px;
  font-weight: 300;
  cursor: pointer;
  transition: opacity 0.2s;
  flex-shrink: 0;
}

.add-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
