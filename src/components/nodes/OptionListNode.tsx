import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { List } from 'lucide-react'
import type { CustomNode, FlowListOption } from '@/types/flow'

function OptionListNode({ data, selected }: NodeProps<CustomNode>) {
  const options = (data.options as FlowListOption[] | undefined) ?? []
  const listTitle = (data.list_title as string) || 'Options'
  const buttonLabel = (data.list_button_label as string) || 'Select'

  return (
    <div
      className={`
        min-w-[240px] max-w-[320px] rounded-lg shadow-md bg-white border-2
        ${selected ? 'border-indigo-500' : 'border-gray-200'}
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-indigo-500 border-2 border-white"
      />

      <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border-b border-gray-200 rounded-t-lg">
        <List className="w-4 h-4 text-indigo-600" />
        <span className="font-medium text-sm text-indigo-800">
          {(data.label as string) || 'Option List'}
        </span>
      </div>

      {data.content && (
        <div className="px-3 py-2 border-b border-gray-100">
          <p className="text-sm text-gray-600 line-clamp-2">{data.content as string}</p>
        </div>
      )}

      {/* List preview */}
      <div className="px-3 py-2 border-b border-gray-100">
        <div className="text-xs text-gray-500 mb-1">List Title</div>
        <div className="text-sm font-medium text-gray-700">{listTitle}</div>
      </div>

      {/* Button that opens the list */}
      <div className="px-3 py-2 border-b border-gray-100">
        <div className="flex items-center justify-center px-3 py-1.5 bg-indigo-100 rounded text-sm text-indigo-700 font-medium">
          {buttonLabel}
        </div>
      </div>

      {/* Options preview */}
      <div className="p-2 space-y-1 max-h-[150px] overflow-y-auto">
        {options.length > 0 ? (
          options.map((option: FlowListOption) => (
            <div
              key={option.id}
              className="relative flex flex-col px-3 py-1.5 bg-indigo-50 rounded text-sm"
            >
              <span className="text-indigo-800 font-medium">{option.title}</span>
              {option.description && (
                <span className="text-xs text-indigo-600">{option.description}</span>
              )}
              <Handle
                type="source"
                position={Position.Right}
                id={option.id}
                className="w-2.5 h-2.5 bg-indigo-500 border-2 border-white !absolute !top-1/2 !-translate-y-1/2 !right-[-12px]"
              />
            </div>
          ))
        ) : (
          <p className="text-xs text-gray-400 text-center py-1">No options added</p>
        )}
      </div>

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
