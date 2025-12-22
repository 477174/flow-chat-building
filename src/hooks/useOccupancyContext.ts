import { useContext } from 'react'
import { OccupancyContext, type OccupancyContextValue } from '@/contexts/occupancyContextDef'
import type { LeadPosition } from '@/services/api'

export function useOccupancyContext(): OccupancyContextValue | null {
  return useContext(OccupancyContext)
}

export function useNodeOccupancy(nodeId: string): number {
  const context = useContext(OccupancyContext)
  if (!context) return 0
  return context.getNodeCount(nodeId)
}

export function useNodeLeads(nodeId: string): LeadPosition[] {
  const context = useContext(OccupancyContext)
  if (!context) return []
  return context.getLeadsOnNode(nodeId)
}
