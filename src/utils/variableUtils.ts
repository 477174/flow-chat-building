import type { Node, Edge } from '@xyflow/react'
import type { FlowNodeData, FlowButtonOption, FlowListOption } from '@/types/flow'

/**
 * Represents a variable available at a given node
 */
export interface AvailableVariable {
  name: string // Variable name (e.g., "contact_reason")
  sourceNodeId: string // Node that creates this variable
  sourceNodeLabel: string // Human-readable label of the source node
  type: 'inherited' | 'created' // inherited from upstream vs created at this node
  possibleValues: Array<{
    id: string // Button/option ID
    label: string // Human-readable label
  }>
}

/**
 * Represents a segment of text (either plain text or a variable reference)
 */
export type TextSegment =
  | { type: 'text'; content: string }
  | { type: 'variable'; name: string; raw: string }

/**
 * Find all parent nodes of a given node by traversing edges upstream
 * @param nodeId - The node to find parents for
 * @param nodes - All nodes in the flow
 * @param edges - All edges in the flow
 * @returns Array of parent node IDs
 */
export function getParentNodeIds(
  nodeId: string,
  edges: Edge[]
): string[] {
  return edges
    .filter((edge) => edge.target === nodeId)
    .map((edge) => edge.source)
}

/**
 * Recursively find all upstream nodes (ancestors) of a given node
 * @param nodeId - The starting node
 * @param nodes - All nodes in the flow
 * @param edges - All edges in the flow
 * @param visited - Set of already visited node IDs to prevent cycles
 * @returns Array of upstream node IDs (excluding the starting node)
 */
export function getUpstreamNodeIds(
  nodeId: string,
  edges: Edge[],
  visited: Set<string> = new Set()
): string[] {
  if (visited.has(nodeId)) return []
  visited.add(nodeId)

  const parentIds = getParentNodeIds(nodeId, edges)
  const allUpstream: string[] = []

  for (const parentId of parentIds) {
    allUpstream.push(parentId)
    allUpstream.push(...getUpstreamNodeIds(parentId, edges, visited))
  }

  return allUpstream
}

/**
 * Get upstream nodes objects
 */
export function getUpstreamNodes(
  nodeId: string,
  nodes: Node<FlowNodeData>[],
  edges: Edge[]
): Node<FlowNodeData>[] {
  const upstreamIds = getUpstreamNodeIds(nodeId, edges)
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))
  return upstreamIds
    .map((id) => nodeMap.get(id))
    .filter((n): n is Node<FlowNodeData> => n !== undefined)
}

/**
 * Extract variable information from a node that creates variables
 * Button nodes, option_list nodes, and wait_response nodes all create variables
 * Uses node ID for storage and variable_name (or node label) for display
 */
export function extractVariableFromNode(
  node: Node<FlowNodeData>
): Omit<AvailableVariable, 'type'> | null {
  const { data, type, id } = node
  // Priority: variable_name > label > id
  const label = data.variable_name || data.label || id

  // Button node - collect button labels as possible values
  if (type === 'button' && data.buttons?.length) {
    return {
      name: id,
      sourceNodeId: id,
      sourceNodeLabel: label,
      possibleValues: data.buttons.map((btn: FlowButtonOption) => ({
        id: btn.id,
        label: btn.label,
      })),
    }
  }

  // Option list node - collect option titles as possible values
  if (type === 'option_list' && data.options?.length) {
    return {
      name: id,
      sourceNodeId: id,
      sourceNodeLabel: label,
      possibleValues: data.options.map((opt: FlowListOption) => ({
        id: opt.id,
        label: opt.title,
      })),
    }
  }

  // Wait response node - free text input
  if (type === 'wait_response') {
    return {
      name: id,
      sourceNodeId: id,
      sourceNodeLabel: label,
      possibleValues: [], // Free text has no predefined values
    }
  }

  return null
}

/**
 * Collect all variables available at a given node
 * Only includes variables from UPSTREAM nodes - a node's own variable
 * is not available to itself (it only has a value after user interaction)
 *
 * @param nodeId - The node to collect variables for
 * @param nodes - All nodes in the flow
 * @param edges - All edges in the flow
 * @returns Array of available variables from upstream nodes
 */
export function collectAvailableVariables(
  nodeId: string,
  nodes: Node<FlowNodeData>[],
  edges: Edge[]
): AvailableVariable[] {
  const variables: AvailableVariable[] = []
  const seenVariables = new Set<string>()

  // Get all upstream nodes and collect their variables
  const upstreamNodes = getUpstreamNodes(nodeId, nodes, edges)
  for (const upstreamNode of upstreamNodes) {
    const upstreamVar = extractVariableFromNode(upstreamNode)
    if (upstreamVar && !seenVariables.has(upstreamVar.name)) {
      seenVariables.add(upstreamVar.name)
      variables.push({
        ...upstreamVar,
        type: 'inherited',
      })
    }
  }

  // Sort alphabetically by label
  return variables.sort((a, b) => a.sourceNodeLabel.localeCompare(b.sourceNodeLabel))
}

/**
 * Parse text to find variable references
 * @param text - Text containing {{variable}} syntax
 * @returns Array of variable names found
 */
export function parseVariableNames(text: string): string[] {
  const regex = /\{\{([\w-]+)\}\}/g
  const matches: string[] = []
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    matches.push(match[1])
  }

  return [...new Set(matches)] // Deduplicate
}

/**
 * Convert text with {{var}} to segments for rendering
 * @param text - Text containing {{variable}} syntax
 * @returns Array of text and variable segments
 */
export function textToSegments(text: string): TextSegment[] {
  if (!text) return []

  const segments: TextSegment[] = []
  const regex = /\{\{([\w-]+)\}\}/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: text.slice(lastIndex, match.index),
      })
    }

    // Add the variable
    segments.push({
      type: 'variable',
      name: match[1],
      raw: match[0],
    })

    lastIndex = match.index + match[0].length
  }

  // Add remaining text after last match
  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.slice(lastIndex),
    })
  }

  return segments
}

/**
 * Convert segments back to raw text with {{var}} syntax
 * @param segments - Array of text and variable segments
 * @returns Raw text string
 */
export function segmentsToText(segments: TextSegment[]): string {
  return segments
    .map((seg) => (seg.type === 'text' ? seg.content : `{{${seg.name}}}`))
    .join('')
}

/**
 * Insert a variable at a specific position in text
 * @param text - Original text
 * @param variableName - Variable name to insert
 * @param position - Character position to insert at
 * @returns Updated text with variable inserted
 */
export function insertVariableAtPosition(
  text: string,
  variableName: string,
  position: number
): string {
  const before = text.slice(0, position)
  const after = text.slice(position)
  return `${before}{{${variableName}}}${after}`
}

/**
 * Remove a variable from text at a specific segment index
 * @param text - Original text
 * @param variableIndex - Index of the variable segment to remove
 * @returns Updated text with variable removed
 */
export function removeVariableAtIndex(
  text: string,
  variableIndex: number
): string {
  const segments = textToSegments(text)
  let varCount = 0

  const filtered = segments.filter((seg) => {
    if (seg.type === 'variable') {
      if (varCount === variableIndex) {
        varCount++
        return false
      }
      varCount++
    }
    return true
  })

  return segmentsToText(filtered)
}
