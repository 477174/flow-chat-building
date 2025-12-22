import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Clock } from 'lucide-react'
import type { CustomNode } from '@/types/flow'
import OccupancyBadge from '@/components/ui/OccupancyBadge'
import { useNodeOccupancy } from '@/hooks/useOccupancyContext'

/**
 * Simple delay node - waits for a specified time before continuing
 */
function WaitResponseNode({ id, data, selected }: NodeProps<CustomNode>) {
  const hasDelay = Boolean(data.timeout_seconds)
  const occupancyCount = useNodeOccupancy(id)

  return (
    <div
      className={`
        relative min-w-[160px] max-w-[200px] rounded-lg shadow-md bg-white border-2
        ${selected ? 'border-amber-500' : 'border-gray-200'}
      `}
    >
      <OccupancyBadge count={occupancyCount} />
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-amber-500 border-2 border-white"
      />

      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border-b border-gray-200 rounded-t-lg">
        <Clock className="w-4 h-4 text-amber-600" />
        <span className="font-medium text-sm text-amber-800">
          {(data.label as string) || 'Atraso'}
        </span>
      </div>

      <div className="px-3 py-2">
        {hasDelay ? (
          <div className="flex items-center justify-center gap-2 text-sm text-amber-700">
            <span className="font-medium">{formatDelay(data.timeout_seconds as number)}</span>
          </div>
        ) : (
          <div className="text-xs text-gray-400 italic text-center">
            Configure o atraso
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-amber-500 border-2 border-white"
      />
    </div>
  )
}

/**
 * Format delay seconds to human-readable format
 */
function formatDelay(seconds: number): string {
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

export default memo(WaitResponseNode)
