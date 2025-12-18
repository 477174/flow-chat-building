import type { CustomNode, FlowButtonOption } from '@/types/flow'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { LayoutGrid, Clock } from 'lucide-react'
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

function ButtonNode({ id, data, selected }: NodeProps<CustomNode>) {
  const buttons = (data.buttons as FlowButtonOption[] | undefined) ?? []
  const content = (data.content as string) || ''
  const hasTimeout = data.timeout_enabled && data.timeout_seconds
  const hasTimeoutConfig = data.timeout_seconds != null // Has config even if disabled
  const occupancyCount = useNodeOccupancy(id)

  return (
    <div
      className={`
        relative min-w-[220px] max-w-[300px] rounded-lg shadow-md bg-white border-2
        ${selected ? 'border-purple-500' : 'border-gray-200'}
      `}
    >
      <OccupancyBadge count={occupancyCount} />
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-purple-500 border-2 border-white"
      />

      <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 border-b border-gray-200 rounded-t-lg">
        <LayoutGrid className="w-4 h-4 text-purple-600" />
        <span className="font-medium text-sm text-purple-800">
          {(data.label as string) || 'Botões'}
        </span>
      </div>

      {content && (
        <div className="px-3 py-2 border-b border-gray-100">
          <div className="text-sm text-gray-600 line-clamp-2">
            <VariableTextDisplay value={content} />
          </div>
        </div>
      )}

      <div className="p-2 space-y-1">
        {buttons.length > 0 ? (
          buttons.map((button: FlowButtonOption) => (
            <div
              key={button.id}
              className="relative px-3 py-1.5 bg-purple-100 rounded text-sm pr-4"
            >
              <span className="text-purple-800 block">{button.label}</span>
              <Handle
                type="source"
                position={Position.Right}
                id={button.id}
                className="!absolute !right-0 !top-1/2 !-translate-y-1/2 !translate-x-1/2 !w-2.5 !h-2.5 !bg-purple-500 !border-2 !border-white"
              />
            </div>
          ))
        ) : (
          <p className="text-xs text-gray-400 text-center py-1">Nenhum botão adicionado</p>
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
        className="w-3 h-3 bg-purple-300 border-2 border-white"
      />
    </div>
  )
}

export default memo(ButtonNode)
