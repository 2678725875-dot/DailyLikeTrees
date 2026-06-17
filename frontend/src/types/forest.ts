/** Forest view types. */

export type TerrainType = 'plain' | 'creek' | 'mountain'
export type WeatherType = 'sunny' | 'cloudy' | 'rainy' | 'thunderstorm'
export type TimeFilter = 'today' | 'week' | 'month' | 'total'

export interface ForestStats {
  count: number
  total_minutes: number
}

export interface GridCell {
  x: number
  y: number
  terrain: TerrainType
  tree?: {
    speciesId: string
    growthStage: number
  }
}

export const TERRAIN_LABELS: Record<TerrainType, string> = {
  plain: '平原',
  creek: '小溪',
  mountain: '山地',
}

export const WEATHER_LABELS: Record<WeatherType, string> = {
  sunny: '晴天',
  cloudy: '多云',
  rainy: '阴雨',
  thunderstorm: '雷雨',
}

export const TIME_FILTER_LABELS: Record<TimeFilter, string> = {
  today: '今日',
  week: '本周',
  month: '本月',
  total: '总计',
}
