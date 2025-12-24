import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
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

type FlowNode = Node<FlowNodeData, string>
type FlowEdge = Edge

/**
 * Snapshot of flow state for change detection
 */
interface FlowSnapshot {
  nodesJson: string
  edgesJson: string
  flowName: string
  flowDescription: string
  isGlobal: boolean
  isActive: boolean
  tagsJson: string
  phoneWhitelistJson: string
  transformsJson: string
}

/**
 * Create a lightweight snapshot for comparison
 */
function createSnapshot(state: {
  nodes: FlowNode[]
  edges: FlowEdge[]
  flowName: string
  flowDescription: string
  isGlobal: boolean
  isActive: boolean
  tags: string[]
  phoneWhitelist: string[]
  variableTransforms: VariableTransformScope
}): FlowSnapshot {
  // Normalize nodes (only compare id, type, rounded position, and data)
  const normalizedNodes = state.nodes.map(n => ({
    id: n.id,
    type: n.type,
    position: { x: Math.round(n.position.x), y: Math.round(n.position.y) },
    data: n.data,
  }))

  // Normalize edges
  const normalizedEdges = state.edges.map(e => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle,
    targetHandle: e.targetHandle,
    label: e.label,
  }))

  return {
    nodesJson: JSON.stringify(normalizedNodes),
    edgesJson: JSON.stringify(normalizedEdges),
    flowName: state.flowName,
    flowDescription: state.flowDescription,
    isGlobal: state.isGlobal,
    isActive: state.isActive,
    tagsJson: JSON.stringify(state.tags),
    phoneWhitelistJson: JSON.stringify(state.phoneWhitelist),
    transformsJson: JSON.stringify(state.variableTransforms),
  }
}

/**
 * Fast comparison of snapshots
 */
function snapshotsEqual(a: FlowSnapshot | null, b: FlowSnapshot | null): boolean {
  if (!a || !b) return false
  return (
    a.nodesJson === b.nodesJson &&
    a.edgesJson === b.edgesJson &&
    a.flowName === b.flowName &&
    a.flowDescription === b.flowDescription &&
    a.isGlobal === b.isGlobal &&
    a.isActive === b.isActive &&
    a.tagsJson === b.tagsJson &&
    a.phoneWhitelistJson === b.phoneWhitelistJson &&
    a.transformsJson === b.transformsJson
  )
}

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
  phoneWhitelist: string[]  // Phone numbers that will use this flow as default
  saveVersion: number // Increments on each save to trigger list refresh

  // Change detection
  originalSnapshot: FlowSnapshot | null
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
    phoneWhitelist?: string[]
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

const initialSnapshot: FlowSnapshot = createSnapshot({
  nodes: initialNodes,
  edges: initialEdges,
  flowName: 'Novo Fluxo',
  flowDescription: '',
  isGlobal: false,
  isActive: true,
  tags: [],
  phoneWhitelist: [],
  variableTransforms: { global: [], byNode: {} },
})

export const useFlowStore = create<FlowState>()(
  subscribeWithSelector((set) => ({
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
    phoneWhitelist: [],
    originalSnapshot: initialSnapshot,
    isDirty: false,

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
        phoneWhitelist: flow.phone_whitelist ?? [],
        variableTransforms,
      })

      set({
        flowId: flow.id,
        flowName: flow.name,
        flowDescription: flow.description ?? '',
        isGlobal: flow.is_global,
        isActive: flow.is_active,
        tags: flow.tags,
        phoneWhitelist: flow.phone_whitelist ?? [],
        nodes,
        edges,
        viewport: flow.viewport,
        selectedNodeId: null,
        isPanelOpen: false,
        variableTransforms,
        originalSnapshot: snapshot,
        isDirty: false,
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
        phoneWhitelist: [],
        selectedNodeId: null,
        isPanelOpen: false,
        variableTransforms: { global: [], byNode: {} },
        originalSnapshot: initialSnapshot,
        isDirty: false,
      }),

    setFlowMeta: (meta) =>
      set((state) => ({
        flowName: meta.name ?? state.flowName,
        flowDescription: meta.description ?? state.flowDescription,
        isGlobal: meta.isGlobal ?? state.isGlobal,
        isActive: meta.isActive ?? state.isActive,
        tags: meta.tags ?? state.tags,
        phoneWhitelist: meta.phoneWhitelist ?? state.phoneWhitelist,
      })),

    setFlowId: (flowId) => set({ flowId }),

    markClean: () => set((state) => ({
      saveVersion: state.saveVersion + 1,
      originalSnapshot: createSnapshot(state),
      isDirty: false,
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
)

// Subscribe to state changes and update isDirty automatically
// This runs ONCE per state change, not on every render
useFlowStore.subscribe(
  (state) => ({
    nodes: state.nodes,
    edges: state.edges,
    flowName: state.flowName,
    flowDescription: state.flowDescription,
    isGlobal: state.isGlobal,
    isActive: state.isActive,
    tags: state.tags,
    phoneWhitelist: state.phoneWhitelist,
    variableTransforms: state.variableTransforms,
    originalSnapshot: state.originalSnapshot,
  }),
  (current, prev) => {
    // Skip if originalSnapshot changed (loading/resetting flow)
    if (current.originalSnapshot !== prev.originalSnapshot) return

    const currentSnapshot = createSnapshot(current)
    const isDirty = !snapshotsEqual(currentSnapshot, current.originalSnapshot)

    // Only update if isDirty changed
    if (isDirty !== useFlowStore.getState().isDirty) {
      useFlowStore.setState({ isDirty })
    }
  }
)

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
    case FlowNodeType.AGENT:
      return 'Agente IA'
    case FlowNodeType.CONNECTOR:
      return 'Conector'
    default:
      return 'Bloco'
  }
}
