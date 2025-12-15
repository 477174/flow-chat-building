import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { GitBranch } from 'lucide-react'
import type { CustomNode, FlowCondition } from '@/types/flow'

function ConditionalNode({ data, selected }: NodeProps<CustomNode>) {
  const conditions = (data.conditions as FlowCondition[] | undefined) ?? []

  return (
    <div
      className={`
        min-w-[220px] max-w-[300px] rounded-lg shadow-md bg-white border-2
        ${selected ? 'border-teal-500' : 'border-gray-200'}
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-teal-500 border-2 border-white"
      />

      <div className="flex items-center gap-2 px-3 py-2 bg-teal-50 border-b border-gray-200 rounded-t-lg">
        <GitBranch className="w-4 h-4 text-teal-600" />
        <span className="font-medium text-sm text-teal-800">
          {(data.label as string) || 'Condition'}
        </span>
      </div>

      <div className="p-2 space-y-1">
        {conditions.length > 0 ? (
          conditions.map((condition: FlowCondition, index: number) => (
            <div
              key={condition.id}
              className="relative flex items-center justify-between px-3 py-1.5 bg-teal-50 rounded text-xs"
            >
              <span className="text-teal-800 font-mono">
                {condition.variable} {condition.operator} {condition.value ?? ''}
              </span>
              <Handle
                type="source"
                position={Position.Right}
                id={condition.id}
                className="w-2.5 h-2.5 bg-teal-500 border-2 border-white !right-[-8px]"
                style={{ top: `${(index + 1) * 28 + 12}px` }}
              />
            </div>
          ))
        ) : (
          <p className="text-xs text-gray-400 text-center py-1">
            No conditions added
          </p>
        )}
      </div>

      <div className="px-3 py-1.5 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-500">Default</span>
        <Handle
          type="source"
          position={Position.Bottom}
          id="default"
          className="w-3 h-3 bg-teal-300 border-2 border-white !relative !transform-none !inset-auto"
        />
      </div>
    </div>
  )
}

export default memo(ConditionalNode)
