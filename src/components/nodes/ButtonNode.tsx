import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { LayoutGrid } from 'lucide-react'
import type { CustomNode, FlowButtonOption } from '@/types/flow'

function ButtonNode({ data, selected }: NodeProps<CustomNode>) {
  const buttons = (data.buttons as FlowButtonOption[] | undefined) ?? []

  return (
    <div
      className={`
        min-w-[220px] max-w-[300px] rounded-lg shadow-md bg-white border-2
        ${selected ? 'border-purple-500' : 'border-gray-200'}
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-purple-500 border-2 border-white"
      />

      <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 border-b border-gray-200 rounded-t-lg">
        <LayoutGrid className="w-4 h-4 text-purple-600" />
        <span className="font-medium text-sm text-purple-800">
          {(data.label as string) || 'Buttons'}
        </span>
      </div>

      {data.content && (
        <div className="px-3 py-2 border-b border-gray-100">
          <p className="text-sm text-gray-600 line-clamp-2">{data.content as string}</p>
        </div>
      )}

      <div className="p-2 space-y-1">
        {buttons.length > 0 ? (
          buttons.map((button: FlowButtonOption) => (
            <div
              key={button.id}
              className="relative flex items-center justify-between px-3 py-1.5 bg-purple-100 rounded text-sm"
            >
              <span className="text-purple-800">{button.label}</span>
              <Handle
                type="source"
                position={Position.Right}
                id={button.id}
                className="w-2.5 h-2.5 bg-purple-500 border-2 border-white !absolute !top-1/2 !-translate-y-1/2 !right-[-12px]"
              />
            </div>
          ))
        ) : (
          <p className="text-xs text-gray-400 text-center py-1">No buttons added</p>
        )}
      </div>

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
