import { useState } from 'react'
import { ChevronDown, ChevronRight, Plus, X, Trash2 } from 'lucide-react'
import { v4 as uuid } from 'uuid'
import { useFlowStore } from '@/stores/flowStore'
import {
  VariableTransformOperator,
  type VariableTransform,
  type VariableTransformCondition,
} from '@/types/flow'
import type { AvailableVariable } from '@/utils/variableUtils'
import VariableChip from './VariableChip'

interface VariablePanelProps {
  availableVariables: AvailableVariable[]
  nodeId?: string | null
  className?: string
}

/**
 * Panel for configuring variable transforms
 * Shows both global transforms and node-specific transforms
 */
export default function VariablePanel({
  availableVariables,
  nodeId,
  className = '',
}: VariablePanelProps) {
  const [expandedGlobal, setExpandedGlobal] = useState(true)
  const [expandedNode, setExpandedNode] = useState(true)

  const {
    variableTransforms,
    addGlobalTransform,
    updateGlobalTransform,
    removeGlobalTransform,
    addNodeTransform,
    updateNodeTransform,
    removeNodeTransform,
  } = useFlowStore()

  const globalTransforms = variableTransforms.global
  const nodeTransforms = nodeId ? (variableTransforms.byNode[nodeId] ?? []) : []

  const handleAddGlobalTransform = (variableName: string) => {
    addGlobalTransform({
      id: uuid(),
      variableName,
      conditions: [],
      defaultValue: undefined,
    })
  }

  const handleAddNodeTransform = (variableName: string) => {
    if (!nodeId) return
    addNodeTransform(nodeId, {
      id: uuid(),
      variableName,
      conditions: [],
      defaultValue: undefined,
    })
  }

  // Get variables not yet having a global transform
  const availableForGlobal = availableVariables.filter(
    (v) => !globalTransforms.some((t) => t.variableName === v.name)
  )

  // Get variables not yet having a node transform
  const availableForNode = availableVariables.filter(
    (v) => !nodeTransforms.some((t) => t.variableName === v.name)
  )

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Global Transforms Section */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setExpandedGlobal(!expandedGlobal)}
          className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 text-sm font-medium text-gray-700"
        >
          <span className="flex items-center gap-2">
            {expandedGlobal ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            Global Transforms
          </span>
          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
            {globalTransforms.length}
          </span>
        </button>

        {expandedGlobal && (
          <div className="p-3 space-y-3">
            {globalTransforms.length === 0 && (
              <p className="text-xs text-gray-400 italic">
                No global transforms configured
              </p>
            )}

            {globalTransforms.map((transform) => (
              <TransformEditor
                key={transform.id}
                transform={transform}
                availableVariables={availableVariables}
                onUpdate={(updates) => updateGlobalTransform(transform.id, updates)}
                onRemove={() => removeGlobalTransform(transform.id)}
              />
            ))}

            {/* Add new global transform */}
            {availableForGlobal.length > 0 && (
              <AddTransformSelector
                variables={availableForGlobal}
                onSelect={handleAddGlobalTransform}
                label="Add global transform"
              />
            )}
          </div>
        )}
      </div>

      {/* Node-specific Transforms Section */}
      {nodeId && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setExpandedNode(!expandedNode)}
            className="w-full flex items-center justify-between px-3 py-2 bg-green-50 hover:bg-green-100 text-sm font-medium text-green-700"
          >
            <span className="flex items-center gap-2">
              {expandedNode ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              Node Transforms
            </span>
            <span className="text-xs text-green-600 bg-green-200 px-2 py-0.5 rounded-full">
              {nodeTransforms.length}
            </span>
          </button>

          {expandedNode && (
            <div className="p-3 space-y-3">
              {nodeTransforms.length === 0 && (
                <p className="text-xs text-gray-400 italic">
                  No transforms for this node
                </p>
              )}

              {nodeTransforms.map((transform) => (
                <TransformEditor
                  key={transform.id}
                  transform={transform}
                  availableVariables={availableVariables}
                  onUpdate={(updates) =>
                    updateNodeTransform(nodeId, transform.id, updates)
                  }
                  onRemove={() => removeNodeTransform(nodeId, transform.id)}
                  isNodeScoped
                />
              ))}

              {/* Add new node transform */}
              {availableForNode.length > 0 && (
                <AddTransformSelector
                  variables={availableForNode}
                  onSelect={handleAddNodeTransform}
                  label="Add node transform"
                  variant="green"
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Editor for a single variable transform
 */
function TransformEditor({
  transform,
  availableVariables,
  onUpdate,
  onRemove,
  isNodeScoped = false,
}: {
  transform: VariableTransform
  availableVariables: AvailableVariable[]
  onUpdate: (updates: Partial<VariableTransform>) => void
  onRemove: () => void
  isNodeScoped?: boolean
}) {
  const variable = availableVariables.find((v) => v.name === transform.variableName)

  const addCondition = () => {
    const newCondition: VariableTransformCondition = {
      id: uuid(),
      operator: VariableTransformOperator.EQUALS,
      value: '',
      displayValue: '',
    }
    onUpdate({ conditions: [...transform.conditions, newCondition] })
  }

  const updateCondition = (
    conditionId: string,
    updates: Partial<VariableTransformCondition>
  ) => {
    onUpdate({
      conditions: transform.conditions.map((c) =>
        c.id === conditionId ? { ...c, ...updates } : c
      ),
    })
  }

  const removeCondition = (conditionId: string) => {
    onUpdate({
      conditions: transform.conditions.filter((c) => c.id !== conditionId),
    })
  }

  return (
    <div
      className={`border rounded-lg p-2 ${
        isNodeScoped ? 'border-green-200 bg-green-50/50' : 'border-blue-200 bg-blue-50/50'
      }`}
    >
      {/* Header with variable name and remove button */}
      <div className="flex items-center justify-between mb-2">
        <VariableChip
          name={transform.variableName}
          label={variable?.sourceNodeLabel}
          type={variable?.type ?? 'inherited'}
          size="sm"
        />
        <button
          type="button"
          onClick={onRemove}
          className="p-1 text-red-500 hover:bg-red-50 rounded"
          title="Remove transform"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Conditions list */}
      <div className="space-y-2">
        {transform.conditions.map((condition) => (
          <ConditionEditor
            key={condition.id}
            condition={condition}
            possibleValues={variable?.possibleValues ?? []}
            onUpdate={(updates) => updateCondition(condition.id, updates)}
            onRemove={() => removeCondition(condition.id)}
          />
        ))}

        {/* Add condition button */}
        <button
          type="button"
          onClick={addCondition}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
        >
          <Plus className="w-3 h-3" />
          Add rule
        </button>
      </div>

      {/* Default value */}
      <div className="mt-2 pt-2 border-t border-gray-200">
        <label className="block text-xs text-gray-500 mb-1">
          Default (no match):
        </label>
        <input
          type="text"
          value={transform.defaultValue ?? ''}
          onChange={(e) => onUpdate({ defaultValue: e.target.value || undefined })}
          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
          placeholder="Original value"
        />
      </div>
    </div>
  )
}

/**
 * Editor for a single transform condition
 */
function ConditionEditor({
  condition,
  possibleValues,
  onUpdate,
  onRemove,
}: {
  condition: VariableTransformCondition
  possibleValues: Array<{ id: string; label: string }>
  onUpdate: (updates: Partial<VariableTransformCondition>) => void
  onRemove: () => void
}) {
  return (
    <div className="flex items-center gap-1 bg-white rounded p-1.5 border border-gray-200">
      {/* Operator */}
      <select
        value={condition.operator}
        onChange={(e) =>
          onUpdate({ operator: e.target.value as VariableTransformOperator })
        }
        className="px-1.5 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
      >
        <option value="equals">=</option>
        <option value="contains">contains</option>
        <option value="starts_with">starts</option>
        <option value="ends_with">ends</option>
        <option value="regex">regex</option>
      </select>

      {/* Value - show dropdown if we have possible values */}
      {possibleValues.length > 0 ? (
        <select
          value={condition.value}
          onChange={(e) => onUpdate({ value: e.target.value })}
          className="flex-1 px-1.5 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 min-w-0"
        >
          <option value="">Select...</option>
          {possibleValues.map((pv) => (
            <option key={pv.id} value={pv.label}>
              {pv.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type="text"
          value={condition.value}
          onChange={(e) => onUpdate({ value: e.target.value })}
          className="flex-1 px-1.5 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 min-w-0"
          placeholder="Value"
        />
      )}

      {/* Arrow */}
      <span className="text-gray-400 text-xs px-1">→</span>

      {/* Display value */}
      <input
        type="text"
        value={condition.displayValue}
        onChange={(e) => onUpdate({ displayValue: e.target.value })}
        className="flex-1 px-1.5 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 min-w-0"
        placeholder="Display as..."
      />

      {/* Remove button */}
      <button
        type="button"
        onClick={onRemove}
        className="p-0.5 text-red-400 hover:text-red-600"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  )
}

/**
 * Selector for adding a new transform
 */
function AddTransformSelector({
  variables,
  onSelect,
  label,
  variant = 'blue',
}: {
  variables: AvailableVariable[]
  onSelect: (variableName: string) => void
  label: string
  variant?: 'blue' | 'green'
}) {
  const [isOpen, setIsOpen] = useState(false)

  const colors = {
    blue: 'text-blue-600 bg-blue-50 hover:bg-blue-100',
    green: 'text-green-600 bg-green-50 hover:bg-green-100',
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-1 text-xs px-2 py-1.5 rounded ${colors[variant]}`}
      >
        <Plus className="w-3 h-3" />
        {label}
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <select
        onChange={(e) => {
          if (e.target.value) {
            onSelect(e.target.value)
            setIsOpen(false)
          }
        }}
        className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
        autoFocus
      >
        <option value="">Select variable...</option>
        {variables.map((v) => (
          <option key={v.name} value={v.name}>
            {v.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => setIsOpen(false)}
        className="p-1 text-gray-400 hover:text-gray-600"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
