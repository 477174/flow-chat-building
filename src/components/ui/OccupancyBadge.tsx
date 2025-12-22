import { memo } from 'react'
import { Users } from 'lucide-react'

interface OccupancyBadgeProps {
  count: number
  onClick?: () => void
}

function OccupancyBadge({ count, onClick }: OccupancyBadgeProps) {
  if (count === 0) return null

  return (
    <div
      onClick={onClick}
      className={`
        absolute -top-2 -right-2 z-10
        flex items-center gap-1
        px-1.5 py-0.5
        bg-green-500 text-white
        rounded-full text-xs font-medium
        shadow-md
        ${onClick ? 'cursor-pointer hover:bg-green-600 transition-colors' : ''}
      `}
      title={`${count} lead${count !== 1 ? 's' : ''} neste nó`}
    >
      <Users className="w-3 h-3" />
      <span>{count}</span>
    </div>
  )
}

export default memo(OccupancyBadge)
