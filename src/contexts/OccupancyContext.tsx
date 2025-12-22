'use client'

import type { ReactNode } from 'react'
import { useFlowOccupancy } from '@/hooks/useFlowOccupancy'
import { OccupancyContext } from './occupancyContextDef'

interface OccupancyProviderProps {
  flowId: string | null
  children: ReactNode
}

export function OccupancyProvider({ flowId, children }: OccupancyProviderProps) {
  const occupancyState = useFlowOccupancy(flowId)

  return (
    <OccupancyContext.Provider value={occupancyState}>
      {children}
    </OccupancyContext.Provider>
  )
}
