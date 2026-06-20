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
      <IconSvg name="plus" :size="18" />
    </button>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useTodosStore } from '../../stores/todos'
import IconSvg from '../icons/IconSvg.vue'

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
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: var(--fw-regular);
  background: var(--color-bg-secondary);
  color: var(--color-text);
  outline: none;
  transition: border-color var(--transition-fast);
}

.add-input:focus {
  border-color: var(--color-primary);
}

.add-input::placeholder {
  color: var(--color-text-tertiary);
}

.add-btn {
  width: 38px;
  height: 38px;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--color-primary);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all var(--transition-fast);
}

.add-btn:hover:not(:disabled) {
  transform: scale(1.05);
}

.add-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
</style>
