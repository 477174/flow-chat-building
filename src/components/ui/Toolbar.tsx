import { useState, useEffect } from 'react'
import { Save, Play, FileText, Settings, Upload, Download, Zap, ZapOff } from 'lucide-react'
import { useFlowStore } from '@/stores/flowStore'
import { getActiveFlow, setActiveFlow, clearActiveFlow, createFlow, updateFlow } from '@/services/api'
import type { FlowNodeType, FlowNodeBase, FlowEdgeBase } from '@/types/flow'

export default function Toolbar() {
  const {
    flowId,
    flowName,
    flowDescription,
    isGlobal,
    isActive,
    tags,
    nodes,
    edges,
    viewport,
    isDirty,
    markClean,
    loadFlow,
    startSimulation,
    setFlowMeta,
    setFlowId,
  } = useFlowStore()

  const [activeFlowId, setActiveFlowId] = useState<string | null>(null)
  const [isSettingActive, setIsSettingActive] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Check if current flow is the active flow
  const isCurrentFlowActive = flowId && activeFlowId === flowId

  // Load active flow status on mount
  useEffect(() => {
    const fetchActiveFlow = async () => {
      try {
        const response = await getActiveFlow()
        setActiveFlowId(response.active_flow_id)
      } catch (error) {
        console.error('Failed to fetch active flow:', error)
      }
    }
    fetchActiveFlow()
  }, [])

  const handleSave = async () => {
    const flowNodes: FlowNodeBase[] = nodes.map((n) => ({
      id: n.id,
      type: n.type as FlowNodeType,
      position: n.position,
      data: n.data,
    }))

    const flowEdges: FlowEdgeBase[] = edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      source_handle: e.sourceHandle ?? undefined,
      target_handle: e.targetHandle ?? undefined,
      label: typeof e.label === 'string' ? e.label : undefined,
    }))

    const flowData = {
      name: flowName,
      description: flowDescription,
      nodes: flowNodes,
      edges: flowEdges,
      viewport,
      is_global: isGlobal,
      is_active: isActive,
      tags,
    }

    setIsSaving(true)
    try {
      if (flowId) {
        // Update existing flow
        await updateFlow(flowId, flowData)
      } else {
        // Create new flow
        const savedFlow = await createFlow(flowData)
        setFlowId(savedFlow._id)
      }
      markClean()
    } catch (error) {
      console.error('Failed to save flow:', error)
      alert('Failed to save flow. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleExport = () => {
    const flowNodes: FlowNodeBase[] = nodes.map((n) => ({
      id: n.id,
      type: n.type as FlowNodeType,
      position: n.position,
      data: n.data,
    }))

    const flowEdges: FlowEdgeBase[] = edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      source_handle: e.sourceHandle ?? undefined,
      target_handle: e.targetHandle ?? undefined,
      label: typeof e.label === 'string' ? e.label : undefined,
    }))

    const flowData = {
      name: flowName,
      description: flowDescription,
      nodes: flowNodes,
      edges: flowEdges,
      viewport,
      is_global: isGlobal,
      is_active: isActive,
      tags,
    }

    // Create and download JSON file
    const blob = new Blob([JSON.stringify(flowData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${flowName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_flow.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleLoad = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        const text = await file.text()
        const flowData = JSON.parse(text)

        loadFlow({
          _id: '',
          name: flowData.name || 'Imported Flow',
          description: flowData.description || '',
          nodes: flowData.nodes || [],
          edges: flowData.edges || [],
          viewport: flowData.viewport || { x: 0, y: 0, zoom: 1 },
          is_global: flowData.is_global ?? false,
          is_active: flowData.is_active ?? true,
          tags: flowData.tags || [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          version: 1,
        })
      } catch (error) {
        console.error('Failed to load flow:', error)
        alert('Failed to load flow. Make sure the file is a valid JSON flow.')
      }
    }
    input.click()
  }

  const handleStartSimulation = () => {
    // For now, start a local simulation without API
    const simulationId = `local-${Date.now()}`
    startSimulation(simulationId)
  }

  const handleSetActiveFlow = async () => {
    if (!flowId) {
      alert('Please save the flow first before setting it as active.')
      return
    }

    setIsSettingActive(true)
    try {
      if (isCurrentFlowActive) {
        // Clear active flow
        await clearActiveFlow()
        setActiveFlowId(null)
      } else {
        // Set this flow as active
        const response = await setActiveFlow(flowId)
        setActiveFlowId(response.active_flow_id)
      }
    } catch (error) {
      console.error('Failed to set active flow:', error)
      alert('Failed to set active flow. Please try again.')
    } finally {
      setIsSettingActive(false)
    }
  }

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={flowName}
            onChange={(e) => setFlowMeta({ name: e.target.value })}
            className="text-lg font-semibold text-gray-800 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
            placeholder="Flow name"
          />
          {isDirty && (
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
              Unsaved
            </span>
          )}
          {isCurrentFlowActive && (
            <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Active
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleLoad}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          title="Import flow from JSON file"
        >
          <Upload className="w-4 h-4" />
          Import
        </button>

        <button
          type="button"
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          title="Export flow to JSON file"
        >
          <Download className="w-4 h-4" />
          Export
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          title="Save flow to server"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save'}
        </button>

        <button
          type="button"
          onClick={handleSetActiveFlow}
          disabled={isSettingActive}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg disabled:opacity-50 ${
            isCurrentFlowActive
              ? 'bg-green-500 text-white hover:bg-green-600'
              : 'bg-orange-500 text-white hover:bg-orange-600'
          }`}
        >
          {isCurrentFlowActive ? (
            <>
              <ZapOff className="w-4 h-4" />
              Deactivate
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Set Active
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleStartSimulation}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
        >
          <Play className="w-4 h-4" />
          Simulate
        </button>

        <button type="button" className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
