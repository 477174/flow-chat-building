import { create } from 'zustand'
import {
  applyNodeChanges,
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
  type Connection,
  type Viewport,
  type Node,
  type Edge,
} from '@xyflow/react'
import { v4 as uuid } from 'uuid'
import {
  FlowNodeType,
  FlowSimulationStatus,
  type FlowNodeData,
  type FlowTemplate,
  type FlowSimulationMessage,
} from '@/types/flow'

type FlowNode = Node<FlowNodeData, string>
type FlowEdge = Edge

interface FlowState {
  // Flow data
  nodes: FlowNode[]
  edges: FlowEdge[]
  viewport: Viewport
  flowId: string | null
  flowName: string
  flowDescription: string
  isGlobal: boolean
  isActive: boolean
  tags: string[]
  isDirty: boolean

  // Simulation state
  isSimulating: boolean
  simulationId: string | null
  simulationStatus: (typeof FlowSimulationStatus)[keyof typeof FlowSimulationStatus] | null
  simulationMessages: FlowSimulationMessage[]
  waitingForInput: boolean
  simulationVariables: Record<string, unknown>

  // UI state
  selectedNodeId: string | null
  isPanelOpen: boolean

  // Actions
  setNodes: (nodes: FlowNode[]) => void
  setEdges: (edges: FlowEdge[]) => void
  onNodesChange: (changes: NodeChange<FlowNode>[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void
  addNode: (type: (typeof FlowNodeType)[keyof typeof FlowNodeType], position: { x: number; y: number }) => void
  updateNodeData: (nodeId: string, data: Partial<FlowNodeData>) => void
  deleteNode: (nodeId: string) => void
  selectNode: (nodeId: string | null) => void
  togglePanel: (open?: boolean) => void

  // Flow actions
  loadFlow: (flow: FlowTemplate) => void
  resetFlow: () => void
  setFlowMeta: (meta: {
    name?: string
    description?: string
    isGlobal?: boolean
    isActive?: boolean
    tags?: string[]
  }) => void
  markClean: () => void

  // Simulation actions
  startSimulation: (simulationId: string) => void
  updateSimulation: (data: {
    status: (typeof FlowSimulationStatus)[keyof typeof FlowSimulationStatus]
    messages: FlowSimulationMessage[]
    waitingForInput: boolean
    variables: Record<string, unknown>
  }) => void
  endSimulation: () => void
}

const initialNodes: FlowNode[] = [
  {
    id: 'start-1',
    type: FlowNodeType.START,
    position: { x: 250, y: 50 },
    data: { label: 'Start' },
  },
]

const initialEdges: FlowEdge[] = []

export const useFlowStore = create<FlowState>((set) => ({
  // Initial state
  nodes: initialNodes,
  edges: initialEdges,
  viewport: { x: 0, y: 0, zoom: 1 },
  flowId: null,
  flowName: 'New Flow',
  flowDescription: '',
  isGlobal: false,
  isActive: true,
  tags: [],
  isDirty: false,

  isSimulating: false,
  simulationId: null,
  simulationStatus: null,
  simulationMessages: [],
  waitingForInput: false,
  simulationVariables: {},

  selectedNodeId: null,
  isPanelOpen: false,

  // Node/Edge actions
  setNodes: (nodes) => set({ nodes, isDirty: true }),
  setEdges: (edges) => set({ edges, isDirty: true }),

  onNodesChange: (changes) =>
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes) as FlowNode[],
      isDirty: true,
    })),

  onEdgesChange: (changes) =>
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
      isDirty: true,
    })),

  onConnect: (connection) =>
    set((state) => {
      const newEdge: FlowEdge = {
        id: `edge-${uuid()}`,
        source: connection.source!,
        target: connection.target!,
        sourceHandle: connection.sourceHandle ?? undefined,
        targetHandle: connection.targetHandle ?? undefined,
      }
      return {
        edges: [...state.edges, newEdge],
        isDirty: true,
      }
    }),

  addNode: (type, position) => {
    const id = `${type}-${uuid()}`
    const defaultData: FlowNodeData = {
      label: getDefaultLabel(type),
    }

    const newNode: FlowNode = {
      id,
      type,
      position,
      data: defaultData,
    }

    set((state) => ({
      nodes: [...state.nodes, newNode],
      selectedNodeId: id,
      isPanelOpen: true,
      isDirty: true,
    }))
  },

  updateNodeData: (nodeId, data) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
      ),
      isDirty: true,
    })),

  deleteNode: (nodeId) =>
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== nodeId),
      edges: state.edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      ),
      selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
      isDirty: true,
    })),

  selectNode: (nodeId) =>
    set({
      selectedNodeId: nodeId,
      isPanelOpen: nodeId !== null,
    }),

  togglePanel: (open) =>
    set((state) => ({
      isPanelOpen: open ?? !state.isPanelOpen,
    })),

  // Flow actions
  loadFlow: (flow) =>
    set({
      flowId: flow._id,
      flowName: flow.name,
      flowDescription: flow.description ?? '',
      isGlobal: flow.is_global,
      isActive: flow.is_active,
      tags: flow.tags,
      nodes: flow.nodes.map((n) => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: n.data,
      })),
      edges: flow.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.source_handle,
        targetHandle: e.target_handle,
        label: e.label,
      })),
      viewport: flow.viewport,
      isDirty: false,
      selectedNodeId: null,
      isPanelOpen: false,
    }),

  resetFlow: () =>
    set({
      nodes: initialNodes,
      edges: initialEdges,
      viewport: { x: 0, y: 0, zoom: 1 },
      flowId: null,
      flowName: 'New Flow',
      flowDescription: '',
      isGlobal: false,
      isActive: true,
      tags: [],
      isDirty: false,
      selectedNodeId: null,
      isPanelOpen: false,
    }),

  setFlowMeta: (meta) =>
    set((state) => ({
      flowName: meta.name ?? state.flowName,
      flowDescription: meta.description ?? state.flowDescription,
      isGlobal: meta.isGlobal ?? state.isGlobal,
      isActive: meta.isActive ?? state.isActive,
      tags: meta.tags ?? state.tags,
      isDirty: true,
    })),

  markClean: () => set({ isDirty: false }),

  // Simulation actions
  startSimulation: (simulationId) =>
    set({
      isSimulating: true,
      simulationId,
      simulationStatus: null,
      simulationMessages: [],
      waitingForInput: false,
      simulationVariables: {},
    }),

  updateSimulation: (data) =>
    set((state) => ({
      simulationStatus: data.status,
      simulationMessages: [...state.simulationMessages, ...data.messages],
      waitingForInput: data.waitingForInput,
      simulationVariables: data.variables,
    })),

  endSimulation: () =>
    set({
      isSimulating: false,
      simulationId: null,
      waitingForInput: false,
    }),
}))

function getDefaultLabel(type: (typeof FlowNodeType)[keyof typeof FlowNodeType]): string {
  switch (type) {
    case FlowNodeType.START:
      return 'Start'
    case FlowNodeType.END:
      return 'End'
    case FlowNodeType.MESSAGE:
      return 'Message'
    case FlowNodeType.BUTTON:
      return 'Buttons'
    case FlowNodeType.OPTION_LIST:
      return 'Option List'
    case FlowNodeType.WAIT_RESPONSE:
      return 'Wait Response'
    case FlowNodeType.CONDITIONAL:
      return 'Condition'
    default:
      return 'Node'
  }
}
