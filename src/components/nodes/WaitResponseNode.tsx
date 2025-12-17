import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Timer, Clock, MessageSquare } from 'lucide-react'
import type { CustomNode } from '@/types/flow'

function WaitResponseNode({ data, selected }: NodeProps<CustomNode>) {
  const hasTimeout = Boolean(data.timeout_seconds)

  return (
    <div
      className={`
        min-w-[200px] max-w-[260px] rounded-lg shadow-md bg-white border-2
        ${selected ? 'border-amber-500' : 'border-gray-200'}
      `}
    >
      {/* Top handle - input */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-amber-500 border-2 border-white"
      />

      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border-b border-gray-200 rounded-t-lg">
        <Timer className="w-4 h-4 text-amber-600" />
        <span className="font-medium text-sm text-amber-800">
          {(data.label as string) || 'Aguardar Resposta'}
        </span>
      </div>

      <div className="px-3 py-2 space-y-2">
        {/* Timeout indicator */}
        {hasTimeout ? (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>
              Timeout: {formatTimeout(data.timeout_seconds as number)}
            </span>
          </div>
        ) : (
          <div className="text-xs text-gray-400 italic">
            Configure o timeout no painel
          </div>
        )}

        {/* Output labels */}
        <div className="flex justify-between text-xs pt-1 border-t border-gray-100">
          <div className="flex items-center gap-1 text-green-600">
            <MessageSquare className="w-3 h-3" />
            <span>Resposta</span>
          </div>
          {hasTimeout && (
            <div className="flex items-center gap-1 text-red-500">
              <Clock className="w-3 h-3" />
              <span>Timeout</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom handle - response path (user responded) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="response"
        className="w-3 h-3 bg-green-500 border-2 border-white"
        title="Caminho se usuário responder"
      />

      {/* Right handle - timeout path (only shown when timeout is configured) */}
      {hasTimeout && (
        <Handle
          type="source"
          position={Position.Right}
          id="timeout"
          className="!absolute !right-0 !top-1/2 !-translate-y-1/2 !translate-x-1/2 w-3 h-3 bg-red-500 border-2 border-white"
          title="Caminho se timeout"
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
