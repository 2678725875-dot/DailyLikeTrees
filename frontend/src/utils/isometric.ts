/** Isometric projection math utilities.
 *
 *  Converts between grid coordinates (gx, gy) and screen coordinates (sx, sy).
 *
 *  Standard 2:1 isometric diamond tile layout:
 *    sx = (gx - gy) * (tileWidth / 2) + offsetX
 *    sy = (gx + gy) * (tileHeight / 2) + offsetY
 */

export interface IsometricConfig {
  tileWidth: number
  tileHeight: number
  offsetX: number
  offsetY: number
}

export const DEFAULT_ISO_CONFIG: IsometricConfig = {
  tileWidth: 64,
  tileHeight: 32,
  offsetX: 400,   // center of canvas
  offsetY: 80,
}

/** Grid → screen */
export function gridToScreen(
  gx: number,
  gy: number,
  config: IsometricConfig = DEFAULT_ISO_CONFIG,
): { x: number; y: number } {
  const x = (gx - gy) * (config.tileWidth / 2) + config.offsetX
  const y = (gx + gy) * (config.tileHeight / 2) + config.offsetY
  return { x, y }
}

/** Screen → grid (approximate, for click detection) */
export function screenToGrid(
  sx: number,
  sy: number,
  config: IsometricConfig = DEFAULT_ISO_CONFIG,
): { gx: number; gy: number } {
  const rx = sx - config.offsetX
  const ry = sy - config.offsetY
  const gx = (rx / (config.tileWidth / 2) + ry / (config.tileHeight / 2)) / 2
  const gy = (ry / (config.tileHeight / 2) - rx / (config.tileWidth / 2)) / 2
  return { gx: Math.round(gx), gy: Math.round(gy) }
}

/** Depth sort key: higher gx+gy renders later (in front). */
export function depthSortKey(gx: number, gy: number): number {
  return gx + gy
}
