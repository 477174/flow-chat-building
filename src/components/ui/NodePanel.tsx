import { X, Trash2, Plus, ChevronDown, ChevronRight } from 'lucide-react'
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
import VariableTextEditor from './VariableTextEditor'
import VariablePalette from './VariablePalette'
import VariablePanel from './VariablePanel'
import ComboboxInput, { type ComboboxOption } from './ComboboxInput'

export default function NodePanel() {
  const { nodes, selectedNodeId, updateNodeData, deleteNode, togglePanel } =
    useFlowStore()
  const [showVariablePanel, setShowVariablePanel] = useState(false)

  const node = nodes.find((n) => n.id === selectedNodeId)
  const availableVariables = useAvailableVariables(selectedNodeId)

  if (!node) return null

  const { data, type } = node

  return (
    <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-800">Edit Node</h2>
        <button
          onClick={() => togglePanel(false)}
          className="p-1 text-gray-400 hover:text-gray-600 rounded"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Label */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Label
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
                Message Content
              </label>
              <VariableTextEditor
                value={data.content ?? ''}
                onChange={(content) => updateNodeData(node.id, { content })}
                availableVariables={availableVariables}
                placeholder="Enter your message..."
                rows={4}
              />
              {availableVariables.length > 0 && (
                <VariablePalette
                  variables={availableVariables}
                  className="mt-2"
                />
              )}
            </div>

            {type === 'message' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message Type
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
                  <option value="text">Text</option>
                  <option value="image">Image</option>
                  <option value="audio">Audio</option>
                  <option value="video">Video</option>
                  <option value="document">Document</option>
                </select>
              </div>
            )}

            {data.message_type && data.message_type !== 'text' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Media URL
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

        {/* Timeout Configuration (for wait_response) */}
        {type === 'wait_response' && (
          <>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Timeout Settings</h4>

              {/* Duration + Unit */}
              <div className="flex gap-2 mb-3">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Duration</label>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="5"
                  />
                </div>
                <div className="w-28">
                  <label className="block text-xs text-gray-500 mb-1">Unit</label>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  >
                    <option value="seconds">Seconds</option>
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                  </select>
                </div>
              </div>

              {/* Cancel on Response Checkbox */}
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.timeout_cancel_on_response !== false}
                  onChange={(e) => updateNodeData(node.id, { timeout_cancel_on_response: e.target.checked })}
                  className="rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                />
                Cancel timeout if user responds
              </label>

              {data.timeout_value && (
                <p className="mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                  Connect this node to where the flow should go after {data.timeout_value as number} {(data.timeout_unit as string) || 'minutes'} without user response.
                </p>
              )}
            </div>
          </>
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
                List Title
              </label>
              <input
                type="text"
                value={data.list_title ?? ''}
                onChange={(e) =>
                  updateNodeData(node.id, { list_title: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Select an option"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Button Label
              </label>
              <input
                type="text"
                value={data.list_button_label ?? ''}
                onChange={(e) =>
                  updateNodeData(node.id, { list_button_label: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Select"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Save Selection As
              </label>
              <input
                type="text"
                value={data.variable_name ?? ''}
                onChange={(e) =>
                  updateNodeData(node.id, { variable_name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="variable_name"
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
            nodes={nodes}
          />
        )}

        {/* Delete button */}
        {type !== 'start' && (
          <button
            onClick={() => deleteNode(node.id)}
            className="flex items-center justify-center gap-2 w-full px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
          >
            <Trash2 className="w-4 h-4" />
            Delete Node
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
              Variable Transforms
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
      { id: uuid(), label: `Button ${buttons.length + 1}`, value: '' },
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
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Buttons
      </label>
      <div className="space-y-2">
        {buttons.map((button) => (
          <div
            key={button.id}
            className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
          >
            <input
              type="text"
              value={button.label}
              onChange={(e) => updateButton(button.id, { label: e.target.value })}
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              placeholder="Button label"
            />
            <button
              onClick={() => removeButton(button.id)}
              className="p-1 text-red-500 hover:bg-red-50 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button
          onClick={addButton}
          className="flex items-center justify-center gap-1 w-full px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
        >
          <Plus className="w-4 h-4" />
          Add Button
        </button>
      </div>
    </div>
  )
}

function ConditionsEditor({
  conditions,
  onChange,
  availableVariables,
  nodes,
}: {
  conditions: FlowCondition[]
  onChange: (conditions: FlowCondition[]) => void
  availableVariables: AvailableVariable[]
  nodes: Array<{ id: string; type?: string; data: Record<string, unknown> }>
}) {
  // Convert available variables to combobox options
  const variableOptions: ComboboxOption[] = useMemo(() => {
    return availableVariables.map((v) => ({
      value: v.name,
      label: v.name,
    }))
  }, [availableVariables])

  // Collect value suggestions from buttons/options in the flow
  const valueSuggestions: ComboboxOption[] = useMemo(() => {
    const suggestions: ComboboxOption[] = []
    const seen = new Set<string>()

    for (const node of nodes) {
      // Collect button values
      const buttons = node.data.buttons as FlowButtonOption[] | undefined
      if (buttons) {
        for (const btn of buttons) {
          const val = btn.value || btn.label
          if (val && !seen.has(val)) {
            seen.add(val)
            suggestions.push({ value: val, label: btn.label })
          }
        }
      }

      // Collect list option values
      const options = node.data.options as FlowListOption[] | undefined
      if (options) {
        for (const opt of options) {
          const val = opt.title
          if (val && !seen.has(val)) {
            seen.add(val)
            suggestions.push({ value: val, label: opt.title })
          }
        }
      }
    }

    return suggestions
  }, [nodes])

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
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Conditions
      </label>
      <div className="space-y-2">
        {conditions.map((condition) => (
          <div key={condition.id} className="p-2 bg-gray-50 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <ComboboxInput
                value={condition.variable}
                onChange={(value) => updateCondition(condition.id, { variable: value })}
                options={variableOptions}
                placeholder="Variable"
                className="flex-1 min-w-0"
              />
              <button
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
                <option value="equals">=</option>
                <option value="not_equals">!=</option>
                <option value="contains">contains</option>
                <option value="not_contains">!contains</option>
                <option value="starts_with">starts</option>
                <option value="ends_with">ends</option>
                <option value="exists">exists</option>
                <option value="not_exists">!exists</option>
                <option value="regex">regex</option>
              </select>
              {!['exists', 'not_exists'].includes(condition.operator) && (
                <ComboboxInput
                  value={condition.value ?? ''}
                  onChange={(value) => updateCondition(condition.id, { value })}
                  options={valueSuggestions}
                  placeholder="Value"
                  className="flex-1 min-w-0"
                />
              )}
            </div>
          </div>
        ))}
        <button
          onClick={addCondition}
          className="flex items-center justify-center gap-1 w-full px-3 py-2 text-sm text-teal-600 bg-teal-50 rounded-lg hover:bg-teal-100"
        >
          <Plus className="w-4 h-4" />
          Add Condition
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
      { id: uuid(), title: `Option ${options.length + 1}`, description: '' },
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
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Options
      </label>
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
                placeholder="Option title"
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
              placeholder="Description (optional)"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={addOption}
          className="flex items-center justify-center gap-1 w-full px-3 py-2 text-sm text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100"
        >
          <Plus className="w-4 h-4" />
          Add Option
        </button>
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
