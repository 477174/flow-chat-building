/**
 * Local simulation engine - runs flow simulation entirely client-side
 */

import { v4 as uuid } from 'uuid'
import {
  FlowNodeType,
  FlowSimulationStatus,
  FlowMessageType,
  type FlowNodeData,
  type FlowSimulationMessage,
  type FlowSimulationResponse,
  type FlowSimulationInput,
  type FlowButtonOption,
  type FlowListOption,
} from '@/types/flow'
import type { Node, Edge } from '@xyflow/react'

interface SimulationState {
  currentNodeId: string | null
  variables: Record<string, unknown>
  messages: FlowSimulationMessage[]
  status: typeof FlowSimulationStatus[keyof typeof FlowSimulationStatus]
}

// In-memory simulation states
const simulations = new Map<string, SimulationState>()

type FlowNode = Node<FlowNodeData, string>

function getNode(nodes: FlowNode[], nodeId: string | null): FlowNode | undefined {
  if (!nodeId) return undefined
  return nodes.find((n) => n.id === nodeId)
}

function getNextNodeFromEdge(edges: Edge[], nodeId: string, sourceHandle?: string): string | null {
  // First try to find edge with matching sourceHandle
  if (sourceHandle) {
    const handleEdge = edges.find((e) => e.source === nodeId && e.sourceHandle === sourceHandle)
    if (handleEdge) return handleEdge.target
  }
  // Fallback to any edge from this node
  const edge = edges.find((e) => e.source === nodeId)
  return edge?.target ?? null
}

function substituteVariables(content: string, variables: Record<string, unknown>): string {
  return content.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    const value = variables[varName.trim()]
    return value !== undefined ? String(value) : match
  })
}

function createMessage(
  nodeId: string,
  direction: 'outgoing' | 'incoming',
  content: string,
  options?: {
    messageType?: typeof FlowMessageType[keyof typeof FlowMessageType]
    mediaUrl?: string
    buttons?: FlowButtonOption[]
    listOptions?: FlowListOption[]
  }
): FlowSimulationMessage {
  return {
    id: uuid(),
    node_id: nodeId,
    direction,
    message_type: options?.messageType ?? FlowMessageType.TEXT,
    content,
    media_url: options?.mediaUrl,
    buttons: options?.buttons,
    timestamp: new Date().toISOString(),
  }
}

function processNode(
  state: SimulationState,
  nodes: FlowNode[],
  edges: Edge[],
  stepCount = 0
): void {
  if (stepCount > 100) {
    state.status = FlowSimulationStatus.ERROR
    return
  }

  const node = getNode(nodes, state.currentNodeId)
  if (!node) {
    state.status = FlowSimulationStatus.ERROR
    return
  }

  const { type, data, id } = node

  switch (type) {
    case FlowNodeType.START: {
      const nextId = getNextNodeFromEdge(edges, id)
      if (nextId) {
        state.currentNodeId = nextId
        processNode(state, nodes, edges, stepCount + 1)
      } else {
        state.status = FlowSimulationStatus.COMPLETED
      }
      break
    }

    case FlowNodeType.MESSAGE: {
      const content = substituteVariables(data.content ?? '', state.variables)
      state.messages.push(
        createMessage(id, 'outgoing', content, {
          messageType: data.message_type,
          mediaUrl: data.media_url,
        })
      )
      const nextId = getNextNodeFromEdge(edges, id)
      if (nextId) {
        state.currentNodeId = nextId
        processNode(state, nodes, edges, stepCount + 1)
      } else {
        state.status = FlowSimulationStatus.COMPLETED
      }
      break
    }

    case FlowNodeType.BUTTON: {
      const content = substituteVariables(data.content ?? '', state.variables)
      const buttons = (data.buttons ?? []) as FlowButtonOption[]
      state.messages.push(
        createMessage(id, 'outgoing', content, { buttons })
      )
      state.status = FlowSimulationStatus.WAITING_INPUT
      break
    }

    case FlowNodeType.OPTION_LIST: {
      const content = substituteVariables(data.content ?? '', state.variables)
      const options = (data.options ?? []) as FlowListOption[]
      // Convert options to buttons for display
      const buttons: FlowButtonOption[] = options.map((opt) => ({
        id: opt.id,
        label: opt.title,
        value: opt.id,
      }))
      const listInfo = data.list_title
        ? `\n\n📋 ${data.list_title}\n[${data.list_button_label ?? 'Select'}]`
        : ''
      state.messages.push(
        createMessage(id, 'outgoing', content + listInfo, { buttons })
      )
      state.status = FlowSimulationStatus.WAITING_INPUT
      break
    }

    case FlowNodeType.WAIT_RESPONSE: {
      if (data.content) {
        const content = substituteVariables(data.content, state.variables)
        state.messages.push(createMessage(id, 'outgoing', content))
      }
      state.status = FlowSimulationStatus.WAITING_INPUT
      break
    }

    case FlowNodeType.CONDITIONAL: {
      // For now, just follow the default path
      const nextId = data.default_next_node_id ?? getNextNodeFromEdge(edges, id)
      if (nextId) {
        state.currentNodeId = nextId
        processNode(state, nodes, edges, stepCount + 1)
      } else {
        state.status = FlowSimulationStatus.COMPLETED
      }
      break
    }

    case FlowNodeType.END: {
      state.status = FlowSimulationStatus.COMPLETED
      break
    }

    default:
      state.status = FlowSimulationStatus.ERROR
  }
}

export function createLocalSimulation(
  simulationId: string,
  nodes: FlowNode[],
  edges: Edge[]
): SimulationState {
  const startNode = nodes.find((n) => n.type === FlowNodeType.START)

  const state: SimulationState = {
    currentNodeId: startNode?.id ?? null,
    variables: {},
    messages: [],
    status: FlowSimulationStatus.PENDING,
  }

  simulations.set(simulationId, state)
  return state
}

export function startLocalSimulation(
  simulationId: string,
  nodes: FlowNode[],
  edges: Edge[]
): FlowSimulationResponse {
  let state = simulations.get(simulationId)

  if (!state) {
    state = createLocalSimulation(simulationId, nodes, edges)
  }

  state.status = FlowSimulationStatus.RUNNING
  state.messages = []

  processNode(state, nodes, edges)

  return {
    simulation_id: simulationId,
    status: state.status,
    current_node_id: state.currentNodeId ?? undefined,
    messages: state.messages,
    waiting_for_input: state.status === FlowSimulationStatus.WAITING_INPUT,
    variables: state.variables,
  }
}

export function processLocalInput(
  simulationId: string,
  input: FlowSimulationInput,
  nodes: FlowNode[],
  edges: Edge[]
): FlowSimulationResponse {
  const state = simulations.get(simulationId)

  if (!state) {
    return {
      simulation_id: simulationId,
      status: FlowSimulationStatus.ERROR,
      messages: [],
      waiting_for_input: false,
      variables: {},
    }
  }

  const currentNode = getNode(nodes, state.currentNodeId)
  if (!currentNode) {
    state.status = FlowSimulationStatus.ERROR
    return {
      simulation_id: simulationId,
      status: state.status,
      current_node_id: state.currentNodeId ?? undefined,
      messages: [],
      waiting_for_input: false,
      variables: state.variables,
    }
  }

  const newMessages: FlowSimulationMessage[] = []

  // Record incoming message
  const incomingContent = input.text ?? input.button_id ?? ''
  if (incomingContent) {
    // Find button label if button_id provided
    let displayContent = incomingContent
    if (input.button_id) {
      const buttons = (currentNode.data.buttons ?? []) as FlowButtonOption[]
      const options = (currentNode.data.options ?? []) as FlowListOption[]
      const button = buttons.find((b) => b.id === input.button_id)
      const option = options.find((o) => o.id === input.button_id)
      displayContent = button?.label ?? option?.title ?? input.button_id
    }

    const incomingMsg = createMessage(state.currentNodeId!, 'incoming', displayContent)
    state.messages.push(incomingMsg)
    newMessages.push(incomingMsg)
  }

  // Store variable if configured
  if (currentNode.data.variable_name) {
    state.variables[currentNode.data.variable_name] = input.text ?? input.button_id
  }

  // Determine next node
  let nextNodeId: string | null = null

  if (currentNode.type === FlowNodeType.BUTTON || currentNode.type === FlowNodeType.OPTION_LIST) {
    // Try to find edge from button/option handle
    if (input.button_id) {
      nextNodeId = getNextNodeFromEdge(edges, currentNode.id, input.button_id)
    }
    // Fallback to default
    if (!nextNodeId) {
      nextNodeId = currentNode.data.default_next_node_id ?? getNextNodeFromEdge(edges, currentNode.id, 'default')
    }
  } else if (currentNode.type === FlowNodeType.WAIT_RESPONSE) {
    nextNodeId = currentNode.data.default_next_node_id ?? getNextNodeFromEdge(edges, currentNode.id)
  }

  if (nextNodeId) {
    state.currentNodeId = nextNodeId
    state.status = FlowSimulationStatus.RUNNING

    // Process next nodes
    const beforeCount = state.messages.length
    processNode(state, nodes, edges)

    // Collect new messages added during processing
    for (let i = beforeCount; i < state.messages.length; i++) {
      newMessages.push(state.messages[i])
    }
  } else {
    state.status = FlowSimulationStatus.COMPLETED
  }

  return {
    simulation_id: simulationId,
    status: state.status,
    current_node_id: state.currentNodeId ?? undefined,
    messages: newMessages,
    waiting_for_input: state.status === FlowSimulationStatus.WAITING_INPUT,
    variables: state.variables,
  }
}

export function endLocalSimulation(simulationId: string): void {
  simulations.delete(simulationId)
}
