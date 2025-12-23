import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { MessageSquare, Image, FileAudio, Video, FileText, Clock } from 'lucide-react'
import type { CustomNode, FlowMessageType } from '@/types/flow'
import VariableTextDisplay from '@/components/ui/VariableTextDisplay'
import OccupancyBadge from '@/components/ui/OccupancyBadge'
import { useNodeOccupancy } from '@/hooks/useOccupancyContext'
import { useInViewport } from '@/hooks/useInViewport'

/**
 * Format timeout seconds to human-readable format
 */
function formatTimeout(seconds: number): string {
  if (seconds >= 3600 && seconds % 3600 === 0) {
    const hours = seconds / 3600
    return `${hours} ${hours === 1 ? 'hora' : 'horas'}`
  }
  if (seconds >= 60 && seconds % 60 === 0) {
    const minutes = seconds / 60
    return `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`
  }
  return `${seconds} ${seconds === 1 ? 'segundo' : 'segundos'}`
}

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

function MessageNode({ id, data, selected }: NodeProps<CustomNode>) {
  const messageType = (data.message_type as FlowMessageType) ?? 'text'
  const Icon = messageTypeIcons[messageType]
  const content = (data.content as string) || ''
  const mediaUrl = (data.media_url as string) || ''
  const hasTimeout = data.timeout_enabled && data.timeout_seconds
  const hasTimeoutConfig = data.timeout_seconds != null // Has config even if disabled
  const occupancyCount = useNodeOccupancy(id)

  // Track viewport visibility for lazy loading media
  const [mediaContainerRef, isInViewport] = useInViewport<HTMLDivElement>()

  // Use wider node for media content
  const hasMedia = mediaUrl && (messageType === 'video' || messageType === 'image' || messageType === 'audio')

  const renderMediaPreview = () => {
    if (!mediaUrl) return null

    // Check if it's a Google Drive URL
    const googleDriveEmbedUrl = getGoogleDriveEmbedUrl(mediaUrl)

    // For Google Drive iframes, only render when in viewport
    if (googleDriveEmbedUrl && !isInViewport) {
      return (
        <div ref={mediaContainerRef} className="px-2 pb-2">
          <div className="w-full aspect-square rounded border border-gray-200 bg-gray-100 flex items-center justify-center">
            <div className="text-center text-gray-400 text-xs">
              <Image className="w-6 h-6 mx-auto mb-1" />
              Preview
            </div>
          </div>
        </div>
      )
    }

    switch (messageType) {
      case 'image':
        if (googleDriveEmbedUrl) {
          return (
            <div ref={mediaContainerRef} className="px-2 pb-2">
              <iframe
                src={googleDriveEmbedUrl}
                className="w-full aspect-square rounded border border-gray-200"
                allow="autoplay; fullscreen"
                loading="lazy"
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
                loading="lazy"
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
            <div ref={mediaContainerRef} className="px-2 pb-2">
              <iframe
                src={googleDriveEmbedUrl}
                className="w-full h-20 rounded border border-gray-200"
                allow="autoplay"
                loading="lazy"
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
              preload="none"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
        )
      case 'video':
        if (googleDriveEmbedUrl) {
          return (
            <div ref={mediaContainerRef} className="px-2 pb-2">
              <iframe
                src={googleDriveEmbedUrl}
                className="w-full aspect-square rounded border border-gray-200"
                allow="autoplay; fullscreen"
                loading="lazy"
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
                preload="none"
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
        relative rounded-lg shadow-md bg-white border-2
        ${hasMedia ? 'min-w-[400px] max-w-[480px]' : 'min-w-[200px] max-w-[280px]'}
        ${selected ? 'border-blue-500' : 'border-gray-200'}
      `}
    >
      <OccupancyBadge count={occupancyCount} />
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />

      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border-b border-gray-200 rounded-t-lg">
        <Icon className="w-4 h-4 text-blue-600" />
        <span className="font-medium text-sm text-blue-800">
          {(data.label as string) || 'Mensagem'}
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

      {/* Timeout section - show indicator when enabled, but always render handle if config exists */}
      {hasTimeout && (
        <div className="px-3 py-1.5 border-t border-gray-100 flex items-center justify-between bg-red-50">
          <div className="flex items-center gap-1.5 text-xs text-red-600">
            <Clock className="w-3 h-3" />
            <span>Timeout: {formatTimeout(data.timeout_seconds as number)}</span>
          </div>
          <Handle
            type="source"
            position={Position.Right}
            id="timeout"
            className="!relative !transform-none !inset-auto w-2.5 h-2.5 bg-red-500 border-2 border-white"
          />
        </div>
      )}
      {/* Hidden handle to preserve edges when timeout is disabled but has config */}
      {!hasTimeout && hasTimeoutConfig && (
        <Handle
          type="source"
          position={Position.Right}
          id="timeout"
          className="!absolute !right-0 !top-1/2 !-translate-y-1/2 w-2.5 h-2.5 !bg-transparent !border-0"
        />
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        id="default"
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />
    </div>
  )
}

export default memo(MessageNode)
