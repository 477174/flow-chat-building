import { useMemo } from 'react'
import { useFlowStore } from '@/stores/flowStore'
import {
  collectAvailableVariables,
  type AvailableVariable,
} from '@/utils/variableUtils'

/**
 * Hook to compute which variables are available at a given node
 * by traversing upstream in the flow graph.
 *
 * Only returns variables from UPSTREAM nodes - a node cannot use
 * its own variable (it only has a value after user interaction).
 *
 * @param nodeId - The node to compute available variables for
 * @returns Array of available variables with their source information
 */
export function useAvailableVariables(nodeId: string | null): AvailableVariable[] {
  const nodes = useFlowStore((state) => state.nodes)
  const edges = useFlowStore((state) => state.edges)

  return useMemo(() => {
    if (!nodeId) return []
    return collectAvailableVariables(nodeId, nodes, edges)
  }, [nodeId, nodes, edges])
}

export type { AvailableVariable }
