import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { GitMerge } from 'lucide-react'
import type { CustomNode } from '@/types/flow'
import OccupancyBadge from '@/components/ui/OccupancyBadge'
import { useNodeOccupancy } from '@/hooks/useOccupancyContext'

function ConnectorNode({ id, data, selected }: NodeProps<CustomNode>) {
  const occupancyCount = useNodeOccupancy(id)

  return (
    <div
      className={`
        relative flex items-center justify-center
        w-12 h-12 rounded-full
        bg-gray-500 text-white shadow-md
        ${selected ? 'ring-2 ring-gray-300 ring-offset-2' : ''}
      `}
    >
      <OccupancyBadge count={occupancyCount} />
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-gray-700 border-2 border-white"
      />
      <GitMerge className="w-5 h-5" />
      <Handle
        type="source"
        position={Position.Bottom}
        id="default"
        className="w-3 h-3 bg-gray-700 border-2 border-white"
      />
    </div>
  )
}

export default memo(ConnectorNode)
