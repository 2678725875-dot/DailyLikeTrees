/** Todo board store. */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { TodoItem } from '../types/todo'
import * as api from '../services/api'

export const useTodosStore = defineStore('todos', () => {
  const items = ref<TodoItem[]>([])
  const loading = ref(false)

  async function fetchTodos() {
    loading.value = true
    try {
      const { data } = await api.getTodos()
      items.value = data
    } catch (err) {
      console.error('Failed to fetch todos:', err)
    } finally {
      loading.value = false
    }
  }

  async function addTodo(content: string) {
    try {
      const { data } = await api.createTodo(content)
      items.value.push(data)
    } catch (err) {
      console.error('Failed to add todo:', err)
    }
  }

  async function toggleTodo(id: number) {
    const todo = items.value.find(t => t.id === id)
    if (!todo) return
    const newCompleted = todo.completed ? 0 : 1
    // Optimistic update
    todo.completed = newCompleted
    try {
      await api.updateTodo(id, { completed: newCompleted })
    } catch (err) {
      // Revert
      todo.completed = todo.completed ? 0 : 1
      console.error('Failed to toggle todo:', err)
    }
  }

  async function editTodo(id: number, content: string) {
    const todo = items.value.find(t => t.id === id)
    if (!todo) return
    const oldContent = todo.content
    todo.content = content
    try {
      await api.updateTodo(id, { content })
    } catch (err) {
      todo.content = oldContent
      console.error('Failed to edit todo:', err)
    }
  }

  async function removeTodo(id: number) {
    const idx = items.value.findIndex(t => t.id === id)
    if (idx === -1) return
    const [removed] = items.value.splice(idx, 1)
    try {
      await api.deleteTodo(id)
    } catch (err) {
      // Revert
      items.value.splice(idx, 0, removed)
      console.error('Failed to delete todo:', err)
    }
  }

  return { items, loading, fetchTodos, addTodo, toggleTodo, editTodo, removeTodo }
})
