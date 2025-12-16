import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { MessageCircle, Clock } from 'lucide-react'
import type { CustomNode } from '@/types/flow'
import VariableTextDisplay from '@/components/ui/VariableTextDisplay'

function WaitResponseNode({ data, selected }: NodeProps<CustomNode>) {
  const content = (data.content as string) || ''

  return (
    <div
      className={`
        min-w-[200px] max-w-[280px] rounded-lg shadow-md bg-white border-2
        ${selected ? 'border-amber-500' : 'border-gray-200'}
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-amber-500 border-2 border-white"
      />

      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border-b border-gray-200 rounded-t-lg">
        <MessageCircle className="w-4 h-4 text-amber-600" />
        <span className="font-medium text-sm text-amber-800">
          {(data.label as string) || 'Wait Response'}
        </span>
      </div>

      <div className="px-3 py-2 space-y-2">
        {content && (
          <div className="text-sm text-gray-600 line-clamp-2">
            <VariableTextDisplay value={content} />
          </div>
        )}

        {data.variable_name && (
          <div className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded">
            <span>Save to:</span>
            <code className="font-mono bg-amber-100 px-1 rounded">
              {'{{'}{data.variable_name as string}{'}}'}
            </code>
          </div>
        )}

        {data.timeout_seconds && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>Timeout: {data.timeout_seconds as number}s</span>
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-amber-500 border-2 border-white"
      />

      {data.timeout_next_node_id && (
        <Handle
          type="source"
          position={Position.Right}
          id="timeout"
          className="w-2.5 h-2.5 bg-amber-300 border-2 border-white"
        />
      )}
    </div>
  )
}

export default memo(WaitResponseNode)
