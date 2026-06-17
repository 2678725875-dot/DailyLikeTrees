/** Tree species and growth stage types. */

export type GrowthStage = 0 | 1 | 2 | 3

export interface TreeSpecies {
  id: string
  name: string
  description: string
  color: string           // primary color for placeholder rendering
}

export interface PlantedTree {
  id: number
  session_id: number
  species_id: string
  growth_stage: GrowthStage
  grid_x: number
  grid_y: number
  planted_at: string
}
