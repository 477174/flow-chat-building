import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getFlowOccupancy,
  createOccupancyWebSocket,
  type FlowOccupancy,
  type LeadPosition,
} from '@/services/api'

interface OccupancyState {
  occupancy: FlowOccupancy
  totalLeads: number
  isLoading: boolean
  error: string | null
}

interface OccupancyUpdateEvent {
  type: 'occupancy_update'
  data: {
    flow_id: string
    occupancy: FlowOccupancy
    total_leads: number
  }
}

export function useFlowOccupancy(flowId: string | null) {
  const [state, setState] = useState<OccupancyState>({
    occupancy: {},
    totalLeads: 0,
    isLoading: false,
    error: null,
  })

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const flowIdRef = useRef<string | null>(null)

  // Initial fetch and WebSocket connection - only when flowId changes
  useEffect(() => {
    // Skip if flowId hasn't changed
    if (flowIdRef.current === flowId) return
    flowIdRef.current = flowId

    // Cleanup previous connection
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (!flowId) {
      setState({ occupancy: {}, totalLeads: 0, isLoading: false, error: null })
      return
    }

    // Fetch initial data
    const fetchOccupancy = async () => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }))

      try {
        const data = await getFlowOccupancy(flowId)
        const occupancy = data || {}
        const total = Object.values(occupancy).reduce(
          (sum, node) => sum + (node?.count ?? 0),
          0
        )

        setState({
          occupancy,
          totalLeads: total,
          isLoading: false,
          error: null,
        })
      } catch (err) {
        console.error('[Occupancy] Fetch error:', err)
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: err instanceof Error ? err.message : 'Failed to fetch occupancy',
        }))
      }
    }

    // Connect WebSocket
    const connectWebSocket = () => {
      const ws = createOccupancyWebSocket(flowId)

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as OccupancyUpdateEvent
          if (message.type === 'occupancy_update') {
            setState((prev) => ({
              ...prev,
              occupancy: message.data.occupancy,
              totalLeads: message.data.total_leads,
            }))
          }
        } catch (err) {
          console.error('[Occupancy WS] Parse error:', err)
        }
      }

      ws.onclose = () => {
        // Only reconnect if this is still the current flow
        if (flowIdRef.current === flowId) {
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000)
        }
      }

      wsRef.current = ws
    }

    fetchOccupancy()
    connectWebSocket()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
    }
  }, [flowId])

  // Get count for a specific node
  const getNodeCount = useCallback(
    (nodeId: string): number => {
      return state.occupancy[nodeId]?.count ?? 0
    },
    [state.occupancy]
  )

  // Get leads for a specific node
  const getLeadsOnNode = useCallback(
    (nodeId: string): LeadPosition[] => {
      return state.occupancy[nodeId]?.leads ?? []
    },
    [state.occupancy]
  )

  // Manual refresh - forces re-fetch
  const refresh = useCallback(async () => {
    if (!flowId) return

    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const data = await getFlowOccupancy(flowId)
      const occupancy = data || {}
      const total = Object.values(occupancy).reduce(
        (sum, node) => sum + (node?.count ?? 0),
        0
      )

      setState({
        occupancy,
        totalLeads: total,
        isLoading: false,
        error: null,
      })
    } catch (err) {
      console.error('[Occupancy] Refresh error:', err)
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch occupancy',
      }))
    }
  }, [flowId])

  return {
    occupancy: state.occupancy,
    totalLeads: state.totalLeads,
    isLoading: state.isLoading,
    error: state.error,
    getNodeCount,
    getLeadsOnNode,
    refresh,
  }
}
