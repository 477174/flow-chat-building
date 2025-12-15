import { useState, useEffect } from 'react'
import { Plus, FileText, Trash2, Copy, RefreshCw } from 'lucide-react'
import { useFlowStore } from '@/stores/flowStore'
import { getFlows, deleteFlow, duplicateFlow } from '@/services/api'
import type { FlowTemplate } from '@/types/flow'

export default function FlowList() {
  const [flows, setFlows] = useState<FlowTemplate[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const { flowId, loadFlow, resetFlow, isDirty } = useFlowStore()

  const fetchFlows = async () => {
    setIsLoading(true)
    try {
      const data = await getFlows()
      setFlows(data)
    } catch (error) {
      console.error('Failed to fetch flows:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchFlows()
  }, [])

  const handleSelectFlow = (flow: FlowTemplate) => {
    if (isDirty) {
      const confirm = window.confirm(
        'You have unsaved changes. Are you sure you want to switch flows?'
      )
      if (!confirm) return
    }
    loadFlow(flow)
  }

  const handleNewFlow = () => {
    if (isDirty) {
      const confirm = window.confirm(
        'You have unsaved changes. Are you sure you want to create a new flow?'
      )
      if (!confirm) return
    }
    resetFlow()
  }

  const handleDeleteFlow = async (flow: FlowTemplate, e: React.MouseEvent) => {
    e.stopPropagation()
    const confirm = window.confirm(
      `Are you sure you want to delete "${flow.name}"?`
    )
    if (!confirm) return

    try {
      await deleteFlow(flow._id)
      if (flowId === flow._id) {
        resetFlow()
      }
      fetchFlows()
    } catch (error) {
      console.error('Failed to delete flow:', error)
      alert('Failed to delete flow')
    }
  }

  const handleDuplicateFlow = async (flow: FlowTemplate, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await duplicateFlow(flow._id)
      fetchFlows()
    } catch (error) {
      console.error('Failed to duplicate flow:', error)
      alert('Failed to duplicate flow')
    }
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-gray-800">Flows</h2>
          <button
            onClick={fetchFlows}
            disabled={isLoading}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <button
          onClick={handleNewFlow}
          className="flex items-center justify-center gap-2 w-full px-3 py-2 text-sm text-white bg-blue-500 rounded-lg hover:bg-blue-600"
        >
          <Plus className="w-4 h-4" />
          New Flow
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {isLoading && flows.length === 0 ? (
          <div className="text-center py-4 text-gray-500 text-sm">Loading...</div>
        ) : flows.length === 0 ? (
          <div className="text-center py-4 text-gray-500 text-sm">
            No flows yet
          </div>
        ) : (
          <div className="space-y-1">
            {flows.map((flow) => (
              <div
                key={flow._id}
                onClick={() => handleSelectFlow(flow)}
                className={`
                  group flex items-center gap-2 p-2 rounded-lg cursor-pointer
                  ${flowId === flow._id ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}
                `}
              >
                <FileText className="w-4 h-4 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{flow.name}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {flow.nodes.length} nodes
                  </p>
                </div>
                <div className="hidden group-hover:flex items-center gap-1">
                  <button
                    onClick={(e) => handleDuplicateFlow(flow, e)}
                    className="p-1 text-gray-400 hover:text-blue-500 rounded"
                    title="Duplicate"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteFlow(flow, e)}
                    className="p-1 text-gray-400 hover:text-red-500 rounded"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
