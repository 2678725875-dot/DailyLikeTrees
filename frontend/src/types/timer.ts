/** Timer mode and status types. */

export type TimerMode = 'countdown' | 'countup' | 'free'
export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed'

export interface TimerState {
  mode: TimerMode
  status: TimerStatus
  targetSeconds: number
  elapsedSeconds: number
  remainingSeconds: number
  selectedSpeciesId: string
  currentSessionId: number | null
}

export const TIMER_PRESETS = [15, 25, 30, 45, 60, 90, 120] as const
