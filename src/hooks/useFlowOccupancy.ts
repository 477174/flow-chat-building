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

interface NodeChangeEvent {
  type: 'node_change'
  data: {
    flow_id: string
    phone: string
    from_node: string | null
    to_node: string | null
  }
}

interface OccupancyUpdateEvent {
  type: 'occupancy_update'
  data: {
    flow_id: string
    occupancy: FlowOccupancy
    total_leads: number
  }
}

type WebSocketEvent = NodeChangeEvent | OccupancyUpdateEvent

export function useFlowOccupancy(flowId: string | null) {
  console.log('[Occupancy] Hook called with flowId:', flowId)
  const [state, setState] = useState<OccupancyState>({
    occupancy: {},
    totalLeads: 0,
    isLoading: false,
    error: null,
  })

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch initial occupancy data
  const fetchOccupancy = useCallback(async () => {
    console.log('[Occupancy] fetchOccupancy called, flowId:', flowId)
    if (!flowId) return

    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const data = await getFlowOccupancy(flowId)
      console.log('[Occupancy] API response:', data)
      // Handle empty or undefined response
      const occupancy = data || {}
      const total = Object.values(occupancy).reduce(
        (sum, node) => sum + (node?.count ?? 0),
        0
      )
      console.log('[Occupancy] Parsed occupancy:', occupancy, 'total:', total)

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
  }, [flowId])

  // Connect to WebSocket for real-time updates
  const connectWebSocket = useCallback(() => {
    if (!flowId) return

    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close()
    }

    const ws = createOccupancyWebSocket(flowId)

    ws.onopen = () => {
      console.log('[Occupancy WS] Connected')
    }

    ws.onmessage = (event) => {
      try {
        const message: WebSocketEvent = JSON.parse(event.data)
        console.log('[Occupancy WS] Received message:', message)

        if (message.type === 'occupancy_update') {
          console.log('[Occupancy WS] Updating state with:', message.data)
          setState((prev) => ({
            ...prev,
            occupancy: message.data.occupancy,
            totalLeads: message.data.total_leads,
          }))
        }
        // Note: node_change events are followed by occupancy_update with full data,
        // so no need to fetch separately (which could cause race conditions)
      } catch (err) {
        console.error('[Occupancy WS] Parse error:', err)
      }
    }

    ws.onerror = (error) => {
      console.error('[Occupancy WS] Error:', error)
    }

    ws.onclose = () => {
      console.log('[Occupancy WS] Disconnected')
      // Reconnect after 5 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connectWebSocket()
      }, 5000)
    }

    wsRef.current = ws
  }, [flowId])

  // Initial fetch and WebSocket connection
  useEffect(() => {
    console.log('[Occupancy] useEffect triggered, flowId:', flowId)
    if (flowId) {
      console.log('[Occupancy] flowId is truthy, starting fetch and WS')
      fetchOccupancy()
      connectWebSocket()
    } else {
      console.log('[Occupancy] flowId is null/undefined, skipping')
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [flowId, fetchOccupancy, connectWebSocket])

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

  return {
    occupancy: state.occupancy,
    totalLeads: state.totalLeads,
    isLoading: state.isLoading,
    error: state.error,
    getNodeCount,
    getLeadsOnNode,
    refresh: fetchOccupancy,
  }
}
