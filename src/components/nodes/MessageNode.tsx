import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { MessageSquare, Image, FileAudio, Video, FileText } from 'lucide-react'
import type { CustomNode, FlowMessageType } from '@/types/flow'
import VariableTextDisplay from '@/components/ui/VariableTextDisplay'

const messageTypeIcons: Record<FlowMessageType, typeof MessageSquare> = {
  text: MessageSquare,
  image: Image,
  audio: FileAudio,
  video: Video,
  document: FileText,
}

function MessageNode({ data, selected }: NodeProps<CustomNode>) {
  const Icon = messageTypeIcons[(data.message_type as FlowMessageType) ?? 'text']
  const content = (data.content as string) || ''

  return (
    <div
      className={`
        min-w-[200px] max-w-[280px] rounded-lg shadow-md bg-white border-2
        ${selected ? 'border-blue-500' : 'border-gray-200'}
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />

      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border-b border-gray-200 rounded-t-lg">
        <Icon className="w-4 h-4 text-blue-600" />
        <span className="font-medium text-sm text-blue-800">
          {(data.label as string) || 'Message'}
        </span>
      </div>

      <div className="px-3 py-2">
        <div className="text-sm text-gray-600 line-clamp-2">
          <VariableTextDisplay value={content} />
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />
    </div>
  )
}

export default memo(MessageNode)
