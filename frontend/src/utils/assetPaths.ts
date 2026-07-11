/** Centralized asset path registry.
 *
 *  All sprite/audio paths flow through here.
 *  Tree sprites use a variant system: each species has N variant PNGs;
 *  growth stage is conveyed via sprite scale, not separate images.
 *
 *  Uses import.meta.env.BASE_URL so paths work under both
 *  http:// (dev server) and file:// (Electron production) protocols.
 */

import { TREE_SPECIES } from './constants'

const BASE = import.meta.env.BASE_URL  // '/' in dev, './' in prod

function buildSpeciesPaths(speciesId: string, variantCount: number): string[] {
  return Array.from({ length: variantCount }, (_, i) =>
    `${BASE}assets/trees/species/${speciesId}/variant_${i}.png`
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
    placeholder: `${BASE}assets/trees/placeholder-tree.svg`,
    species: buildSpeciesPathMap(),
  },
  terrain: {
    plain: `${BASE}assets/terrain/plain.png`,
    creek: `${BASE}assets/terrain/creek.png`,
    mountain: `${BASE}assets/terrain/mountain.png`,
  },
  weather: {
    sunny: `${BASE}assets/weather/sunny.png`,
    cloudy: `${BASE}assets/weather/cloudy.png`,
    rainy: `${BASE}assets/weather/rainy.png`,
    thunderstorm: `${BASE}assets/weather/thunderstorm.png`,
  },
  audio: {
    ambiance: {
      // Terrain layer
      plain: `${BASE}assets/audio/ambiance/plain.mp3`,
      creek: `${BASE}assets/audio/ambiance/creek.mp3`,
      mountain: `${BASE}assets/audio/ambiance/mountain.mp3`,
      // Weather layer
      sunny: `${BASE}assets/audio/ambiance/sunny.mp3`,
      cloudy: `${BASE}assets/audio/ambiance/cloudy.mp3`,
      rain: `${BASE}assets/audio/ambiance/rainny_day.mp3`,
      thunder: `${BASE}assets/audio/ambiance/thunder_rain.mp3`,
    },
    music: {
      calm1: `${BASE}assets/audio/music/calm-1.mp3`,
      calm2: `${BASE}assets/audio/music/calm-2.mp3`,
      calm3: `${BASE}assets/audio/music/calm-3.mp3`,
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
