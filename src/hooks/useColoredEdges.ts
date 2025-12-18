import { useMemo } from 'react'
import type { Edge } from '@xyflow/react'
import { generateHSLColors } from '@/utils/edgeColors'

interface ColoredEdgeOptions {
  saturation?: number
  lightness?: number
  strokeWidth?: number
}

/**
 * Hook to apply random HSL colors to edges
 * Colors are regenerated when the number of edges changes
 * Uses the same algorithm as teste.html:
 * 1. Generate evenly spaced hues around 360°
 * 2. Apply random offset
 * 3. Shuffle hues randomly
 * 4. Apply to edges
 *
 * @param edges - Array of edges to colorize
 * @param options - Configuration options
 * @returns Edges with style.stroke applied
 */
export function useColoredEdges<T extends Edge>(
  edges: T[],
  options: ColoredEdgeOptions = {}
): T[] {
  const { saturation = 70, lightness = 55, strokeWidth = 2 } = options

  // Generate colors - regenerates when edge count changes
  // Each edge gets a unique color evenly distributed around the HSL hue wheel
  const colors = useMemo(() => {
    if (edges.length === 0) return []
    return generateHSLColors(edges.length, { saturation, lightness })
  }, [edges.length, saturation, lightness])

  // Apply colors to edges and set custom edge type
  return useMemo(() => {
    if (edges.length === 0) return edges

    return edges.map((edge, index) => ({
      ...edge,
      type: 'colored',
      data: {
        ...edge.data,
        strokeColor: colors[index],
        strokeWidth,
      },
    }))
  }, [edges, colors, strokeWidth])
}
