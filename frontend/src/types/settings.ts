/** Settings types. */

export type Theme = 'light' | 'dark'

export interface AppSettings {
  theme: Theme
  master_volume: number
  bgm_enabled: boolean
  ambiance_enabled: boolean
  default_timer_mode: string
  default_species_id: string
  dev_mode: boolean
  weather_enabled: boolean
  floating_ball_enabled: boolean
}
