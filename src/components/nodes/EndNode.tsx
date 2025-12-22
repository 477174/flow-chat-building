import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Square } from 'lucide-react'
import type { CustomNode } from '@/types/flow'
import OccupancyBadge from '@/components/ui/OccupancyBadge'
import { useNodeOccupancy } from '@/hooks/useOccupancyContext'

function EndNode({ id, selected }: NodeProps<CustomNode>) {
  const occupancyCount = useNodeOccupancy(id)

  return (
    <div
      className={`
        relative flex items-center gap-2 px-4 py-2 rounded-full
        bg-red-500 text-white shadow-md
        ${selected ? 'ring-2 ring-red-300 ring-offset-2' : ''}
      `}
    >
      <OccupancyBadge count={occupancyCount} />
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-red-700 border-2 border-white"
      />
      <Square className="w-4 h-4" />
      <span className="font-medium">Fim</span>
    </div>
  )
}

export default memo(EndNode)
