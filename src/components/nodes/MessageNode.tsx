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

/**
 * Extract Google Drive file ID from various URL formats
 */
const getGoogleDriveFileId = (url: string): string | null => {
  // Format: https://drive.google.com/file/d/{FILE_ID}/...
  const fileMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/)
  if (fileMatch) return fileMatch[1]

  // Format: https://drive.google.com/uc?export=download&id={FILE_ID}
  const ucMatch = url.match(/drive\.google\.com\/uc\?.*id=([^&]+)/)
  if (ucMatch) return ucMatch[1]

  // Format: https://drive.google.com/open?id={FILE_ID}
  const openMatch = url.match(/drive\.google\.com\/open\?id=([^&]+)/)
  if (openMatch) return openMatch[1]

  return null
}

/**
 * Convert Google Drive URL to embeddable preview URL
 * Returns null if not a Google Drive URL
 */
const getGoogleDriveEmbedUrl = (url: string): string | null => {
  const fileId = getGoogleDriveFileId(url)
  if (!fileId) return null
  return `https://drive.google.com/file/d/${fileId}/preview`
}

function MessageNode({ data, selected }: NodeProps<CustomNode>) {
  const messageType = (data.message_type as FlowMessageType) ?? 'text'
  const Icon = messageTypeIcons[messageType]
  const content = (data.content as string) || ''
  const mediaUrl = (data.media_url as string) || ''

  // Use wider node for media content
  const hasMedia = mediaUrl && (messageType === 'video' || messageType === 'image' || messageType === 'audio')

  const renderMediaPreview = () => {
    if (!mediaUrl) return null

    // Check if it's a Google Drive URL - use iframe embed if so
    const googleDriveEmbedUrl = getGoogleDriveEmbedUrl(mediaUrl)

    switch (messageType) {
      case 'image':
        if (googleDriveEmbedUrl) {
          return (
            <div className="px-2 pb-2">
              <iframe
                src={googleDriveEmbedUrl}
                className="w-full aspect-square rounded border border-gray-200"
                allow="autoplay; fullscreen"
                allowFullScreen
                title="Image preview"
              />
            </div>
          )
        }
        return (
          <div className="px-2 pb-2">
            <div className="w-full aspect-square rounded border border-gray-200 overflow-hidden bg-gray-100 flex items-center justify-center">
              <img
                src={mediaUrl}
                alt="Preview"
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          </div>
        )
      case 'audio':
        if (googleDriveEmbedUrl) {
          return (
            <div className="px-2 pb-2">
              <iframe
                src={googleDriveEmbedUrl}
                className="w-full h-20 rounded border border-gray-200"
                allow="autoplay"
                title="Audio preview"
              />
            </div>
          )
        }
        return (
          <div className="px-2 pb-2">
            <audio
              src={mediaUrl}
              controls
              className="w-full"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
        )
      case 'video':
        if (googleDriveEmbedUrl) {
          return (
            <div className="px-2 pb-2">
              <iframe
                src={googleDriveEmbedUrl}
                className="w-full aspect-square rounded border border-gray-200"
                allow="autoplay; fullscreen"
                allowFullScreen
                title="Video preview"
              />
            </div>
          )
        }
        return (
          <div className="px-2 pb-2">
            <div className="w-full aspect-square rounded border border-gray-200 overflow-hidden bg-gray-100 flex items-center justify-center">
              <video
                src={mediaUrl}
                controls
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div
      className={`
        rounded-lg shadow-md bg-white border-2
        ${hasMedia ? 'min-w-[400px] max-w-[480px]' : 'min-w-[200px] max-w-[280px]'}
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

      {content && (
        <div className="px-3 py-2">
          <div className="text-sm text-gray-600">
            <VariableTextDisplay value={content} />
          </div>
        </div>
      )}

      {renderMediaPreview()}

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />
    </div>
  )
}

export default memo(MessageNode)
