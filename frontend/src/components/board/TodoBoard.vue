<template>
  <div class="todo-board">
    <h3 class="board-title">待办事项</h3>

    <ul v-if="store.items.length > 0" class="todo-list">
      <TodoItem
        v-for="item in store.items"
        :key="item.id"
        :item="item"
      />
    </ul>

    <p v-else-if="!store.loading" class="empty-hint">
      <IconSvg name="sparkle" :size="16" />
      暂无待办，添加一个吧
    </p>

    <TodoAddForm />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useTodosStore } from '../../stores/todos'
import TodoItem from './TodoItem.vue'
import TodoAddForm from './TodoAddForm.vue'
import IconSvg from '../icons/IconSvg.vue'

const store = useTodosStore()

onMounted(() => {
  store.fetchTodos()
})
</script>

<style scoped>
.todo-board {
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
}

.board-title {
  font-size: 11px;
  font-weight: var(--fw-medium);
  color: var(--color-text-secondary);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin: 0 0 16px;
}

.todo-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.empty-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--color-text-tertiary);
  font-size: 13px;
  font-weight: var(--fw-light);
  padding: 24px 0;
}
</style>
