import { useContext } from 'react'
import { OccupancyContext, type OccupancyContextValue } from '@/contexts/occupancyContextDef'

export function useOccupancyContext(): OccupancyContextValue | null {
  return useContext(OccupancyContext)
}

export function useNodeOccupancy(nodeId: string): number {
  const context = useContext(OccupancyContext)
  if (!context) return 0
  return context.getNodeCount(nodeId)
}
