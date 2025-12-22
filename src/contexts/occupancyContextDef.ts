import { createContext } from 'react'
import type { FlowOccupancy } from '@/services/api'

export interface OccupancyContextValue {
  occupancy: FlowOccupancy
  totalLeads: number
  isLoading: boolean
  error: string | null
  getNodeCount: (nodeId: string) => number
  refresh: () => void
}

export const OccupancyContext = createContext<OccupancyContextValue | null>(null)
OccupancyContext.displayName = 'OccupancyContext'
