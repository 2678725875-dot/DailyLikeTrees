/** Todo board store. */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { TodoItem } from '../types/todo'
import * as api from '../services/api'

export const useTodosStore = defineStore('todos', () => {
  const items = ref<TodoItem[]>([])
  const activeTodoId = ref<number | null>(null)
  const loading = ref(false)

  async function fetchTodos(retries = 3) {
    loading.value = true
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const { data } = await api.getTodos()
        items.value = data
        break
      } catch (err) {
        if (attempt < retries) {
          // Backend may still be starting — wait and retry
          await new Promise(r => setTimeout(r, 1000))
          continue
        }
        console.error('Failed to fetch todos:', err)
      }
    }
    loading.value = false
  }

  function setActiveTodo(id: number | null) {
    activeTodoId.value = id
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
    // When completing the currently active todo, clear the active state
    if (newCompleted === 1 && activeTodoId.value === id) {
      activeTodoId.value = null
    }
    try {
      await api.updateTodo(id, { completed: newCompleted })
    } catch (err) {
      // Revert
      todo.completed = todo.completed ? 0 : 1
      // Revert active state if completion was reverted
      if (newCompleted === 1 && activeTodoId.value === null) {
        activeTodoId.value = id
      }
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

  return { items, activeTodoId, loading, fetchTodos, addTodo, toggleTodo, editTodo, removeTodo, setActiveTodo }
})
