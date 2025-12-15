import { useCallback, useRef } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  type ReactFlowInstance,
  type Node,
  type Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { useFlowStore } from '@/stores/flowStore'
import { nodeTypes } from './nodes'
import Toolbar from './ui/Toolbar'
import NodePanel from './ui/NodePanel'
import FlowList from './ui/FlowList'
import SimulationPanel from './ui/SimulationPanel'
import type { FlowNodeData, FlowNodeType } from '@/types/flow'

type FlowNode = Node<FlowNodeData, string>
type FlowEdge = Edge

export default function FlowBuilder() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const reactFlowInstance = useRef<ReactFlowInstance<FlowNode, FlowEdge> | null>(null)

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    selectNode,
    selectedNodeId,
    isPanelOpen,
    isSimulating,
  } = useFlowStore()

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const type = event.dataTransfer.getData('application/reactflow')
      if (!type || !reactFlowWrapper.current || !reactFlowInstance.current) {
        return
      }

      const bounds = reactFlowWrapper.current.getBoundingClientRect()
      const position = reactFlowInstance.current.screenToFlowPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      })

      addNode(type as FlowNodeType, position)
    },
    [addNode]
  )

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: { id: string }) => {
      selectNode(node.id)
    },
    [selectNode]
  )

  const onPaneClick = useCallback(() => {
    selectNode(null)
  }, [selectNode])

  return (
    <div className="flex h-screen w-screen bg-gray-100">
      {/* Left sidebar - Flow List */}
      <FlowList />

      {/* Main canvas */}
      <div className="flex-1 flex flex-col">
        <Toolbar />

        <div ref={reactFlowWrapper} className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={(instance) => {
              reactFlowInstance.current = instance
            }}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            snapToGrid
            snapGrid={[15, 15]}
            deleteKeyCode={['Backspace', 'Delete']}
            className="bg-gray-50"
          >
            <Background gap={15} size={1} color="#e5e7eb" />
            <Controls />
            <MiniMap
              nodeColor={(node) => {
                switch (node.type) {
                  case 'start':
                    return '#22c55e'
                  case 'end':
                    return '#ef4444'
                  case 'message':
                    return '#3b82f6'
                  case 'button':
                    return '#a855f7'
                  case 'option_list':
                    return '#6366f1'
                  case 'wait_response':
                    return '#f59e0b'
                  case 'conditional':
                    return '#14b8a6'
                  default:
                    return '#6b7280'
                }
              }}
              className="bg-white rounded-lg shadow-md"
            />

            <Panel position="top-left" className="m-2">
              <NodePalette />
            </Panel>
          </ReactFlow>
        </div>
      </div>

      {/* Right panel - Node editor */}
      {isPanelOpen && selectedNodeId && <NodePanel />}

      {/* Simulation panel */}
      {isSimulating && <SimulationPanel />}
    </div>
  )
}

function NodePalette() {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.effectAllowed = 'move'
  }

  const nodeItems = [
    { type: 'message', label: 'Message', color: 'bg-blue-500' },
    { type: 'button', label: 'Buttons', color: 'bg-purple-500' },
    { type: 'option_list', label: 'Option List', color: 'bg-indigo-500' },
    { type: 'wait_response', label: 'Wait Response', color: 'bg-amber-500' },
    { type: 'conditional', label: 'Condition', color: 'bg-teal-500' },
    { type: 'end', label: 'End', color: 'bg-red-500' },
  ]

  return (
    <div className="bg-white rounded-lg shadow-lg p-3 space-y-2">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Drag to add
      </h3>
      <div className="space-y-1">
        {nodeItems.map((item) => (
          <div
            key={item.type}
            draggable
            onDragStart={(e) => onDragStart(e, item.type)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-md cursor-grab
              ${item.color} text-white text-sm font-medium
              hover:opacity-90 active:cursor-grabbing
            `}
          >
            {item.label}
          </div>
        ))}
      </div>
    </div>
  )
}
