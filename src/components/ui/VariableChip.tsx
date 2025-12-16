import { X, GripVertical } from 'lucide-react'
import { forwardRef, type DragEvent } from 'react'
import type { AvailableVariable } from '@/utils/variableUtils'

interface VariableChipProps {
  name: string // Node ID - used for {{nodeId}} syntax
  label?: string // Display label - what user sees
  type?: 'inherited' | 'created'
  onRemove?: () => void
  draggable?: boolean
  onDragStart?: (e: DragEvent<HTMLSpanElement>) => void
  onDragEnd?: (e: DragEvent<HTMLSpanElement>) => void
  size?: 'sm' | 'md'
  className?: string
}

/**
 * Visual chip component for displaying variables
 * - Inherited variables: blue/purple background
 * - Created variables: green background
 * - Supports drag-and-drop when draggable=true
 * - Shows remove button when onRemove is provided
 */
const VariableChip = forwardRef<HTMLSpanElement, VariableChipProps>(
  (
    {
      name,
      label,
      type = 'inherited',
      onRemove,
      draggable = false,
      onDragStart,
      onDragEnd,
      size = 'md',
      className = '',
    },
    ref
  ) => {
    const displayText = label ?? name
    const baseStyles =
      'inline-flex items-center gap-1 rounded-md font-mono select-none'

    const sizeStyles = {
      sm: 'px-1.5 py-0.5 text-xs',
      md: 'px-2 py-1 text-sm',
    }

    const typeStyles = {
      inherited:
        'bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-150',
      created:
        'bg-green-100 text-green-800 border border-green-200 hover:bg-green-150',
    }

    const handleDragStart = (e: DragEvent<HTMLSpanElement>) => {
      e.dataTransfer.setData('text/plain', `{{${name}}}`)
      e.dataTransfer.setData('application/x-variable', name)
      e.dataTransfer.effectAllowed = 'copy'
      onDragStart?.(e)
    }

    return (
      <span
        ref={ref}
        className={`${baseStyles} ${sizeStyles[size]} ${typeStyles[type]} ${
          draggable ? 'cursor-grab active:cursor-grabbing' : ''
        } ${className}`}
        draggable={draggable}
        onDragStart={draggable ? handleDragStart : undefined}
        onDragEnd={onDragEnd}
      >
        {draggable && (
          <GripVertical className="w-3 h-3 text-current opacity-50" />
        )}
        <span className="truncate max-w-[120px]">{displayText}</span>
        {onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            className="p-0.5 -mr-1 rounded hover:bg-black/10"
            aria-label={`Remove ${displayText} variable`}
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </span>
    )
  }
)

VariableChip.displayName = 'VariableChip'

export default VariableChip

/**
 * Wrapper for draggable chips in the palette
 */
interface DraggableVariableChipProps {
  variable: AvailableVariable
  onDragStart?: (variable: AvailableVariable, e: DragEvent<HTMLSpanElement>) => void
  onDragEnd?: (e: DragEvent<HTMLSpanElement>) => void
}

export function DraggableVariableChip({
  variable,
  onDragStart,
  onDragEnd,
}: DraggableVariableChipProps) {
  const handleDragStart = (e: DragEvent<HTMLSpanElement>) => {
    onDragStart?.(variable, e)
  }

  return (
    <VariableChip
      name={variable.name}
      label={variable.sourceNodeLabel}
      type={variable.type}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      size="sm"
    />
  )
}
