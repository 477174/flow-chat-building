import { X, Trash2, Plus, ChevronDown, ChevronRight, Users, Phone } from 'lucide-react'
import { useState, useMemo } from 'react'
import { v4 as uuid } from 'uuid'
import { useFlowStore } from '@/stores/flowStore'
import {
  FlowMessageType,
  FlowConditionOperator,
  type FlowButtonOption,
  type FlowCondition,
  type FlowListOption,
  type TimeoutUnit,
} from '@/types/flow'
import { useAvailableVariables, type AvailableVariable } from '@/hooks/useAvailableVariables'
import { useNodeLeads } from '@/hooks/useOccupancyContext'
import VariableTextEditor from './VariableTextEditor'
import VariablePanel from './VariablePanel'
import ComboboxInput, { type ComboboxOption } from './ComboboxInput'

export default function NodePanel() {
  const { nodes, selectedNodeId, updateNodeData, deleteNode, togglePanel } =
    useFlowStore()
  const [showVariablePanel, setShowVariablePanel] = useState(false)
  const [showLeadsSection, setShowLeadsSection] = useState(true)

  const node = nodes.find((n) => n.id === selectedNodeId)
  const availableVariables = useAvailableVariables(selectedNodeId)

  // Get leads from context (no API calls needed)
  const leads = useNodeLeads(selectedNodeId ?? '')

  if (!node) return null

  const { data, type } = node

  return (
    <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-800">Editar Bloco</h2>
        <button
          onClick={() => togglePanel(false)}
          className="p-1 text-gray-400 hover:text-gray-600 rounded"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Leads on this node section */}
        {leads.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg">
            <button
              type="button"
              onClick={() => setShowLeadsSection(!showLeadsSection)}
              className="w-full flex items-center justify-between p-3"
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  {leads.length} lead{leads.length !== 1 ? 's' : ''} neste bloco
                </span>
              </div>
              {showLeadsSection ? (
                <ChevronDown className="w-4 h-4 text-green-600" />
              ) : (
                <ChevronRight className="w-4 h-4 text-green-600" />
              )}
            </button>

            {showLeadsSection && (
              <div className="px-3 pb-3 space-y-1">
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {leads.map((lead) => (
                    <div
                      key={lead.phone}
                      className="flex items-center gap-2 px-2 py-1.5 bg-white rounded border border-green-100"
                    >
                      <Phone className="w-3 h-3 text-green-500 flex-shrink-0" />
                      <span className="text-sm font-mono text-gray-700">
                        {lead.phone}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Label */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Título
          </label>
          <input
            type="text"
            value={data.label ?? ''}
            onChange={(e) => updateNodeData(node.id, { label: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Message content (for message, button, option_list) */}
        {(type === 'message' || type === 'button' || type === 'option_list') && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Conteúdo da Mensagem
              </label>
              <VariableTextEditor
                value={data.content ?? ''}
                onChange={(content) => updateNodeData(node.id, { content })}
                availableVariables={availableVariables}
                placeholder="Digite sua mensagem..."
                rows={4}
              />
            </div>

            {type === 'message' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Mensagem
                </label>
                <select
                  value={data.message_type ?? 'text'}
                  onChange={(e) =>
                    updateNodeData(node.id, {
                      message_type: e.target.value as FlowMessageType,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="text">Texto</option>
                  <option value="image">Imagem</option>
                  <option value="audio">Áudio</option>
                  <option value="video">Vídeo</option>
                  <option value="document">Documento</option>
                </select>
              </div>
            )}

            {data.message_type && data.message_type !== 'text' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL da Mídia
                </label>
                <input
                  type="url"
                  value={data.media_url ?? ''}
                  onChange={(e) =>
                    updateNodeData(node.id, { media_url: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://..."
                />
              </div>
            )}
          </>
        )}

        {/* Delay Configuration (for wait_response/delay node) */}
        {type === 'wait_response' && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Configuração de Atraso</h4>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Duração</label>
                <input
                  type="number"
                  min="1"
                  value={data.timeout_value ?? ''}
                  onChange={(e) => {
                    const value = e.target.value ? parseInt(e.target.value) : undefined
                    const unit = (data.timeout_unit as TimeoutUnit) ?? 'seconds'
                    updateNodeData(node.id, {
                      timeout_value: value,
                      timeout_seconds: value ? convertToSeconds(value, unit) : undefined,
                    })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="5"
                />
              </div>
              <div className="w-28">
                <label className="block text-xs text-gray-500 mb-1">Unidade</label>
                <select
                  value={data.timeout_unit ?? 'seconds'}
                  onChange={(e) => {
                    const unit = e.target.value as TimeoutUnit
                    const value = data.timeout_value as number | undefined
                    updateNodeData(node.id, {
                      timeout_unit: unit,
                      timeout_seconds: value ? convertToSeconds(value, unit) : undefined,
                    })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="seconds">Segundos</option>
                  <option value="minutes">Minutos</option>
                  <option value="hours">Horas</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Variable name (for nodes that capture variables) */}
        {(type === 'button' || type === 'option_list') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome da Variável
            </label>
            <input
              type="text"
              value={data.variable_name ?? ''}
              onChange={(e) =>
                updateNodeData(node.id, { variable_name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ex: resposta_cliente"
            />
            <p className="mt-1 text-xs text-gray-500">
              Identificador da variável capturada neste bloco
            </p>
          </div>
        )}

        {/* Buttons (for button node) */}
        {type === 'button' && (
          <ButtonsEditor
            buttons={data.buttons ?? []}
            onChange={(buttons) => updateNodeData(node.id, { buttons })}
          />
        )}

        {/* Option List (for option_list node) */}
        {type === 'option_list' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título da Lista
              </label>
              <input
                type="text"
                value={data.list_title ?? ''}
                onChange={(e) =>
                  updateNodeData(node.id, { list_title: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Selecione uma opção"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Texto do Botão
              </label>
              <input
                type="text"
                value={data.list_button_label ?? ''}
                onChange={(e) =>
                  updateNodeData(node.id, { list_button_label: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Selecionar"
              />
            </div>

            <OptionsEditor
              options={data.options ?? []}
              onChange={(options) => updateNodeData(node.id, { options })}
            />
          </>
        )}

        {/* Conditions (for conditional node) */}
        {type === 'conditional' && (
          <ConditionsEditor
            conditions={data.conditions ?? []}
            onChange={(conditions) => updateNodeData(node.id, { conditions })}
            availableVariables={availableVariables}
          />
        )}

        {/* Smart Understanding Toggle (for button, option_list) */}
        {(type === 'button' || type === 'option_list') && (
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="text-sm font-medium text-gray-700">Entendimento Inteligente</h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Usa IA para interpretar respostas em texto
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.smart_understanding_enabled === true}
                  onChange={(e) => {
                    updateNodeData(node.id, { smart_understanding_enabled: e.target.checked })
                  }}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-violet-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-500"></div>
              </label>
            </div>

            {data.smart_understanding_enabled && (
              <p className="text-xs text-violet-600 bg-violet-50 p-2 rounded">
                Quando ativado, se o usuário responder com texto livre ao invés de clicar em uma opção, a IA irá interpretar a resposta e selecionar a opção mais adequada automaticamente.
              </p>
            )}
          </div>
        )}

        {/* Timeout Configuration (for message, button, option_list) */}
        {(type === 'message' || type === 'button' || type === 'option_list') && (
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700">Timeout</h4>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.timeout_enabled === true}
                  onChange={(e) => {
                    // Only toggle timeout_enabled, preserve other values
                    updateNodeData(node.id, { timeout_enabled: e.target.checked })
                  }}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-500"></div>
              </label>
            </div>

            {data.timeout_enabled && (
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Duração</label>
                  <input
                    type="number"
                    min="1"
                    value={data.timeout_value ?? ''}
                    onChange={(e) => {
                      const value = e.target.value ? parseInt(e.target.value) : undefined
                      const unit = (data.timeout_unit as TimeoutUnit) ?? 'minutes'
                      updateNodeData(node.id, {
                        timeout_value: value,
                        timeout_seconds: value ? convertToSeconds(value, unit) : undefined,
                      })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="5"
                  />
                </div>
                <div className="w-28">
                  <label className="block text-xs text-gray-500 mb-1">Unidade</label>
                  <select
                    value={data.timeout_unit ?? 'minutes'}
                    onChange={(e) => {
                      const unit = e.target.value as TimeoutUnit
                      const value = data.timeout_value as number | undefined
                      updateNodeData(node.id, {
                        timeout_unit: unit,
                        timeout_seconds: value ? convertToSeconds(value, unit) : undefined,
                      })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="seconds">Segundos</option>
                    <option value="minutes">Minutos</option>
                    <option value="hours">Horas</option>
                  </select>
                </div>
              </div>
            )}

            {data.timeout_enabled && data.timeout_value && (
              <p className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                Conecte a saída de timeout ao destino do fluxo após {data.timeout_value as number} {(data.timeout_unit as string) || 'minutos'}.
              </p>
            )}
          </div>
        )}

        {/* Delete button */}
        {type !== 'start' && (
          <button
            onClick={() => deleteNode(node.id)}
            className="flex items-center justify-center gap-2 w-full px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
          >
            <Trash2 className="w-4 h-4" />
            Excluir Bloco
          </button>
        )}

        {/* Variable Transforms Section */}
        {availableVariables.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={() => setShowVariablePanel(!showVariablePanel)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 mb-3"
            >
              {showVariablePanel ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              Transformações de Variáveis
            </button>
            {showVariablePanel && (
              <VariablePanel
                availableVariables={availableVariables}
                nodeId={selectedNodeId}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function ButtonsEditor({
  buttons,
  onChange,
}: {
  buttons: FlowButtonOption[]
  onChange: (buttons: FlowButtonOption[]) => void
}) {
  const addButton = () => {
    onChange([
      ...buttons,
      { id: uuid(), label: `Botão ${buttons.length + 1}` },
    ])
  }

  const updateButton = (id: string, updates: Partial<FlowButtonOption>) => {
    onChange(buttons.map((b) => (b.id === id ? { ...b, ...updates } : b)))
  }

  const removeButton = (id: string) => {
    onChange(buttons.filter((b) => b.id !== id))
  }

  return (
    <div>
      <span className="block text-sm font-medium text-gray-700 mb-2">
        Botões ({buttons.length}/3)
      </span>
      <div className="space-y-2">
        {buttons.map((button) => (
          <div
            key={button.id}
            className="p-2 bg-gray-50 rounded-lg space-y-2"
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={button.label}
                onChange={(e) => updateButton(button.id, { label: e.target.value })}
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                placeholder="Texto do botão"
              />
              <button
                type="button"
                onClick={() => removeButton(button.id)}
                className="p-1 text-red-500 hover:bg-red-50 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {buttons.length < 3 && (
          <button
            type="button"
            onClick={addButton}
            className="flex items-center justify-center gap-1 w-full px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
          >
            <Plus className="w-4 h-4" />
            Adicionar Botão
          </button>
        )}
      </div>
    </div>
  )
}

function ConditionsEditor({
  conditions,
  onChange,
  availableVariables,
}: {
  conditions: FlowCondition[]
  onChange: (conditions: FlowCondition[]) => void
  availableVariables: AvailableVariable[]
}) {
  // Convert available variables to combobox options (show label, store name)
  const variableOptions: ComboboxOption[] = useMemo(() => {
    return availableVariables.map((v) => ({
      value: v.name,
      label: v.sourceNodeLabel,
    }))
  }, [availableVariables])

  // Get value suggestions for a specific variable based on its possibleValues
  const getValueSuggestionsForVariable = (variableName: string): ComboboxOption[] => {
    const variable = availableVariables.find((v) => v.name === variableName)
    if (!variable || !variable.possibleValues) return []

    return variable.possibleValues.map((pv) => ({
      value: pv.label,
      label: pv.label,
    }))
  }

  const addCondition = () => {
    onChange([
      ...conditions,
      {
        id: uuid(),
        variable: '',
        operator: FlowConditionOperator.EQUALS,
        value: '',
      },
    ])
  }

  const updateCondition = (id: string, updates: Partial<FlowCondition>) => {
    onChange(conditions.map((c) => (c.id === id ? { ...c, ...updates } : c)))
  }

  const removeCondition = (id: string) => {
    onChange(conditions.filter((c) => c.id !== id))
  }

  return (
    <div>
      <span className="block text-sm font-medium text-gray-700 mb-2">
        Condições
      </span>
      <div className="space-y-2">
        {conditions.map((condition) => (
          <div key={condition.id} className="p-2 bg-gray-50 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <ComboboxInput
                value={condition.variable}
                onChange={(value) => {
                  const variable = availableVariables.find((v) => v.name === value)
                  updateCondition(condition.id, {
                    variable: value,
                    variableLabel: variable?.sourceNodeLabel || value,
                  })
                }}
                options={variableOptions}
                placeholder="Variável"
                className="flex-1 min-w-0"
              />
              <button
                type="button"
                onClick={() => removeCondition(condition.id)}
                className="p-1 text-red-500 hover:bg-red-50 rounded flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={condition.operator}
                onChange={(e) =>
                  updateCondition(condition.id, {
                    operator: e.target.value as FlowConditionOperator,
                  })
                }
                className="w-24 flex-shrink-0 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="equals">igual a</option>
                <option value="not_equals">diferente de</option>
                <option value="contains">contém</option>
                <option value="not_contains">não contém</option>
                <option value="starts_with">começa com</option>
                <option value="ends_with">termina com</option>
                <option value="exists">existe</option>
                <option value="not_exists">não existe</option>
                <option value="regex">regex</option>
              </select>
              {!['exists', 'not_exists'].includes(condition.operator) && (
                <ComboboxInput
                  value={condition.value ?? ''}
                  onChange={(value) => updateCondition(condition.id, { value })}
                  options={getValueSuggestionsForVariable(condition.variable)}
                  placeholder="Valor"
                  className="flex-1 min-w-0"
                />
              )}
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={addCondition}
          className="flex items-center justify-center gap-1 w-full px-3 py-2 text-sm text-teal-600 bg-teal-50 rounded-lg hover:bg-teal-100"
        >
          <Plus className="w-4 h-4" />
          Adicionar Condição
        </button>
      </div>
    </div>
  )
}

function OptionsEditor({
  options,
  onChange,
}: {
  options: FlowListOption[]
  onChange: (options: FlowListOption[]) => void
}) {
  const addOption = () => {
    onChange([
      ...options,
      { id: uuid(), title: `Opção ${options.length + 1}`, description: '' },
    ])
  }

  const updateOption = (id: string, updates: Partial<FlowListOption>) => {
    onChange(options.map((o) => (o.id === id ? { ...o, ...updates } : o)))
  }

  const removeOption = (id: string) => {
    onChange(options.filter((o) => o.id !== id))
  }

  return (
    <div>
      <span className="block text-sm font-medium text-gray-700 mb-2">
        Opções ({options.length}/10)
      </span>
      <div className="space-y-2">
        {options.map((option) => (
          <div
            key={option.id}
            className="p-2 bg-gray-50 rounded-lg space-y-2"
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={option.title}
                onChange={(e) => updateOption(option.id, { title: e.target.value })}
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                placeholder="Título da opção"
              />
              <button
                type="button"
                onClick={() => removeOption(option.id)}
                className="p-1 text-red-500 hover:bg-red-50 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              type="text"
              value={option.description ?? ''}
              onChange={(e) => updateOption(option.id, { description: e.target.value })}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              placeholder="Descrição (opcional)"
            />
          </div>
        ))}
        {options.length < 10 && (
          <button
            type="button"
            onClick={addOption}
            className="flex items-center justify-center gap-1 w-full px-3 py-2 text-sm text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100"
          >
            <Plus className="w-4 h-4" />
            Adicionar Opção
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * Convert timeout value to seconds based on unit
 */
function convertToSeconds(value: number, unit: TimeoutUnit): number {
  switch (unit) {
    case 'minutes':
      return value * 60
    case 'hours':
      return value * 3600
    default:
      return value
  }
}
