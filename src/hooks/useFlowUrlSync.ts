import { useEffect, useRef, useCallback } from 'react'
import { useFlowStore } from '@/stores/flowStore'
import { getFlow } from '@/services/api'

/**
 * Hook to synchronize flow ID with browser URL and history.
 * URL format: /flows/{flowId} or / for no flow
 * - Reads flow ID from URL path on mount and loads the flow
 * - Updates URL when flow changes (push to history)
 * - Handles browser back/forward navigation
 */
export function useFlowUrlSync() {
  // Use individual selectors to prevent unnecessary re-renders
  const flowId = useFlowStore((state) => state.flowId)
  const loadFlow = useFlowStore((state) => state.loadFlow)
  const resetFlow = useFlowStore((state) => state.resetFlow)
  const isDirty = useFlowStore((state) => state.isDirty)
  const isNavigating = useRef(false)
  const initialLoadDone = useRef(false)

  // Parse flow ID from URL path: /flows/{flowId}
  const getFlowIdFromUrl = useCallback((): string | null => {
    const match = window.location.pathname.match(/^\/flows\/([^/]+)/)
    return match ? match[1] : null
  }, [])

  // Update URL with flow ID as path
  const updateUrl = useCallback((id: string | null, replace = false) => {
    const newPath = id ? `/flows/${id}` : '/'

    if (replace) {
      window.history.replaceState({ flowId: id }, '', newPath)
    } else {
      window.history.pushState({ flowId: id }, '', newPath)
    }
  }, [])

  // Load flow by ID
  const loadFlowById = useCallback(async (id: string) => {
    try {
      const flow = await getFlow(id)
      loadFlow(flow)
    } catch (error) {
      console.error('Failed to load flow from URL:', error)
      // Clear invalid flow ID from URL
      updateUrl(null, true)
    }
  }, [loadFlow, updateUrl])

  // Handle initial load from URL
  useEffect(() => {
    if (initialLoadDone.current) return
    initialLoadDone.current = true

    const urlFlowId = getFlowIdFromUrl()
    if (urlFlowId) {
      loadFlowById(urlFlowId)
    }
  }, [getFlowIdFromUrl, loadFlowById])

  // Sync URL when flowId changes in store
  useEffect(() => {
    // Skip if this change was triggered by navigation (popstate)
    if (isNavigating.current) {
      isNavigating.current = false
      return
    }

    // Skip initial render before first load completes
    if (!initialLoadDone.current) return

    const urlFlowId = getFlowIdFromUrl()

    // Only update URL if flow ID actually changed
    if (flowId !== urlFlowId) {
      updateUrl(flowId)
    }
  }, [flowId, getFlowIdFromUrl, updateUrl])

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = async (event: PopStateEvent) => {
      isNavigating.current = true

      const targetFlowId = event.state?.flowId || getFlowIdFromUrl()

      if (targetFlowId && targetFlowId !== flowId) {
        if (isDirty) {
          const confirm = window.confirm(
            'Você tem alterações não salvas. Deseja continuar?'
          )
          if (!confirm) {
            // Restore the URL to current flow
            updateUrl(flowId, true)
            isNavigating.current = false
            return
          }
        }
        await loadFlowById(targetFlowId)
      } else if (!targetFlowId && flowId) {
        if (isDirty) {
          const confirm = window.confirm(
            'Você tem alterações não salvas. Deseja continuar?'
          )
          if (!confirm) {
            updateUrl(flowId, true)
            isNavigating.current = false
            return
          }
        }
        resetFlow()
      }

      isNavigating.current = false
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [flowId, isDirty, getFlowIdFromUrl, loadFlowById, resetFlow, updateUrl])
}
