/** API service layer — axios wrapper for the FastAPI backend. */

import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
})

// ── Sessions ──

export interface SessionCreateData {
  timer_mode: string
  target_seconds: number
  actual_seconds: number
  species_id: string
  started_at: string
  ended_at: string
}

export function completeSession(data: SessionCreateData) {
  return api.post('/api/sessions', data)
}

export function getSessions(limit = 20, offset = 0) {
  return api.get('/api/sessions', { params: { limit, offset } })
}

// ── Trees ──

export function getTrees(filter: string = 'today') {
  return api.get('/api/trees', { params: { filter } })
}

// ── Todos ──

export function getTodos() {
  return api.get('/api/todos')
}

export function createTodo(content: string) {
  return api.post('/api/todos', { content })
}

export function updateTodo(id: number, data: { content?: string; completed?: number }) {
  return api.patch(`/api/todos/${id}`, data)
}

export function deleteTodo(id: number) {
  return api.delete(`/api/todos/${id}`)
}

export function reorderTodos(items: { id: number; sort_order: number }[]) {
  return api.put('/api/todos/reorder', { items })
}

// ── Settings ──

export function getSettings() {
  return api.get('/api/settings')
}

export function updateSettings(data: Record<string, any>) {
  return api.put('/api/settings', data)
}

export default api
