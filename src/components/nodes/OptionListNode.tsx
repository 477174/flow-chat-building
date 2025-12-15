import { memo, useRef, useState, useLayoutEffect } from 'react'
import { Handle, Position, useUpdateNodeInternals, type NodeProps } from '@xyflow/react'
import { List } from 'lucide-react'
import type { CustomNode, FlowListOption } from '@/types/flow'

function OptionListNode({ id, data, selected }: NodeProps<CustomNode>) {
  const options = (data.options as FlowListOption[] | undefined) ?? []

  const containerRef = useRef<HTMLDivElement>(null)
  const optionRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const [optionPositions, setOptionPositions] = useState<Map<string, number>>(new Map())
  const updateNodeInternals = useUpdateNodeInternals()

  useLayoutEffect(() => {
    if (!containerRef.current) return

    const containerRect = containerRef.current.getBoundingClientRect()
    const positions = new Map<string, number>()

    optionRefs.current.forEach((element, optionId) => {
      if (element) {
        const optionRect = element.getBoundingClientRect()
        // Calculate center of option relative to container top
        const centerY = optionRect.top - containerRect.top + optionRect.height / 2
        positions.set(optionId, centerY)
      }
    })

    setOptionPositions(positions)
    // Tell React Flow to recalculate handle positions
    updateNodeInternals(id)
  }, [id, options, data.content, updateNodeInternals])

  const setOptionRef = (optionId: string) => (el: HTMLDivElement | null) => {
    if (el) {
      optionRefs.current.set(optionId, el)
    } else {
      optionRefs.current.delete(optionId)
    }
  }

  return (
    <div
      ref={containerRef}
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

      {/* Options */}
      <div className="p-2 space-y-1">
        {options.length > 0 ? (
          options.map((option: FlowListOption) => (
            <div
              key={option.id}
              ref={setOptionRef(option.id)}
              className="flex items-center justify-between px-3 py-1.5 bg-indigo-100 rounded text-sm"
            >
              <span className="text-indigo-800">{option.title}</span>
            </div>
          ))
        ) : (
          <p className="text-xs text-gray-400 text-center py-1">No options added</p>
        )}
      </div>

      {/* Option handles - positioned based on measured option positions */}
      {options.map((option: FlowListOption) => {
        const topPos = optionPositions.get(option.id)
        if (topPos === undefined) return null
        return (
          <Handle
            key={option.id}
            type="source"
            position={Position.Right}
            id={option.id}
            className="!w-2.5 !h-2.5 !bg-indigo-500 !border-2 !border-white"
            style={{ top: topPos, transform: 'translate(50%, -50%)' }}
          />
        )
      })}

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
