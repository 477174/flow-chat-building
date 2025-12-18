import { getBezierPath, type EdgeProps } from '@xyflow/react'

interface ColoredEdgeData {
  strokeColor?: string
  strokeWidth?: number
}

/**
 * Custom edge component with colored stroke and floating selection border
 * When selected, shows an outer border with a gap between it and the edge
 */
export function ColoredEdge(props: EdgeProps<ColoredEdgeData>) {
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

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  // Get color from data - this comes from useColoredEdges hook
  const strokeColor = data?.strokeColor || '#b1b1b7'
  const strokeWidth = data?.strokeWidth || 2

  // Selection border dimensions - thin black border with gap
  const borderWidth = strokeWidth + 6 // Outer border
  const gapWidth = strokeWidth + 4 // Gap (background color)

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
          {/* Outer border */}
          <path
            d={edgePath}
            fill="none"
            stroke="#000000"
            strokeWidth={borderWidth}
            strokeLinecap="round"
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
        markerEnd={markerEnd}
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
