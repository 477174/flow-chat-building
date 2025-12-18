import type { CustomNode, FlowListOption } from '@/types/flow'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { List, Clock } from 'lucide-react'
import { memo } from 'react'
import VariableTextDisplay from '@/components/ui/VariableTextDisplay'
import OccupancyBadge from '@/components/ui/OccupancyBadge'
import { useNodeOccupancy } from '@/hooks/useOccupancyContext'

/**
 * Format timeout seconds to human-readable format
 */
function formatTimeout(seconds: number): string {
  if (seconds >= 3600 && seconds % 3600 === 0) {
    const hours = seconds / 3600
    return `${hours} ${hours === 1 ? 'hora' : 'horas'}`
  }
  if (seconds >= 60 && seconds % 60 === 0) {
    const minutes = seconds / 60
    return `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`
  }
  return `${seconds} ${seconds === 1 ? 'segundo' : 'segundos'}`
}

function OptionListNode({ id, data, selected }: NodeProps<CustomNode>) {
  const options = (data.options as FlowListOption[] | undefined) ?? []
  const content = (data.content as string) || ''
  const hasTimeout = data.timeout_enabled && data.timeout_seconds
  const hasTimeoutConfig = data.timeout_seconds != null // Has config even if disabled
  const occupancyCount = useNodeOccupancy(id)

  return (
    <div
      className={`
        relative min-w-[240px] max-w-[320px] rounded-lg shadow-md bg-white border-2
        ${selected ? 'border-indigo-500' : 'border-gray-200'}
      `}
    >
      <OccupancyBadge count={occupancyCount} />
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-indigo-500 border-2 border-white"
      />

      <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border-b border-gray-200 rounded-t-lg">
        <List className="w-4 h-4 text-indigo-600" />
        <span className="font-medium text-sm text-indigo-800">
          {(data.label as string) || 'Lista de Opções'}
        </span>
      </div>

      {content && (
        <div className="px-3 py-2 border-b border-gray-100">
          <div className="text-sm text-gray-600 line-clamp-2">
            <VariableTextDisplay value={content} />
          </div>
        </div>
      )}

      {/* Options */}
      <div className="p-2 space-y-1">
        {options.length > 0 ? (
          options.map((option: FlowListOption) => (
            <div
              key={option.id}
              className="relative px-3 py-1.5 bg-indigo-100 rounded text-sm pr-4"
            >
              <span className="text-indigo-800 block">{option.title}</span>
              {option.description && (
                <span className="text-indigo-600 text-xs block truncate">{option.description}</span>
              )}
              <Handle
                type="source"
                position={Position.Right}
                id={option.id}
                className="!absolute !right-0 !top-1/2 !-translate-y-1/2 !translate-x-1/2 !w-2.5 !h-2.5 !bg-indigo-500 !border-2 !border-white"
              />
            </div>
          ))
        ) : (
          <p className="text-xs text-gray-400 text-center py-1">Nenhuma opção adicionada</p>
        )}
      </div>

      {/* Timeout section - show indicator when enabled, but always render handle if config exists */}
      {hasTimeout && (
        <div className="px-3 py-1.5 border-t border-gray-100 flex items-center justify-between bg-red-50">
          <div className="flex items-center gap-1.5 text-xs text-red-600">
            <Clock className="w-3 h-3" />
            <span>Timeout: {formatTimeout(data.timeout_seconds as number)}</span>
          </div>
          <Handle
            type="source"
            position={Position.Right}
            id="timeout"
            className="!relative !transform-none !inset-auto w-2.5 h-2.5 bg-red-500 border-2 border-white"
          />
        </div>
      )}
      {/* Hidden handle to preserve edges when timeout is disabled but has config */}
      {!hasTimeout && hasTimeoutConfig && (
        <Handle
          type="source"
          position={Position.Right}
          id="timeout"
          className="!absolute !right-0 !top-1/2 !-translate-y-1/2 w-2.5 h-2.5 !bg-transparent !border-0"
        />
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        id="default"
        className="w-3 h-3 bg-indigo-300 border-2 border-white"
      />
    </div>
  )
}

export default memo(OptionListNode)
