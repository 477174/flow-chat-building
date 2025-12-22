import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Play } from 'lucide-react'
import type { CustomNode } from '@/types/flow'
import OccupancyBadge from '@/components/ui/OccupancyBadge'
import { useNodeOccupancy } from '@/hooks/useOccupancyContext'

function StartNode({ id, selected }: NodeProps<CustomNode>) {
  const occupancyCount = useNodeOccupancy(id)

  return (
    <div
      className={`
        relative flex items-center gap-2 px-4 py-2 rounded-full
        bg-green-500 text-white shadow-md
        ${selected ? 'ring-2 ring-green-300 ring-offset-2' : ''}
      `}
    >
      <OccupancyBadge count={occupancyCount} />
      <Play className="w-4 h-4" />
      <span className="font-medium">Início</span>
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-green-700 border-2 border-white"
      />
    </div>
  )
}

export default memo(StartNode)
