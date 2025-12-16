import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import type { AvailableVariable } from '@/utils/variableUtils'

interface VariablePaletteProps {
  variables: AvailableVariable[]
  className?: string
}

/**
 * Horizontal list of draggable variable chips
 * Works with VariableTextEditor's DndContext
 */
export default function VariablePalette({
  variables,
  className = '',
}: VariablePaletteProps) {
  if (variables.length === 0) {
    return (
      <div className={`text-xs text-gray-400 italic py-2 ${className}`}>
        No variables available. Add buttons or option lists upstream to create variables.
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="text-xs font-medium text-gray-500 mb-2">
        Available Variables
        <span className="text-gray-400 font-normal ml-1">
          (drag to insert)
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {variables.map((variable) => (
          <DraggableVariable key={variable.name} variable={variable} />
        ))}
      </div>
    </div>
  )
}

/**
 * Draggable variable chip for the palette
 */
function DraggableVariable({ variable }: { variable: AvailableVariable }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: variable.name,
    data: {
      nodeId: variable.name,
      label: variable.sourceNodeLabel,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-mono rounded-md
        bg-blue-100 text-blue-800 border border-blue-200
        cursor-grab active:cursor-grabbing
        hover:bg-blue-150 select-none
        ${isDragging ? 'shadow-lg ring-2 ring-blue-400' : ''}
      `}
    >
      <GripVertical className="w-3 h-3 text-current opacity-50" />
      <span className="truncate max-w-[120px]">{variable.sourceNodeLabel}</span>
    </div>
  )
}

/**
 * Compact variant
 */
export function CompactVariablePalette({
  variables,
  className = '',
}: {
  variables: AvailableVariable[]
  className?: string
}) {
  if (variables.length === 0) return null

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {variables.map((variable) => (
        <DraggableVariable key={variable.name} variable={variable} />
      ))}
    </div>
  )
}
