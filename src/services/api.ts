import axios from 'axios'
import type {
  FlowTemplate,
  FlowTemplateCreate,
  FlowTemplateUpdate,
  FlowSimulation,
  FlowSimulationResponse,
  FlowSimulationInput,
} from '@/types/flow'

// API base URL from environment variable
// In development with Vite proxy: '/api' (default)
// In production: full URL like 'https://api.example.com'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL
  : '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Flow Templates
export async function getFlows(params?: {
  client_id?: string
  include_global?: boolean
  is_active?: boolean
  tags?: string[]
  skip?: number
  limit?: number
}): Promise<FlowTemplate[]> {
  const { data } = await api.get<FlowTemplate[]>('/flows', { params })
  return data
}

export async function getFlow(flowId: string): Promise<FlowTemplate> {
  const { data } = await api.get<FlowTemplate>(`/flows/${flowId}`)
  return data
}

export async function createFlow(flow: FlowTemplateCreate): Promise<FlowTemplate> {
  const { data } = await api.post<FlowTemplate>('/flows', flow)
  return data
}

export async function updateFlow(
  flowId: string,
  flow: FlowTemplateUpdate
): Promise<FlowTemplate> {
  const { data } = await api.put<FlowTemplate>(`/flows/${flowId}`, flow)
  return data
}

export async function deleteFlow(flowId: string): Promise<void> {
  await api.delete(`/flows/${flowId}`)
}

export async function duplicateFlow(
  flowId: string,
  params?: { new_name?: string; client_id?: string }
): Promise<FlowTemplate> {
  const { data } = await api.post<FlowTemplate>(`/flows/${flowId}/duplicate`, null, {
    params,
  })
  return data
}

// Simulations
export async function createSimulation(params: {
  flow_id: string
  client_id?: string
}): Promise<FlowSimulation> {
  const { data } = await api.post<FlowSimulation>('/simulations', params)
  return data
}

export async function getSimulation(simulationId: string): Promise<FlowSimulation> {
  const { data } = await api.get<FlowSimulation>(`/simulations/${simulationId}`)
  return data
}

export async function startSimulation(
  simulationId: string
): Promise<FlowSimulationResponse> {
  const { data } = await api.post<FlowSimulationResponse>(
    `/simulations/${simulationId}/start`
  )
  return data
}

export async function sendSimulationInput(
  simulationId: string,
  input: FlowSimulationInput
): Promise<FlowSimulationResponse> {
  const { data } = await api.post<FlowSimulationResponse>(
    `/simulations/${simulationId}/input`,
    input
  )
  return data
}

// Helper to build WebSocket URL from API base URL
function getWebSocketUrl(path: string): string {
  // If API_BASE_URL is a full URL, extract host and use it
  if (API_BASE_URL.startsWith('http://') || API_BASE_URL.startsWith('https://')) {
    const url = new URL(API_BASE_URL)
    const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${wsProtocol}//${url.host}${path}`
  }
  // Otherwise use current window location (for proxy mode)
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}${API_BASE_URL}${path}`
}

// WebSocket connection for real-time simulation
export function createSimulationWebSocket(simulationId: string): WebSocket {
  return new WebSocket(getWebSocketUrl(`/simulations/${simulationId}/ws`))
}

// Occupancy & Lead Tracking
export interface NodeOccupancy {
  node_id: string
  count: number
  leads: LeadPosition[]
}

export interface FlowOccupancy {
  [nodeId: string]: NodeOccupancy
}

// API response wrapper for flow occupancy
interface FlowOccupancyApiResponse {
  flow_id: string
  total_leads: number
  occupancy: FlowOccupancy
}

export interface LeadSearchResult {
  phone: string
  session_id: string
  flow_id: string | null
  current_node_id: string | null
  node_entered_at: string | null
  duration_seconds: number
  variables: Record<string, unknown>
  flow_name?: string | null
}

export interface LeadPosition {
  phone: string
  session_id: string | null
  node_id: string | null
  node_entered_at: string | null
}

export interface LeadSearchResponse {
  found: boolean
  lead: LeadSearchResult | null
}

export async function getFlowOccupancy(flowId: string): Promise<FlowOccupancy> {
  const { data } = await api.get<FlowOccupancyApiResponse>(`/flows/${flowId}/occupancy`)
  return data.occupancy
}

export async function getNodeOccupancy(
  flowId: string,
  nodeId: string
): Promise<{ count: number; leads: LeadSearchResult[] }> {
  const { data } = await api.get(`/flows/${flowId}/nodes/${nodeId}/occupancy`)
  return data
}

export async function getLeadsOnNode(
  flowId: string,
  nodeId: string
): Promise<LeadPosition[]> {
  const { data } = await api.get<LeadPosition[]>(`/flows/${flowId}/nodes/${nodeId}/leads`)
  return data
}

export async function getTotalLeadsInFlow(flowId: string): Promise<{ count: number }> {
  const { data } = await api.get<{ count: number }>(`/flows/${flowId}/leads/count`)
  return data
}

export async function searchLeadByPhone(
  phone: string,
  flowId?: string
): Promise<LeadSearchResponse> {
  const { data } = await api.get<LeadSearchResponse>('/leads/search', {
    params: { phone, flow_id: flowId },
  })
  return data
}

export async function getLeadsInFlow(
  flowId: string,
  nodeId?: string,
  limit?: number
): Promise<LeadSearchResult[]> {
  const { data } = await api.get<LeadSearchResult[]>(`/flows/${flowId}/leads`, {
    params: { node_id: nodeId, limit },
  })
  return data
}

// WebSocket for real-time occupancy updates
export function createOccupancyWebSocket(flowId: string): WebSocket {
  return new WebSocket(getWebSocketUrl(`/flows/${flowId}/occupancy/ws`))
}

// Active Flow Settings
export interface ActiveFlowResponse {
  active_flow_id: string | null
  active_flow_name: string | null
  is_active: boolean
}

export async function getActiveFlow(): Promise<ActiveFlowResponse> {
  const { data } = await api.get<ActiveFlowResponse>('/settings/active-flow')
  return data
}

export async function setActiveFlow(flowId: string): Promise<ActiveFlowResponse> {
  const { data } = await api.post<ActiveFlowResponse>('/settings/active-flow', {
    flow_id: flowId,
  })
  return data
}

export async function clearActiveFlow(): Promise<void> {
  await api.delete('/settings/active-flow')
}

export default api
