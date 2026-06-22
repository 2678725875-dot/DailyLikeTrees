/** Centralized asset path registry.
 *
 *  All sprite/audio paths flow through here.
 *  Tree sprites use a variant system: each species has N variant PNGs;
 *  growth stage is conveyed via sprite scale, not separate images.
 */

import { TREE_SPECIES } from './constants'

function buildSpeciesPaths(speciesId: string, variantCount: number): string[] {
  return Array.from({ length: variantCount }, (_, i) =>
    `/assets/trees/species/${speciesId}/variant_${i}.png`
  )
}

/** Build the species path map from TREE_SPECIES (single source of truth). */
function buildSpeciesPathMap(): Record<string, string[]> {
  const map: Record<string, string[]> = {}
  for (const s of TREE_SPECIES) {
    map[s.id] = buildSpeciesPaths(s.id, s.variantCount)
  }
  return map
}

export const ASSET_PATHS = {
  trees: {
    placeholder: '/assets/trees/placeholder-tree.svg',
    species: buildSpeciesPathMap(),
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
      // Terrain layer
      plain: '/assets/audio/ambiance/plain.mp3',
      creek: '/assets/audio/ambiance/creek.mp3',
      mountain: '/assets/audio/ambiance/mountain.mp3',
      // Weather layer
      sunny: '/assets/audio/ambiance/sunny.mp3',
      cloudy: '/assets/audio/ambiance/cloudy.mp3',
      rain: '/assets/audio/ambiance/rainny_day.mp3',
      thunder: '/assets/audio/ambiance/thunder_rain.mp3',
    },
    music: {
      calm1: '/assets/audio/music/calm-1.mp3',
      calm2: '/assets/audio/music/calm-2.mp3',
      calm3: '/assets/audio/music/calm-3.mp3',
    },
  },
} as const

/** Backward-compatible mapping: old species IDs → new IDs. */
const OLD_SPECIES_MAP: Record<string, string> = {
  oak: 'tree8', pine: 'tree2', cherry: 'tree4', maple: 'tree10',
  bonsai: 'tree19', frost: 'tree15',
}

/** Get all variant paths for a given species. */
export function getSpeciesVariantPaths(speciesId: string): string[] {
  const mapped = OLD_SPECIES_MAP[speciesId] ?? speciesId
  const variants = ASSET_PATHS.trees.species[mapped as keyof typeof ASSET_PATHS.trees.species]
  return (variants as string[]) ?? [ASSET_PATHS.trees.placeholder]
}

/** Pick a random variant path for a species (deterministic by seed). */
export function getRandomVariantPath(speciesId: string, seed: number): string {
  const variants = getSpeciesVariantPaths(speciesId)
  const idx = seed % variants.length
  return variants[idx] ?? ASSET_PATHS.trees.placeholder
}

/** Get the preview path for a species (first variant). */
export function getSpeciesPreviewPath(speciesId: string): string {
  const variants = getSpeciesVariantPaths(speciesId)
  return variants[0] ?? ASSET_PATHS.trees.placeholder
}
