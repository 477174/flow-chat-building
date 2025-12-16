import { useMemo } from 'react'
import { textToSegments } from '@/utils/variableUtils'
import { useFlowStore } from '@/stores/flowStore'

interface VariableTextDisplayProps {
  value: string
  className?: string
}

/**
 * Read-only display of text with variable chips
 * Variables in {{name}} format are rendered as styled inline chips
 * Looks up node labels from the flow store
 */
export default function VariableTextDisplay({
  value,
  className = '',
}: VariableTextDisplayProps) {
  const nodes = useFlowStore((state) => state.nodes)

  const segments = useMemo(() => textToSegments(value), [value])

  // Create a map of node IDs to labels for quick lookup
  const nodeLabels = useMemo(() => {
    const map = new Map<string, string>()
    for (const node of nodes) {
      const label = (node.data.label as string) || node.id
      map.set(node.id, label)
    }
    return map
  }, [nodes])

  if (!value) {
    return <span className={`text-gray-400 italic ${className}`}>No content</span>
  }

  return (
    <span className={`${className}`}>
      {segments.map((segment, index) => {
        if (segment.type === 'text') {
          return <span key={index}>{segment.content}</span>
        }

        const label = nodeLabels.get(segment.name) || segment.name

        return (
          <span
            key={index}
            className="inline-flex items-center px-1.5 py-0.5 mx-0.5 text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200 rounded align-baseline"
          >
            {label}
          </span>
        )
      })}
    </span>
  )
}

export { VariableTextDisplay }
