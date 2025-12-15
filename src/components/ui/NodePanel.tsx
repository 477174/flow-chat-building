import { X, Trash2, Plus } from 'lucide-react'
import { v4 as uuid } from 'uuid'
import { useFlowStore } from '@/stores/flowStore'
import {
  FlowMessageType,
  FlowConditionOperator,
  type FlowButtonOption,
  type FlowCondition,
} from '@/types/flow'

export default function NodePanel() {
  const { nodes, selectedNodeId, updateNodeData, deleteNode, togglePanel } =
    useFlowStore()

  const node = nodes.find((n) => n.id === selectedNodeId)
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

        {/* Message content (for message, button, wait_response) */}
        {(type === 'message' || type === 'button' || type === 'wait_response') && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message Content
              </label>
              <textarea
                value={data.content ?? ''}
                onChange={(e) =>
                  updateNodeData(node.id, { content: e.target.value })
                }
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your message..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Use {'{{variable}}'} for dynamic content
              </p>
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

        {/* Variable name (for wait_response) */}
        {type === 'wait_response' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Save Response As
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timeout (seconds)
              </label>
              <input
                type="number"
                value={data.timeout_seconds ?? ''}
                onChange={(e) =>
                  updateNodeData(node.id, {
                    timeout_seconds: e.target.value
                      ? parseInt(e.target.value)
                      : undefined,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="300"
              />
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

        {/* Conditions (for conditional node) */}
        {type === 'conditional' && (
          <ConditionsEditor
            conditions={data.conditions ?? []}
            onChange={(conditions) => updateNodeData(node.id, { conditions })}
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
}: {
  conditions: FlowCondition[]
  onChange: (conditions: FlowCondition[]) => void
}) {
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
              <input
                type="text"
                value={condition.variable}
                onChange={(e) =>
                  updateCondition(condition.id, { variable: e.target.value })
                }
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                placeholder="Variable"
              />
              <button
                onClick={() => removeCondition(condition.id)}
                className="p-1 text-red-500 hover:bg-red-50 rounded"
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
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="equals">Equals</option>
                <option value="not_equals">Not Equals</option>
                <option value="contains">Contains</option>
                <option value="not_contains">Not Contains</option>
                <option value="starts_with">Starts With</option>
                <option value="ends_with">Ends With</option>
                <option value="exists">Exists</option>
                <option value="not_exists">Not Exists</option>
                <option value="regex">Regex</option>
              </select>
              {!['exists', 'not_exists'].includes(condition.operator) && (
                <input
                  type="text"
                  value={condition.value ?? ''}
                  onChange={(e) =>
                    updateCondition(condition.id, { value: e.target.value })
                  }
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="Value"
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
