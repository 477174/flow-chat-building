import type { Node, Edge, Viewport } from '@xyflow/react'

export const FlowNodeType = {
  MESSAGE: 'message',
  BUTTON: 'button',
  WAIT_RESPONSE: 'wait_response',
  CONDITIONAL: 'conditional',
  START: 'start',
  END: 'end',
} as const

export type FlowNodeType = (typeof FlowNodeType)[keyof typeof FlowNodeType]

export const FlowMessageType = {
  TEXT: 'text',
  IMAGE: 'image',
  AUDIO: 'audio',
  VIDEO: 'video',
  DOCUMENT: 'document',
} as const

export type FlowMessageType = (typeof FlowMessageType)[keyof typeof FlowMessageType]

export const FlowConditionOperator = {
  EQUALS: 'equals',
  NOT_EQUALS: 'not_equals',
  CONTAINS: 'contains',
  NOT_CONTAINS: 'not_contains',
  STARTS_WITH: 'starts_with',
  ENDS_WITH: 'ends_with',
  REGEX: 'regex',
  EXISTS: 'exists',
  NOT_EXISTS: 'not_exists',
} as const

export type FlowConditionOperator =
  (typeof FlowConditionOperator)[keyof typeof FlowConditionOperator]

export const FlowSimulationStatus = {
  PENDING: 'pending',
  RUNNING: 'running',
  WAITING_INPUT: 'waiting_input',
  COMPLETED: 'completed',
  ERROR: 'error',
} as const

export type FlowSimulationStatus =
  (typeof FlowSimulationStatus)[keyof typeof FlowSimulationStatus]

export interface FlowButtonOption {
  id: string
  label: string
  value?: string
  next_node_id?: string
}

export interface FlowCondition {
  id: string
  variable: string
  operator: FlowConditionOperator
  value?: string
  next_node_id?: string
}

export interface FlowNodeData extends Record<string, unknown> {
  label?: string
  message_type?: FlowMessageType
  content?: string
  media_url?: string
  buttons?: FlowButtonOption[]
  conditions?: FlowCondition[]
  timeout_seconds?: number
  timeout_next_node_id?: string
  variable_name?: string
  default_next_node_id?: string
}

export interface FlowNodePosition {
  x: number
  y: number
}

export interface FlowNodeBase {
  id: string
  type: FlowNodeType
  position: FlowNodePosition
  data: FlowNodeData
}

export interface FlowEdgeBase {
  id: string
  source: string
  target: string
  source_handle?: string
  target_handle?: string
  label?: string
}

export interface FlowTemplate {
  _id: string
  name: string
  description?: string
  nodes: FlowNodeBase[]
  edges: FlowEdgeBase[]
  viewport: Viewport
  is_global: boolean
  is_active: boolean
  tags: string[]
  client_id?: string
  created_at: string
  updated_at: string
  created_by?: string
  version: number
}

export interface FlowTemplateCreate {
  name: string
  description?: string
  nodes: FlowNodeBase[]
  edges: FlowEdgeBase[]
  viewport?: Viewport
  is_global?: boolean
  is_active?: boolean
  tags?: string[]
  client_id?: string
}

export interface FlowTemplateUpdate {
  name?: string
  description?: string
  nodes?: FlowNodeBase[]
  edges?: FlowEdgeBase[]
  viewport?: Viewport
  is_global?: boolean
  is_active?: boolean
  tags?: string[]
}

export interface FlowSimulationMessage {
  id: string
  node_id?: string
  direction: 'outgoing' | 'incoming'
  message_type: FlowMessageType
  content: string
  media_url?: string
  buttons?: FlowButtonOption[]
  timestamp: string
}

export interface FlowSimulation {
  _id: string
  flow_id: string
  client_id?: string
  status: FlowSimulationStatus
  current_node_id?: string
  variables: Record<string, unknown>
  messages: FlowSimulationMessage[]
  created_at: string
  updated_at: string
  completed_at?: string
  error_message?: string
}

export interface FlowSimulationInput {
  text?: string
  button_id?: string
}

export interface FlowSimulationResponse {
  simulation_id: string
  status: FlowSimulationStatus
  current_node_id?: string
  messages: FlowSimulationMessage[]
  waiting_for_input: boolean
  variables: Record<string, unknown>
}

// React Flow compatible types
export type CustomNode = Node<FlowNodeData, FlowNodeType>
export type CustomEdge = Edge
