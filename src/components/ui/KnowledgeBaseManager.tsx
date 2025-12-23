import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, FileText, FolderPlus, Loader2, Plus, Trash2, Upload, X } from 'lucide-react'
import {
  listKnowledgeBases,
  createKnowledgeBase,
  deleteKnowledgeBase,
  addDocument,
  listDocuments,
  deleteDocument,
  type KnowledgeBase,
  type KnowledgeDocument,
} from '@/services/knowledgeBaseApi'

interface KnowledgeBaseManagerProps {
  selectedKbIds: string[]
  onSelectionChange: (ids: string[]) => void
}

export default function KnowledgeBaseManager({ selectedKbIds, onSelectionChange }: KnowledgeBaseManagerProps) {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([])
  const [loadingKbs, setLoadingKbs] = useState(false)
  const [kbError, setKbError] = useState<string | null>(null)

  // Knowledge base management state
  const [showCreateKb, setShowCreateKb] = useState(false)
  const [newKbName, setNewKbName] = useState('')
  const [newKbDescription, setNewKbDescription] = useState('')
  const [creatingKb, setCreatingKb] = useState(false)

  // Document management state
  const [expandedKbId, setExpandedKbId] = useState<string | null>(null)
  const [kbDocuments, setKbDocuments] = useState<Record<string, KnowledgeDocument[]>>({})
  const [loadingDocs, setLoadingDocs] = useState<string | null>(null)
  const [showAddDoc, setShowAddDoc] = useState<string | null>(null)
  const [newDocName, setNewDocName] = useState('')
  const [newDocContent, setNewDocContent] = useState('')
  const [addingDoc, setAddingDoc] = useState(false)

  // Fetch knowledge bases
  const fetchKnowledgeBases = async () => {
    setLoadingKbs(true)
    setKbError(null)
    try {
      const kbs = await listKnowledgeBases()
      setKnowledgeBases(kbs)
    } catch (err) {
      console.error('Failed to fetch knowledge bases:', err)
      setKbError('Erro ao carregar bases de conhecimento')
    } finally {
      setLoadingKbs(false)
    }
  }

  useEffect(() => {
    fetchKnowledgeBases()
  }, [])

  // Fetch documents for a knowledge base
  const fetchDocuments = async (kbId: string) => {
    setLoadingDocs(kbId)
    try {
      const docs = await listDocuments(kbId)
      setKbDocuments(prev => ({ ...prev, [kbId]: docs }))
    } catch (err) {
      console.error('Failed to fetch documents:', err)
    } finally {
      setLoadingDocs(null)
    }
  }

  const toggleKnowledgeBase = (kbId: string) => {
    if (selectedKbIds.includes(kbId)) {
      onSelectionChange(selectedKbIds.filter(id => id !== kbId))
    } else {
      onSelectionChange([...selectedKbIds, kbId])
    }
  }

  const handleCreateKb = async () => {
    if (!newKbName.trim()) return
    setCreatingKb(true)
    try {
      await createKnowledgeBase({
        name: newKbName.trim(),
        description: newKbDescription.trim() || undefined,
      })
      setNewKbName('')
      setNewKbDescription('')
      setShowCreateKb(false)
      await fetchKnowledgeBases()
    } catch (err) {
      console.error('Failed to create knowledge base:', err)
    } finally {
      setCreatingKb(false)
    }
  }

  const handleDeleteKb = async (kbId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Excluir esta base de conhecimento e todos os documentos?')) return
    try {
      await deleteKnowledgeBase(kbId)
      if (selectedKbIds.includes(kbId)) {
        onSelectionChange(selectedKbIds.filter(id => id !== kbId))
      }
      await fetchKnowledgeBases()
    } catch (err) {
      console.error('Failed to delete knowledge base:', err)
    }
  }

  const handleAddDocument = async (kbId: string) => {
    if (!newDocName.trim() || !newDocContent.trim()) return
    setAddingDoc(true)
    try {
      await addDocument(kbId, {
        name: newDocName.trim(),
        content: newDocContent.trim(),
      })
      setNewDocName('')
      setNewDocContent('')
      setShowAddDoc(null)
      await fetchDocuments(kbId)
      await fetchKnowledgeBases()
    } catch (err) {
      console.error('Failed to add document:', err)
    } finally {
      setAddingDoc(false)
    }
  }

  const handleDeleteDocument = async (kbId: string, docId: string) => {
    if (!confirm('Excluir este documento?')) return
    try {
      await deleteDocument(kbId, docId)
      await fetchDocuments(kbId)
      await fetchKnowledgeBases()
    } catch (err) {
      console.error('Failed to delete document:', err)
    }
  }

  const toggleExpandKb = (kbId: string) => {
    if (expandedKbId === kbId) {
      setExpandedKbId(null)
    } else {
      setExpandedKbId(kbId)
      if (!kbDocuments[kbId]) {
        fetchDocuments(kbId)
      }
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">
        Conecte bases de conhecimento para enriquecer as respostas do agente.
      </p>

      {/* Create new knowledge base */}
      {showCreateKb ? (
        <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 space-y-2">
          <input
            type="text"
            value={newKbName}
            onChange={(e) => setNewKbName(e.target.value)}
            placeholder="Nome da base"
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
          />
          <input
            type="text"
            value={newKbDescription}
            onChange={(e) => setNewKbDescription(e.target.value)}
            placeholder="Descrição (opcional)"
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCreateKb}
              disabled={creatingKb || !newKbName.trim()}
              className="flex-1 px-3 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-1"
            >
              {creatingKb ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              Criar
            </button>
            <button
              type="button"
              onClick={() => { setShowCreateKb(false); setNewKbName(''); setNewKbDescription('') }}
              className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowCreateKb(true)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 border border-purple-200"
        >
          <FolderPlus className="w-4 h-4" />
          Nova Base de Conhecimento
        </button>
      )}

      {loadingKbs ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
          <span className="ml-2 text-sm text-gray-500">Carregando...</span>
        </div>
      ) : kbError ? (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          {kbError}
        </div>
      ) : knowledgeBases.length === 0 ? (
        <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg text-center">
          Nenhuma base de conhecimento disponível.
        </div>
      ) : (
        <div className="space-y-2">
          {knowledgeBases.map((kb) => (
            <div key={kb.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <div
                className={`flex items-start gap-2 p-2 cursor-pointer transition-colors ${
                  selectedKbIds.includes(kb.id) ? 'bg-purple-50' : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedKbIds.includes(kb.id)}
                  onChange={() => toggleKnowledgeBase(kb.id)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <div className="flex-1 min-w-0" onClick={() => toggleExpandKb(kb.id)}>
                  <div className="text-sm font-medium text-gray-700 truncate flex items-center gap-1">
                    {expandedKbId === kb.id ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    {kb.name}
                  </div>
                  {kb.description && (
                    <div className="text-xs text-gray-500 truncate ml-4">{kb.description}</div>
                  )}
                  <div className="text-xs text-gray-400 mt-0.5 ml-4">
                    {kb.document_count} documento{kb.document_count !== 1 ? 's' : ''}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => handleDeleteKb(kb.id, e)}
                  className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                  title="Excluir base"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {expandedKbId === kb.id && (
                <div className="border-t border-gray-200 bg-white p-2 space-y-2">
                  {loadingDocs === kb.id ? (
                    <div className="flex items-center justify-center py-2">
                      <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
                    </div>
                  ) : (
                    <>
                      {kbDocuments[kb.id]?.length > 0 ? (
                        <div className="space-y-1">
                          {kbDocuments[kb.id].map((doc) => (
                            <div key={doc.id} className="flex items-center gap-2 px-2 py-1 bg-gray-50 rounded text-xs">
                              <FileText className="w-3 h-3 text-gray-400" />
                              <span className="flex-1 truncate text-gray-700">{doc.name}</span>
                              <span className="text-gray-400">{(doc.content_length / 1024).toFixed(1)}KB</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteDocument(kb.id, doc.id)}
                                className="p-0.5 text-gray-400 hover:text-red-500"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 text-center py-1">Nenhum documento</p>
                      )}

                      {showAddDoc === kb.id ? (
                        <div className="space-y-2 p-2 bg-blue-50 rounded border border-blue-200">
                          <input
                            type="text"
                            value={newDocName}
                            onChange={(e) => setNewDocName(e.target.value)}
                            placeholder="Nome do documento"
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <textarea
                            value={newDocContent}
                            onChange={(e) => setNewDocContent(e.target.value)}
                            placeholder="Conteúdo do documento (texto que será indexado)..."
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 resize-none"
                            rows={4}
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleAddDocument(kb.id)}
                              disabled={addingDoc || !newDocName.trim() || !newDocContent.trim()}
                              className="flex-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-1"
                            >
                              {addingDoc ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                              Adicionar
                            </button>
                            <button
                              type="button"
                              onClick={() => { setShowAddDoc(null); setNewDocName(''); setNewDocContent('') }}
                              className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowAddDoc(kb.id)}
                          className="w-full flex items-center justify-center gap-1 px-2 py-1.5 text-xs text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                        >
                          <Plus className="w-3 h-3" />
                          Adicionar Documento
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedKbIds.length > 0 && (
        <p className="text-xs text-purple-600 bg-purple-50 p-2 rounded">
          O agente usará contexto relevante das bases selecionadas para responder perguntas.
        </p>
      )}
    </div>
  )
}
