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
  type VariableTransform,
  type VariableTransformScope,
  type TimeoutUnit,
} from '@/types/flow'

/**
 * Convert timeout_seconds back to display value and unit
 * Prefers larger units when possible (hours > minutes > seconds)
 */
function convertSecondsToDisplay(seconds: number): { value: number; unit: TimeoutUnit } {
  if (seconds >= 3600 && seconds % 3600 === 0) {
    return { value: seconds / 3600, unit: 'hours' }
  }
  if (seconds >= 60 && seconds % 60 === 0) {
    return { value: seconds / 60, unit: 'minutes' }
  }
  return { value: seconds, unit: 'seconds' }
}

/**
 * Hydrate node data with computed display values for timeout
 */
function hydrateNodeData(data: FlowNodeData): FlowNodeData {
  // If timeout_seconds exists but timeout_value doesn't, compute it
  if (data.timeout_seconds != null && data.timeout_value == null) {
    const { value, unit } = convertSecondsToDisplay(data.timeout_seconds)
    return {
      ...data,
      timeout_value: value,
      timeout_unit: unit,
    }
  }
  return data
}

/**
 * Snapshot of flow state for change detection
 */
interface FlowSnapshot {
  nodes: FlowNode[]
  edges: FlowEdge[]
  flowName: string
  flowDescription: string
  isGlobal: boolean
  isActive: boolean
  tags: string[]
  variableTransforms: VariableTransformScope
}

/**
 * Create a snapshot from current state
 */
function createSnapshot(state: {
  nodes: FlowNode[]
  edges: FlowEdge[]
  flowName: string
  flowDescription: string
  isGlobal: boolean
  isActive: boolean
  tags: string[]
  variableTransforms: VariableTransformScope
}): FlowSnapshot {
  return {
    nodes: JSON.parse(JSON.stringify(state.nodes)),
    edges: JSON.parse(JSON.stringify(state.edges)),
    flowName: state.flowName,
    flowDescription: state.flowDescription,
    isGlobal: state.isGlobal,
    isActive: state.isActive,
    tags: [...state.tags],
    variableTransforms: JSON.parse(JSON.stringify(state.variableTransforms)),
  }
}

/**
 * Compare two nodes for equality (ignoring transient properties like selected, dragging)
 */
function nodesEqual(a: FlowNode[], b: FlowNode[]): boolean {
  if (a.length !== b.length) return false

  const normalize = (node: FlowNode) => ({
    id: node.id,
    type: node.type,
    position: { x: Math.round(node.position.x), y: Math.round(node.position.y) },
    data: node.data,
  })

  const aMap = new Map(a.map(n => [n.id, normalize(n)]))

  for (const node of b) {
    const aNode = aMap.get(node.id)
    if (!aNode) return false
    if (JSON.stringify(aNode) !== JSON.stringify(normalize(node))) return false
  }

  return true
}

/**
 * Compare two edge arrays for equality
 */
function edgesEqual(a: FlowEdge[], b: FlowEdge[]): boolean {
  if (a.length !== b.length) return false

  const normalize = (edge: FlowEdge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
    label: edge.label,
  })

  const aMap = new Map(a.map(e => [e.id, normalize(e)]))

  for (const edge of b) {
    const aEdge = aMap.get(edge.id)
    if (!aEdge) return false
    if (JSON.stringify(aEdge) !== JSON.stringify(normalize(edge))) return false
  }

  return true
}

/**
 * Check if current state differs from snapshot
 */
function hasChanges(current: FlowSnapshot, original: FlowSnapshot | null): boolean {
  if (!original) return true // New flow is always dirty if it has content

  if (current.flowName !== original.flowName) return true
  if (current.flowDescription !== original.flowDescription) return true
  if (current.isGlobal !== original.isGlobal) return true
  if (current.isActive !== original.isActive) return true
  if (JSON.stringify(current.tags) !== JSON.stringify(original.tags)) return true
  if (JSON.stringify(current.variableTransforms) !== JSON.stringify(original.variableTransforms)) return true
  if (!nodesEqual(current.nodes, original.nodes)) return true
  if (!edgesEqual(current.edges, original.edges)) return true

  return false
}

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
  saveVersion: number // Increments on each save to trigger list refresh

  // Change detection
  originalSnapshot: FlowSnapshot | null

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

  // Variable transforms
  variableTransforms: VariableTransformScope

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
  setFlowId: (flowId: string) => void
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

  // Variable transform actions
  addGlobalTransform: (transform: VariableTransform) => void
  updateGlobalTransform: (transformId: string, transform: Partial<VariableTransform>) => void
  removeGlobalTransform: (transformId: string) => void
  addNodeTransform: (nodeId: string, transform: VariableTransform) => void
  updateNodeTransform: (nodeId: string, transformId: string, transform: Partial<VariableTransform>) => void
  removeNodeTransform: (nodeId: string, transformId: string) => void
  setVariableTransforms: (transforms: VariableTransformScope) => void

  // Computed dirty state
  isDirty: () => boolean
}

const initialNodes: FlowNode[] = [
  {
    id: 'start-1',
    type: FlowNodeType.START,
    position: { x: 250, y: 50 },
    data: { label: 'Início' },
  },
]

const initialEdges: FlowEdge[] = []

const initialSnapshot: FlowSnapshot = {
  nodes: initialNodes,
  edges: initialEdges,
  flowName: 'Novo Fluxo',
  flowDescription: '',
  isGlobal: false,
  isActive: true,
  tags: [],
  variableTransforms: { global: [], byNode: {} },
}

export const useFlowStore = create<FlowState>((set, get) => ({
  // Initial state
  nodes: initialNodes,
  edges: initialEdges,
  viewport: { x: 0, y: 0, zoom: 1 },
  saveVersion: 0,
  flowId: null,
  flowName: 'Novo Fluxo',
  flowDescription: '',
  isGlobal: false,
  isActive: true,
  tags: [],
  originalSnapshot: initialSnapshot,

  isSimulating: false,
  simulationId: null,
  simulationStatus: null,
  simulationMessages: [],
  waitingForInput: false,
  simulationVariables: {},

  selectedNodeId: null,
  isPanelOpen: false,

  variableTransforms: {
    global: [],
    byNode: {},
  },

  // Computed dirty state - compares current state to original snapshot
  isDirty: () => {
    const state = get()
    const current: FlowSnapshot = {
      nodes: state.nodes,
      edges: state.edges,
      flowName: state.flowName,
      flowDescription: state.flowDescription,
      isGlobal: state.isGlobal,
      isActive: state.isActive,
      tags: state.tags,
      variableTransforms: state.variableTransforms,
    }
    return hasChanges(current, state.originalSnapshot)
  },

  // Node/Edge actions
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  onNodesChange: (changes) =>
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes) as FlowNode[],
    })),

  onEdgesChange: (changes) =>
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
    })),

  onConnect: (connection) =>
    set((state) => {
      const newEdge: FlowEdge = {
        id: `edge-${uuid()}`,
        source: connection.source ?? '',
        target: connection.target ?? '',
        sourceHandle: connection.sourceHandle ?? undefined,
        targetHandle: connection.targetHandle ?? undefined,
      }
      return {
        edges: [...state.edges, newEdge],
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
    }))
  },

  updateNodeData: (nodeId, data) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
      ),
    })),

  deleteNode: (nodeId) =>
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== nodeId),
      edges: state.edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      ),
      selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
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
  loadFlow: (flow) => {
    const nodes = flow.nodes.map((n) => ({
      id: n.id,
      type: n.type,
      position: n.position,
      data: hydrateNodeData(n.data),
    }))
    const edges = flow.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.source_handle,
      targetHandle: e.target_handle,
      label: e.label,
    }))
    const variableTransforms = { global: [], byNode: {} } as VariableTransformScope

    // Create snapshot of loaded state
    const snapshot = createSnapshot({
      nodes,
      edges,
      flowName: flow.name,
      flowDescription: flow.description ?? '',
      isGlobal: flow.is_global,
      isActive: flow.is_active,
      tags: flow.tags,
      variableTransforms,
    })

    set({
      flowId: flow.id,
      flowName: flow.name,
      flowDescription: flow.description ?? '',
      isGlobal: flow.is_global,
      isActive: flow.is_active,
      tags: flow.tags,
      nodes,
      edges,
      viewport: flow.viewport,
      selectedNodeId: null,
      isPanelOpen: false,
      variableTransforms,
      originalSnapshot: snapshot,
    })
  },

  resetFlow: () =>
    set({
      nodes: initialNodes,
      edges: initialEdges,
      viewport: { x: 0, y: 0, zoom: 1 },
      flowId: null,
      flowName: 'Novo Fluxo',
      flowDescription: '',
      isGlobal: false,
      isActive: true,
      tags: [],
      selectedNodeId: null,
      isPanelOpen: false,
      variableTransforms: { global: [], byNode: {} },
      originalSnapshot: initialSnapshot,
    }),

  setFlowMeta: (meta) =>
    set((state) => ({
      flowName: meta.name ?? state.flowName,
      flowDescription: meta.description ?? state.flowDescription,
      isGlobal: meta.isGlobal ?? state.isGlobal,
      isActive: meta.isActive ?? state.isActive,
      tags: meta.tags ?? state.tags,
    })),

  setFlowId: (flowId) => set({ flowId }),

  markClean: () => set((state) => ({
    saveVersion: state.saveVersion + 1,
    originalSnapshot: createSnapshot(state),
  })),

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

  // Variable transform actions
  addGlobalTransform: (transform) =>
    set((state) => ({
      variableTransforms: {
        ...state.variableTransforms,
        global: [...state.variableTransforms.global, transform],
      },
    })),

  updateGlobalTransform: (transformId, updates) =>
    set((state) => ({
      variableTransforms: {
        ...state.variableTransforms,
        global: state.variableTransforms.global.map((t) =>
          t.id === transformId ? { ...t, ...updates } : t
        ),
      },
    })),

  removeGlobalTransform: (transformId) =>
    set((state) => ({
      variableTransforms: {
        ...state.variableTransforms,
        global: state.variableTransforms.global.filter((t) => t.id !== transformId),
      },
    })),

  addNodeTransform: (nodeId, transform) =>
    set((state) => ({
      variableTransforms: {
        ...state.variableTransforms,
        byNode: {
          ...state.variableTransforms.byNode,
          [nodeId]: [...(state.variableTransforms.byNode[nodeId] ?? []), transform],
        },
      },
    })),

  updateNodeTransform: (nodeId, transformId, updates) =>
    set((state) => ({
      variableTransforms: {
        ...state.variableTransforms,
        byNode: {
          ...state.variableTransforms.byNode,
          [nodeId]: (state.variableTransforms.byNode[nodeId] ?? []).map((t) =>
            t.id === transformId ? { ...t, ...updates } : t
          ),
        },
      },
    })),

  removeNodeTransform: (nodeId, transformId) =>
    set((state) => ({
      variableTransforms: {
        ...state.variableTransforms,
        byNode: {
          ...state.variableTransforms.byNode,
          [nodeId]: (state.variableTransforms.byNode[nodeId] ?? []).filter(
            (t) => t.id !== transformId
          ),
        },
      },
    })),

  setVariableTransforms: (transforms) =>
    set({
      variableTransforms: transforms,
    }),
}))

function getDefaultLabel(type: (typeof FlowNodeType)[keyof typeof FlowNodeType]): string {
  switch (type) {
    case FlowNodeType.START:
      return 'Início'
    case FlowNodeType.END:
      return 'Fim'
    case FlowNodeType.MESSAGE:
      return 'Mensagem'
    case FlowNodeType.BUTTON:
      return 'Botões'
    case FlowNodeType.OPTION_LIST:
      return 'Lista de Opções'
    case FlowNodeType.WAIT_RESPONSE:
      return 'Aguardar Resposta'
    case FlowNodeType.CONDITIONAL:
      return 'Condição'
    case FlowNodeType.SEMANTIC_CONDITIONS:
      return 'Condições Semânticas'
    default:
      return 'Bloco'
  }
}
