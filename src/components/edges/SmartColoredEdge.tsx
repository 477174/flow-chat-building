import { memo, useMemo } from 'react'
import { type Edge, type EdgeProps,type ReactFlowState, useStore } from '@xyflow/react'
import { getSmartEdge, svgDrawSmoothLinePath } from '@tisoap/react-flow-smart-edge'

interface SmartColoredEdgeData extends Record<string, unknown> {
  strokeColor?: string
  strokeWidth?: number
}

type SmartColoredEdge = Edge<SmartColoredEdgeData>

// Selector to get only node positions (not all node data)
// This reduces re-renders by only triggering when positions change
const nodesSelector = (state: ReactFlowState) =>
  state.nodes.map(node => ({
    id: node.id,
    position: node.position,
    width: node.measured?.width ?? node.width ?? 150,
    height: node.measured?.height ?? node.height ?? 40,
  }))

/**
 * Smart edge component that routes around nodes with colored stroke
 * Uses A* pathfinding to avoid intersecting with other nodes
 * Memoized to prevent excessive re-renders
 */
function SmartColoredEdgeComponent(props: EdgeProps<SmartColoredEdge>) {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    markerEnd,
    selected,
  } = props

  // Use selector to only subscribe to position changes
  const nodePositions = useStore(nodesSelector)

  // Memoize the smart edge calculation
  const edgePath = useMemo(() => {
    // Convert minimal node data to format expected by getSmartEdge
    const nodes = nodePositions.map(n => ({
      id: n.id,
      position: n.position,
      width: n.width,
      height: n.height,
      data: {},
      type: 'default',
    }))

    const response = getSmartEdge({
      sourcePosition,
      targetPosition,
      sourceX,
      sourceY,
      targetX,
      targetY,
      nodes,
      options: {
        drawEdge: svgDrawSmoothLinePath,
      },
    })

    // Fallback to straight line if smart edge fails
    if (response === null || response instanceof Error) {
      return `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`
    }
    return response.svgPathString
  }, [nodePositions, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition])

  // Get color from data
  const strokeColor = data?.strokeColor ?? '#b1b1b7'
  const strokeWidth = data?.strokeWidth ?? 2

  // Selection border dimensions
  const borderWidth = strokeWidth + 6
  const gapWidth = strokeWidth + 4

  return (
    <>
      {/* Invisible interaction zone for easier selection */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className="react-flow__edge-interaction"
      />
      {/* Selection border - only visible when selected */}
      {selected && (
        <>
          <path
            d={edgePath}
            fill="none"
            stroke={strokeColor}
            strokeWidth={borderWidth}
            strokeLinecap="round"
            style={{ opacity: 0.4 }}
          />
          <path
            d={edgePath}
            fill="none"
            stroke="#f9fafb"
            strokeWidth={gapWidth}
            strokeLinecap="round"
          />
        </>
      )}
      {/* Main edge */}
      <path
        id={id}
        d={edgePath}
        className="react-flow__edge-path"
        markerEnd={markerEnd as string | undefined}
        style={{
          fill: 'none',
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          strokeLinecap: 'round',
        }}
      />
    </>
  )
}

// Memoize the entire component to prevent re-renders when parent updates
export const SmartColoredEdge = memo(SmartColoredEdgeComponent)
