import { memo, useMemo } from 'react'
import { type Edge, type EdgeProps, getBezierPath } from '@xyflow/react'

interface ColoredEdgeData extends Record<string, unknown> {
  strokeColor?: string
  strokeWidth?: number
}

type ColoredEdge = Edge<ColoredEdgeData>

/**
 * Colored bezier edge component with selection styling
 */
function ColoredEdgeComponent(props: EdgeProps<ColoredEdge>) {
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

  // Calculate bezier path
  const edgePath = useMemo(() => {
    const [path] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    })
    return path
  }, [sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition])

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

// Memoize the entire component - keep export name for compatibility
export const SmartColoredEdge = memo(ColoredEdgeComponent)
