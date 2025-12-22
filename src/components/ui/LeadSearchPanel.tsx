import { useState, useCallback } from 'react'
import { Search, User, MapPin, Clock, X, Loader2 } from 'lucide-react'
import { searchLeadByPhone, type LeadSearchResult } from '@/services/api'

interface LeadSearchPanelProps {
  flowId: string | null
  onLeadFound?: (lead: LeadSearchResult) => void
  onClose?: () => void
}

function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`
  }
  if (seconds < 3600) {
    return `${Math.round(seconds / 60)}min`
  }
  const hours = Math.floor(seconds / 3600)
  const mins = Math.round((seconds % 3600) / 60)
  return `${hours}h ${mins}min`
}

export default function LeadSearchPanel({
  flowId,
  onLeadFound,
  onClose,
}: LeadSearchPanelProps) {
  const [phone, setPhone] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [result, setResult] = useState<LeadSearchResult | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = useCallback(async () => {
    if (!phone.trim()) return

    setIsSearching(true)
    setError(null)
    setNotFound(false)
    setResult(null)

    try {
      const response = await searchLeadByPhone(phone, flowId || undefined)

      if (response.found && response.lead) {
        setResult(response.lead)
        onLeadFound?.(response.lead)
      } else {
        setNotFound(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar lead')
    } finally {
      setIsSearching(false)
    }
  }, [phone, flowId, onLeadFound])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 w-80">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-500" />
          <span className="font-medium text-sm">Buscar Lead</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Telefone (ex: 11999887766)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleSearch}
            disabled={isSearching || !phone.trim()}
            className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Busca automática com variações de formato
        </p>
      </div>

      {/* Results */}
      {error && (
        <div className="px-4 pb-4">
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
            {error}
          </div>
        </div>
      )}

      {notFound && (
        <div className="px-4 pb-4">
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-700">
            Nenhum lead encontrado com este telefone
          </div>
        </div>
      )}

      {result && (
        <div className="px-4 pb-4">
          <div className="p-3 bg-green-50 border border-green-200 rounded-md space-y-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                {result.phone}
              </span>
            </div>

            {result.current_node_id && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700">
                  Nó: <code className="bg-green-100 px-1 rounded">{result.current_node_id}</code>
                </span>
              </div>
            )}

            {result.duration_seconds > 0 && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700">
                  Há {formatDuration(result.duration_seconds)} neste nó
                </span>
              </div>
            )}

            {Object.keys(result.variables).length > 0 && (
              <div className="mt-2 pt-2 border-t border-green-200">
                <span className="text-xs font-medium text-green-800">Variáveis:</span>
                <div className="mt-1 space-y-0.5">
                  {Object.entries(result.variables).map(([key, value]) => (
                    <div key={key} className="text-xs text-green-700">
                      <code className="bg-green-100 px-1 rounded">{key}</code>:{' '}
                      {String(value)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
