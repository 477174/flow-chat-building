import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Timer } from 'lucide-react'
import type { CustomNode } from '@/types/flow'

function WaitResponseNode({ data, selected }: NodeProps<CustomNode>) {
  const hasTimeout = Boolean(data.timeout_seconds)

  return (
    <div
      className={`
        min-w-[180px] max-w-[240px] rounded-lg shadow-md bg-white border-2
        ${selected ? 'border-amber-500' : 'border-gray-200'}
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-amber-500 border-2 border-white"
      />

      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border-b border-gray-200 rounded-t-lg">
        <Timer className="w-4 h-4 text-amber-600" />
        <span className="font-medium text-sm text-amber-800">
          {(data.label as string) || 'Aguardar Timeout'}
        </span>
      </div>

      <div className="px-3 py-2">
        {hasTimeout ? (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>
              {formatTimeout(data.timeout_seconds as number)}
              {data.timeout_cancel_on_response === false && (
                <span className="text-amber-600 text-xs ml-1">(sempre)</span>
              )}
            </span>
          </div>
        ) : (
          <div className="text-xs text-gray-400 italic">
            Configure o timeout no painel
          </div>
        )}
      </div>

      {/* Single output: timeout path (only shown when timeout is configured) */}
      {hasTimeout && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 bg-amber-500 border-2 border-white"
          title="Timeout path"
        />
      )}
    </div>
  )
}

/**
 * Format timeout seconds to human-readable format
 */
function formatTimeout(seconds: number): string {
  if (seconds >= 3600 && seconds % 3600 === 0) {
    return `${seconds / 3600}h`
  }
  if (seconds >= 60 && seconds % 60 === 0) {
    return `${seconds / 60}m`
  }
  return `${seconds}s`
}

export default memo(WaitResponseNode)
