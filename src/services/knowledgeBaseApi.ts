/**
 * Knowledge Base API Service
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8003'

export interface KnowledgeBase {
  id: string
  name: string
  description: string | null
  embedding_model: string
  chunk_size: number
  chunk_overlap: number
  document_count: number
  created_at: string | null
  updated_at: string | null
}

export interface KnowledgeDocument {
  id: string
  knowledge_base_id: string
  name: string
  content_type: string
  content_length: number
  created_at: string | null
  updated_at: string | null
}

export interface CreateKnowledgeBaseRequest {
  name: string
  description?: string
  chunk_size?: number
  chunk_overlap?: number
}

export interface UpdateKnowledgeBaseRequest {
  name?: string
  description?: string
}

export interface AddDocumentRequest {
  name: string
  content: string
  content_type?: string
}

// ==================== Knowledge Base Operations ====================

export async function listKnowledgeBases(): Promise<KnowledgeBase[]> {
  const response = await fetch(`${API_BASE}/knowledge-bases`)
  if (!response.ok) {
    throw new Error('Failed to list knowledge bases')
  }
  return response.json()
}

export async function getKnowledgeBase(id: string): Promise<KnowledgeBase> {
  const response = await fetch(`${API_BASE}/knowledge-bases/${id}`)
  if (!response.ok) {
    throw new Error('Failed to get knowledge base')
  }
  return response.json()
}

export async function createKnowledgeBase(
  data: CreateKnowledgeBaseRequest
): Promise<KnowledgeBase> {
  const response = await fetch(`${API_BASE}/knowledge-bases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('Failed to create knowledge base')
  }
  return response.json()
}

export async function updateKnowledgeBase(
  id: string,
  data: UpdateKnowledgeBaseRequest
): Promise<KnowledgeBase> {
  const response = await fetch(`${API_BASE}/knowledge-bases/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('Failed to update knowledge base')
  }
  return response.json()
}

export async function deleteKnowledgeBase(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/knowledge-bases/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw new Error('Failed to delete knowledge base')
  }
}

// ==================== Document Operations ====================

export async function listDocuments(kbId: string): Promise<KnowledgeDocument[]> {
  const response = await fetch(`${API_BASE}/knowledge-bases/${kbId}/documents`)
  if (!response.ok) {
    throw new Error('Failed to list documents')
  }
  return response.json()
}

export async function addDocument(
  kbId: string,
  data: AddDocumentRequest
): Promise<KnowledgeDocument> {
  const response = await fetch(`${API_BASE}/knowledge-bases/${kbId}/documents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('Failed to add document')
  }
  return response.json()
}

export async function deleteDocument(kbId: string, docId: string): Promise<void> {
  const response = await fetch(
    `${API_BASE}/knowledge-bases/${kbId}/documents/${docId}`,
    { method: 'DELETE' }
  )
  if (!response.ok) {
    throw new Error('Failed to delete document')
  }
}
