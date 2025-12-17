import type { CustomNode, FlowButtonOption } from '@/types/flow'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { LayoutGrid } from 'lucide-react'
import { memo } from 'react'
import VariableTextDisplay from '@/components/ui/VariableTextDisplay'

function ButtonNode({ data, selected }: NodeProps<CustomNode>) {
  const buttons = (data.buttons as FlowButtonOption[] | undefined) ?? []
  const content = (data.content as string) || ''

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
              {button.description && (
                <span className="text-purple-600 text-xs block truncate">{button.description}</span>
              )}
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
