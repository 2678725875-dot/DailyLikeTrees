/** Centralized asset path registry.
 *
 *  All sprite/audio paths flow through here.
 *  When real assets arrive, only this file needs to change.
 */

export const ASSET_PATHS = {
  trees: {
    placeholder: '/assets/trees/placeholder-tree.svg',
    species: {
      oak: {
        stages: [
          '/assets/trees/species/oak/seed.png',
          '/assets/trees/species/oak/sprout.png',
          '/assets/trees/species/oak/sapling.png',
          '/assets/trees/species/oak/mature.png',
        ],
      },
      pine: {
        stages: [
          '/assets/trees/species/pine/seed.png',
          '/assets/trees/species/pine/sprout.png',
          '/assets/trees/species/pine/sapling.png',
          '/assets/trees/species/pine/mature.png',
        ],
      },
      cherry: {
        stages: [
          '/assets/trees/species/cherry/seed.png',
          '/assets/trees/species/cherry/sprout.png',
          '/assets/trees/species/cherry/sapling.png',
          '/assets/trees/species/cherry/mature.png',
        ],
      },
      bonsai: {
        stages: [
          '/assets/trees/species/bonsai/seed.png',
          '/assets/trees/species/bonsai/sprout.png',
          '/assets/trees/species/bonsai/sapling.png',
          '/assets/trees/species/bonsai/mature.png',
        ],
      },
    },
  },
  terrain: {
    plain: '/assets/terrain/plain.png',
    creek: '/assets/terrain/creek.png',
    mountain: '/assets/terrain/mountain.png',
  },
  weather: {
    sunny: '/assets/weather/sunny.png',
    cloudy: '/assets/weather/cloudy.png',
    rainy: '/assets/weather/rainy.png',
    thunderstorm: '/assets/weather/thunderstorm.png',
  },
  audio: {
    ambiance: {
      creek: '/assets/audio/ambiance/creek.mp3',
      rain: '/assets/audio/ambiance/rain.mp3',
      thunder: '/assets/audio/ambiance/thunder.mp3',
      wind: '/assets/audio/ambiance/wind.mp3',
      forest: '/assets/audio/ambiance/forest-ambient.mp3',
    },
    music: {
      calm1: '/assets/audio/music/calm-1.mp3',
      calm2: '/assets/audio/music/calm-2.mp3',
      calm3: '/assets/audio/music/calm-3.mp3',
    },
  },
} as const

/** Given species ID and growth stage, return the asset path. */
export function getTreeSpritePath(speciesId: string, stage: number): string {
  const species = ASSET_PATHS.trees.species[speciesId as keyof typeof ASSET_PATHS.trees.species]
  if (species?.stages[stage]) return species.stages[stage]
  return ASSET_PATHS.trees.placeholder
}
