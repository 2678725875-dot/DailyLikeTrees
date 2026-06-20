/** Tree species and growth stage types. */

export type GrowthStage = 0 | 1 | 2 | 3

export interface TreeSpecies {
  id: string
  name: string
  description: string
  color: string           // primary color for UI accents
  variantCount: number    // how many variant PNGs this species has
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

/** Scale factor applied to tree sprite based on growth stage.
 *
 *  Base sprite is 64×64 px; tiles are 80×40 px. Scales are tuned so
 *  mature trees fill ~44 px on screen — comfortably within one tile. */
export function growthStageScale(stage: GrowthStage): number {
  const scales = [0.35, 0.50, 0.65, 0.80]
  return scales[stage] ?? 0.80
}
