import { useNodes, type EdgeProps, type Edge } from '@xyflow/react'
import { getSmartEdge, svgDrawSmoothLinePath } from '@tisoap/react-flow-smart-edge'

interface SmartColoredEdgeData extends Record<string, unknown> {
  strokeColor?: string
  strokeWidth?: number
}

type SmartColoredEdge = Edge<SmartColoredEdgeData>

/**
 * Smart edge component that routes around nodes with colored stroke
 * Uses A* pathfinding to avoid intersecting with other nodes
 */
export function SmartColoredEdge(props: EdgeProps<SmartColoredEdge>) {
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

  const nodes = useNodes()

  // Get smart edge path that avoids nodes
  const getSmartEdgeResponse = getSmartEdge({
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

  // Fallback to straight line if smart edge fails or returns an error
  let edgePath: string
  if (getSmartEdgeResponse === null || getSmartEdgeResponse instanceof Error) {
    edgePath = `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`
  } else {
    edgePath = getSmartEdgeResponse.svgPathString
  }

  // Get color from data - this comes from useColoredEdges hook
  const strokeColor = data?.strokeColor ?? '#b1b1b7'
  const strokeWidth = data?.strokeWidth ?? 2

  // Selection border dimensions - thin border with gap
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
          {/* Outer border - same color as edge but less opaque */}
          <path
            d={edgePath}
            fill="none"
            stroke={strokeColor}
            strokeWidth={borderWidth}
            strokeLinecap="round"
            style={{ opacity: 0.4 }}
          />
          {/* Gap - uses background color to create floating effect */}
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
