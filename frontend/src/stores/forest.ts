/** Forest view store. */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { PlantedTree } from '../types/tree'
import type { TerrainType, WeatherType, TimeFilter, ForestStats } from '../types/forest'
import * as api from '../services/api'

export const useForestStore = defineStore('forest', () => {
  const trees = ref<PlantedTree[]>([])
  const terrain = ref<TerrainType>('plain')
  const weather = ref<WeatherType>('sunny')
  const timeFilter = ref<TimeFilter>('today')
  const stats = ref<ForestStats>({ count: 0, total_minutes: 0 })
  const loading = ref(false)
  const forceRefresh = ref(0)

  async function fetchTrees() {
    loading.value = true
    try {
      const { data } = await api.getTrees(timeFilter.value)
      trees.value = data.trees
      stats.value = data.stats
    } catch (err) {
      console.error('Failed to fetch trees:', err)
    } finally {
      loading.value = false
    }
  }

  function setTimeFilter(filter: TimeFilter) {
    timeFilter.value = filter
    fetchTrees()
  }

  /** Force re-animation even when filter doesn't change (re-click) */
  function refreshAnimation() {
    forceRefresh.value++
  }

  function setTerrain(t: TerrainType) {
    terrain.value = t
  }

  function setWeather(w: WeatherType) {
    weather.value = w
  }

  return {
    trees, terrain, weather, timeFilter, stats, loading, forceRefresh,
    fetchTrees, setTimeFilter, setTerrain, setWeather, refreshAnimation,
  }
})
