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
      暂无待办，添加一个吧 ✨
    </p>

    <TodoAddForm />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useTodosStore } from '../../stores/todos'
import TodoItem from './TodoItem.vue'
import TodoAddForm from './TodoAddForm.vue'

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
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 12px;
}

.todo-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.empty-hint {
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 14px;
  padding: 20px 0;
}
</style>
