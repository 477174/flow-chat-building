import { createContext } from 'react'
import type { FlowOccupancy, LeadPosition } from '@/services/api'

export interface OccupancyContextValue {
  occupancy: FlowOccupancy
  totalLeads: number
  isLoading: boolean
  error: string | null
  getNodeCount: (nodeId: string) => number
  getLeadsOnNode: (nodeId: string) => LeadPosition[]
  refresh: () => void
}

export const OccupancyContext = createContext<OccupancyContextValue | null>(null)
OccupancyContext.displayName = 'OccupancyContext'
