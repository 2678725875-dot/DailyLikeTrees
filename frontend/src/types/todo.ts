/** Todo types. */

export interface TodoItem {
  id: number
  content: string
  completed: number    // 0 or 1 (SQLite boolean)
  sort_order: number
  created_at: string
  updated_at: string
}
