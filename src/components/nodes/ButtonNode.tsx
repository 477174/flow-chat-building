import { memo, useRef, useState, useLayoutEffect } from 'react'
import { Handle, Position, useUpdateNodeInternals, type NodeProps } from '@xyflow/react'
import { LayoutGrid } from 'lucide-react'
import type { CustomNode, FlowButtonOption } from '@/types/flow'

function ButtonNode({ id, data, selected }: NodeProps<CustomNode>) {
  const buttons = (data.buttons as FlowButtonOption[] | undefined) ?? []
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const [buttonPositions, setButtonPositions] = useState<Map<string, number>>(new Map())
  const updateNodeInternals = useUpdateNodeInternals()

  useLayoutEffect(() => {
    if (!containerRef.current) return

    const containerRect = containerRef.current.getBoundingClientRect()
    const positions = new Map<string, number>()

    buttonRefs.current.forEach((element, buttonId) => {
      if (element) {
        const buttonRect = element.getBoundingClientRect()
        // Calculate center of button relative to container top
        const centerY = buttonRect.top - containerRect.top + buttonRect.height / 2
        positions.set(buttonId, centerY)
      }
    })

    setButtonPositions(positions)
    // Tell React Flow to recalculate handle positions
    updateNodeInternals(id)
  }, [id, buttons, data.content, updateNodeInternals])

  const setButtonRef = (buttonId: string) => (el: HTMLDivElement | null) => {
    if (el) {
      buttonRefs.current.set(buttonId, el)
    } else {
      buttonRefs.current.delete(buttonId)
    }
  }

  return (
    <div
      ref={containerRef}
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
              ref={setButtonRef(button.id)}
              className="flex items-center justify-between px-3 py-1.5 bg-purple-100 rounded text-sm"
            >
              <span className="text-purple-800">{button.label}</span>
            </div>
          ))
        ) : (
          <p className="text-xs text-gray-400 text-center py-1">No buttons added</p>
        )}
      </div>

      {/* Button handles - positioned based on measured button positions */}
      {buttons.map((button: FlowButtonOption) => {
        const topPos = buttonPositions.get(button.id)
        if (topPos === undefined) return null
        return (
          <Handle
            key={button.id}
            type="source"
            position={Position.Right}
            id={button.id}
            className="!w-2.5 !h-2.5 !bg-purple-500 !border-2 !border-white"
            style={{ top: topPos, transform: 'translateY(-50%)' }}
          />
        )
      })}

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
