import { useState, useRef, useEffect } from 'react'
import { Phone, Plus, X, Users, ChevronDown, Loader2 } from 'lucide-react'
import { useFlowStore } from '@/stores/flowStore'
import { getActiveFlow, updateFlow } from '@/services/api'

/**
 * Format phone number to display format
 */
function formatPhone(phone: string): string {
  // Remove non-digits
  const digits = phone.replace(/\D/g, '')

  // Format Brazilian phone: +55 (11) 99999-9999
  if (digits.length === 13 && digits.startsWith('55')) {
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`
  }
  if (digits.length === 12 && digits.startsWith('55')) {
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 8)}-${digits.slice(8)}`
  }

  // Return original if can't format
  return phone
}

/**
 * Normalize phone number to storage format (digits only with country code)
 */
function normalizePhone(phone: string): string {
  // Remove non-digits
  let digits = phone.replace(/\D/g, '')

  // Add Brazil country code if not present
  if (digits.length === 11 || digits.length === 10) {
    digits = '55' + digits
  }

  return digits
}

export default function FlowDefaultsMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [newPhone, setNewPhone] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const phoneWhitelist = useFlowStore((state) => state.phoneWhitelist)
  const setFlowMeta = useFlowStore((state) => state.setFlowMeta)
  const flowId = useFlowStore((state) => state.flowId)

  // Auto-save phone whitelist to backend
  const savePhoneWhitelist = async (newWhitelist: string[]) => {
    if (!flowId) {
      setError('Salve o fluxo primeiro')
      return false
    }

    setIsSaving(true)
    try {
      await updateFlow(flowId, { phone_whitelist: newWhitelist })
      setFlowMeta({ phoneWhitelist: newWhitelist })
      return true
    } catch (err) {
      console.error('Failed to save phone whitelist:', err)
      setError('Erro ao salvar')
      return false
    } finally {
      setIsSaving(false)
    }
  }

  // Check if this flow is the global active flow
  const [isGlobalActive, setIsGlobalActive] = useState(false)

  useEffect(() => {
    // Fetch active flow status
    const checkActiveFlow = async () => {
      try {
        const data = await getActiveFlow()
        setIsGlobalActive(data.active_flow_id === flowId && flowId !== null)
      } catch {
        // Ignore errors
      }
    }
    checkActiveFlow()
  }, [flowId])

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleAddPhone = async () => {
    setError('')

    if (!newPhone.trim()) {
      setError('Digite um número de telefone')
      return
    }

    const normalized = normalizePhone(newPhone)

    // Validate phone length (Brazilian format: 55 + DDD + 8-9 digits)
    if (normalized.length < 12 || normalized.length > 13) {
      setError('Número de telefone inválido')
      return
    }

    // Check for duplicates
    if (phoneWhitelist.includes(normalized)) {
      setError('Este número já está na lista')
      return
    }

    const success = await savePhoneWhitelist([...phoneWhitelist, normalized])
    if (success) {
      setNewPhone('')
    }
  }

  const handleRemovePhone = async (phone: string) => {
    await savePhoneWhitelist(phoneWhitelist.filter(p => p !== phone))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddPhone()
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isGlobalActive}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
          isGlobalActive
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : phoneWhitelist.length > 0
              ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
        title={isGlobalActive
          ? 'Desative o fluxo global para usar lista de telefones'
          : 'Definir fluxo padrão por telefone'
        }
      >
        <Users className="w-4 h-4" />
        {phoneWhitelist.length > 0 && (
          <span className="text-sm font-medium">{phoneWhitelist.length}</span>
        )}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && !isGlobalActive && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-medium text-gray-900 mb-1">Fluxo Padrão por Telefone</h3>
            <p className="text-xs text-gray-500">
              Adicione telefones que usarão este fluxo como padrão. Se o fluxo for ativado globalmente, esta lista será ignorada.
            </p>
          </div>

          {/* Add phone input */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex gap-2">
              <div className="flex-1">
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="(11) 99999-9999"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                  />
                </div>
                {error && (
                  <p className="mt-1 text-xs text-red-500">{error}</p>
                )}
              </div>
              <button
                type="button"
                onClick={handleAddPhone}
                disabled={isSaving}
                className="px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Phone list */}
          <div className="max-h-60 overflow-y-auto">
            {phoneWhitelist.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                Nenhum telefone adicionado
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {phoneWhitelist.map((phone) => (
                  <li key={phone} className="flex items-center justify-between px-4 py-2 hover:bg-gray-50">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{formatPhone(phone)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePhone(phone)}
                      className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {phoneWhitelist.length > 0 && (
            <div className="p-3 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-500 text-center">
                {phoneWhitelist.length} {phoneWhitelist.length === 1 ? 'telefone' : 'telefones'} configurado{phoneWhitelist.length === 1 ? '' : 's'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
