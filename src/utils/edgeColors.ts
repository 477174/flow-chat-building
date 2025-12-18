import type { Edge } from '@xyflow/react'

/**
 * Generate evenly distributed HSL colors for edges
 * Uses the same logic as teste.html:
 * 1. Calculate evenly spaced hues around the 360° color wheel
 * 2. Apply a random offset to start from a different point
 * 3. Shuffle the hues randomly before assigning
 * 4. Use fixed saturation (70%) and lightness (55%)
 */

interface ColorConfig {
  saturation?: number
  lightness?: number
}

/**
 * Generate an array of HSL color strings
 * @param count - Number of colors to generate
 * @param config - Optional saturation and lightness values
 * @returns Array of HSL color strings
 */
export function generateHSLColors(
  count: number,
  config: ColorConfig = {}
): string[] {
  if (count === 0) return []

  const { saturation = 70, lightness = 55 } = config

  const hues: number[] = []
  const step = 360 / count
  const offset = Math.random() * 360 // Random starting angle

  // Generate hues spaced evenly around the circle
  for (let i = 0; i < count; i++) {
    const hue = (offset + i * step) % 360
    hues.push(hue)
  }

  // Shuffle hues so order is random before assigning
  for (let i = hues.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[hues[i], hues[j]] = [hues[j], hues[i]]
  }

  // Convert to HSL color strings
  return hues.map((hue) => `hsl(${Math.round(hue)}, ${saturation}%, ${lightness}%)`)
}

/**
 * Apply random colors to edges
 * @param edges - Array of edges to colorize
 * @param seed - Optional seed for deterministic colors (based on edge count)
 * @returns Edges with style.stroke applied
 */
export function applyEdgeColors<T extends Edge>(edges: T[]): T[] {
  if (edges.length === 0) return edges

  const colors = generateHSLColors(edges.length)

  return edges.map((edge, index) => ({
    ...edge,
    style: {
      ...edge.style,
      stroke: colors[index],
      strokeWidth: 2,
    },
  }))
}

/**
 * Create a color map for edges that persists across renders
 * This is useful when you want consistent colors for the same edges
 * @param edges - Array of edges
 * @param existingColorMap - Existing color map to preserve colors for unchanged edges
 * @returns Map of edge ID to color
 */
export function createEdgeColorMap(
  edges: Edge[],
  existingColorMap: Map<string, string> = new Map()
): Map<string, string> {
  const newColorMap = new Map<string, string>()
  const edgesNeedingColors: string[] = []

  // First, preserve colors for existing edges
  for (const edge of edges) {
    const existingColor = existingColorMap.get(edge.id)
    if (existingColor) {
      newColorMap.set(edge.id, existingColor)
    } else {
      edgesNeedingColors.push(edge.id)
    }
  }

  // Generate new colors only for new edges
  if (edgesNeedingColors.length > 0) {
    const newColors = generateHSLColors(edgesNeedingColors.length)
    edgesNeedingColors.forEach((edgeId, index) => {
      newColorMap.set(edgeId, newColors[index])
    })
  }

  return newColorMap
}
