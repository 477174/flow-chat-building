import { useState, useCallback, useRef, useEffect } from 'react'
import {
  DndContext,
  DragOverlay,
  useDroppable,
  useDraggable,
  type DragStartEvent,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { AvailableVariable } from '@/utils/variableUtils'
import { CompactVariablePalette } from './VariablePalette'

interface VariableTextEditorProps {
  value: string
  onChange: (value: string) => void
  availableVariables: AvailableVariable[]
  placeholder?: string
  rows?: number
  className?: string
}

// Token types
type TextToken = { type: 'text'; value: string }
type VariableToken = { type: 'variable'; nodeId: string; label: string }
type Token = TextToken | VariableToken

/**
 * Rich text editor with variable chips
 * Variables can be dragged from palette or repositioned within editor
 */
export default function VariableTextEditor({
  value,
  onChange,
  availableVariables,
  placeholder = 'Enter your message...',
  rows = 4,
  className = '',
}: VariableTextEditorProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [draggedFromIndex, setDraggedFromIndex] = useState<number | null>(null)
  const [isDndKitDragging, setIsDndKitDragging] = useState(false) // True when dnd-kit is actually dragging
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number } | null>(null)
  const [dragPreviewLabel, setDragPreviewLabel] = useState<string>('')
  const [isFocused, setIsFocused] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)
  const lastValueRef = useRef<string | null>(null)
  const pointerStartRef = useRef<{ x: number; y: number; nodeId: string; index: number } | null>(null)

  // Configure sensors for drag
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  )

  // Parse value into tokens
  const parseTokens = useCallback((str: string): Token[] => {
    if (!str) return []

    const tokens: Token[] = []
    const regex = /\{\{(\w+(?:-[\w-]+)?)\}\}/g
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = regex.exec(str)) !== null) {
      if (match.index > lastIndex) {
        const text = str.slice(lastIndex, match.index)
        text.split(/\s+/).filter(p => p.trim()).forEach(part => {
          tokens.push({ type: 'text', value: part })
        })
      }

      const nodeId = match[1]
      const variable = availableVariables.find(v => v.name === nodeId)
      tokens.push({
        type: 'variable',
        nodeId,
        label: variable?.sourceNodeLabel ?? nodeId,
      })

      lastIndex = match.index + match[0].length
    }

    if (lastIndex < str.length) {
      const text = str.slice(lastIndex)
      text.split(/\s+/).filter(p => p.trim()).forEach(part => {
        tokens.push({ type: 'text', value: part })
      })
    }

    return tokens
  }, [availableVariables])

  // Convert tokens back to string - add spaces between tokens
  const tokensToString = useCallback((tokens: Token[]): string => {
    return tokens
      .map(t => t.type === 'text' ? t.value : `{{${t.nodeId}}}`)
      .join(' ')
  }, [])

  // Convert string value to HTML with variable chips
  const valueToHtml = useCallback((str: string): string => {
    if (!str) return ''

    const regex = /\{\{(\w+(?:-[\w-]+)?)\}\}/g
    return str.replace(regex, (_match, nodeId) => {
      const variable = availableVariables.find(v => v.name === nodeId)
      const label = variable?.sourceNodeLabel ?? nodeId
      return `<span class="variable-chip" contenteditable="false" data-node-id="${nodeId}">${label}<button class="variable-remove" data-node-id="${nodeId}" type="button">&times;</button></span>`
    })
  }, [availableVariables])

  // Convert HTML back to string with {{nodeId}}
  const htmlToValue = useCallback((html: string): string => {
    const temp = document.createElement('div')
    temp.innerHTML = html

    temp.querySelectorAll('.variable-chip').forEach(chip => {
      const nodeId = chip.getAttribute('data-node-id')
      if (nodeId) {
        chip.replaceWith(`{{${nodeId}}}`)
      }
    })

    return temp.textContent ?? ''
  }, [])

  // Sync editor content with value prop - skip if change came from user input
  useEffect(() => {
    if (!editorRef.current) return
    if (isDragging) return

    // Skip sync if value matches what we set from user input (prevents cursor reset)
    if (value === lastValueRef.current) return

    const html = valueToHtml(value)
    editorRef.current.innerHTML = html
    lastValueRef.current = value
  }, [value, valueToHtml, isDragging])

  // Handle pointer down on chips - prepare for potential drag
  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return

    const handlePointerDown = (e: PointerEvent) => {
      // Only handle pointer down when not already dragging
      if (isDragging) return

      const target = e.target as HTMLElement
      const chip = target.closest('.variable-chip') as HTMLElement

      // Ignore if clicking the remove button
      if (target.classList.contains('variable-remove')) return

      if (chip) {
        const nodeId = chip.getAttribute('data-node-id')
        if (nodeId) {
          const tokens = parseTokens(value)
          const index = tokens.findIndex(t => t.type === 'variable' && t.nodeId === nodeId)
          if (index !== -1) {
            pointerStartRef.current = { x: e.clientX, y: e.clientY, nodeId, index }
          }
        }
      }
    }

    editor.addEventListener('pointerdown', handlePointerDown)

    return () => {
      editor.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [isDragging, value, parseTokens])

  // Track pointer movement for drag - separate effect to keep listeners active during drag
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      // Update pointer position for drag preview while dragging
      if (isDragging && !isDndKitDragging) {
        setPointerPos({ x: e.clientX, y: e.clientY })
        return
      }

      // Check for drag initiation
      if (!pointerStartRef.current) return

      const dx = e.clientX - pointerStartRef.current.x
      const dy = e.clientY - pointerStartRef.current.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      // If moved more than 5px, enter drag mode
      if (distance > 5) {
        const { nodeId, index } = pointerStartRef.current
        const tokens = parseTokens(value)
        const token = tokens[index]
        const label = token?.type === 'variable' ? token.label : nodeId

        setDraggedFromIndex(index)
        setActiveId(`existing-${nodeId}-${index}`)
        setDragPreviewLabel(label)
        setPointerPos({ x: e.clientX, y: e.clientY })
        setIsDragging(true)
        pointerStartRef.current = null
      }
    }

    const handlePointerUp = (e: PointerEvent) => {
      pointerStartRef.current = null

      // If we're in drag mode but dnd-kit never took over, check if we're over a drop zone
      if (isDragging && !isDndKitDragging && draggedFromIndex !== null) {
        // Find drop zone under pointer
        const elementsUnderPointer = document.elementsFromPoint(e.clientX, e.clientY)
        const dropZone = elementsUnderPointer.find(el => el.getAttribute('data-droppable') === 'true')

        if (dropZone) {
          // Get drop zone id (format: drop-{index})
          const dropId = dropZone.id || ''
          if (dropId.startsWith('drop-')) {
            let dropIndex = parseInt(dropId.replace('drop-', ''))
            const currentTokens = parseTokens(value)

            const existingToken = currentTokens[draggedFromIndex]
            if (existingToken?.type === 'variable') {
              // Remove from old position
              currentTokens.splice(draggedFromIndex, 1)

              // Adjust drop index if we removed before it
              if (draggedFromIndex < dropIndex) {
                dropIndex--
              }

              // Insert at new position
              currentTokens.splice(dropIndex, 0, existingToken)

              const newValue = tokensToString(currentTokens)
              onChange(newValue)
            }
          }
        }

        // Reset state
        setActiveId(null)
        setDraggedFromIndex(null)
        setIsDragging(false)
        setPointerPos(null)
        setDragPreviewLabel('')
      }
    }

    document.addEventListener('pointermove', handlePointerMove)
    document.addEventListener('pointerup', handlePointerUp)

    return () => {
      document.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('pointerup', handlePointerUp)
    }
  }, [isDragging, isDndKitDragging, draggedFromIndex, value, parseTokens, tokensToString, onChange])

  // Handle input changes
  const handleInput = useCallback(() => {
    if (!editorRef.current) return

    const newValue = htmlToValue(editorRef.current.innerHTML)
    if (newValue !== lastValueRef.current) {
      lastValueRef.current = newValue
      onChange(newValue)
    }
  }, [htmlToValue, onChange])

  // Handle click on remove button
  const handleClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement

    if (target.classList.contains('variable-remove')) {
      e.preventDefault()
      e.stopPropagation()
      const chip = target.closest('.variable-chip')
      if (chip) {
        chip.remove()
        handleInput()
      }
    }
  }, [handleInput])

  // Handle keyboard for backspace on chips
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' || e.key === 'Delete') {
      const selection = window.getSelection()
      if (!selection || selection.rangeCount === 0) return

      const range = selection.getRangeAt(0)

      if (range.collapsed) {
        const node = range.startContainer
        const offset = range.startOffset

        if (e.key === 'Backspace' && offset === 0 && node.previousSibling) {
          const prev = node.previousSibling as HTMLElement
          if (prev.classList?.contains('variable-chip')) {
            e.preventDefault()
            prev.remove()
            handleInput()
            return
          }
        }

        if (e.key === 'Backspace' && node.nodeType === Node.TEXT_NODE && offset === 0) {
          let prev = node.previousSibling as HTMLElement | null
          while (prev && prev.nodeType === Node.TEXT_NODE && prev.textContent === '') {
            prev = prev.previousSibling as HTMLElement | null
          }
          if (prev?.classList?.contains('variable-chip')) {
            e.preventDefault()
            prev.remove()
            handleInput()
            return
          }
        }
      }
    }
  }, [handleInput])

  // Handle paste - strip formatting
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
  }, [])

  // Handle drag start from palette or from drag mode chips
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const id = event.active.id as string

    if (id.startsWith('existing-')) {
      const parts = id.split('-')
      const index = parseInt(parts[parts.length - 1])
      if (!isNaN(index)) {
        setDraggedFromIndex(index)
      }
    } else {
      setDraggedFromIndex(null)
      setIsDragging(true)
    }

    setActiveId(id)
    setIsDndKitDragging(true)
    setPointerPos(null) // Hide custom preview, DragOverlay will show
  }, [])

  // Handle drag end
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event

    if (over) {
      const dropId = over.id as string
      if (dropId.startsWith('drop-')) {
        let dropIndex = parseInt(dropId.replace('drop-', ''))
        const tokens = parseTokens(value)

        let variableNodeId: string | undefined
        let variableLabel: string | undefined

        if (draggedFromIndex !== null) {
          const existingToken = tokens[draggedFromIndex]
          if (existingToken?.type === 'variable') {
            variableNodeId = existingToken.nodeId
            variableLabel = existingToken.label

            tokens.splice(draggedFromIndex, 1)

            if (draggedFromIndex < dropIndex) {
              dropIndex--
            }
          }
        } else {
          variableNodeId = active.data.current?.nodeId as string
          variableLabel = active.data.current?.label as string
        }

        if (variableNodeId && variableLabel) {
          const newVarToken: VariableToken = {
            type: 'variable',
            nodeId: variableNodeId,
            label: variableLabel,
          }

          tokens.splice(dropIndex, 0, newVarToken)

          const newValue = tokensToString(tokens)
          onChange(newValue)
        }
      }
    }

    setActiveId(null)
    setDraggedFromIndex(null)
    setIsDragging(false)
    setIsDndKitDragging(false)
    setPointerPos(null)
    setDragPreviewLabel('')
  }, [value, parseTokens, tokensToString, onChange, draggedFromIndex])

  // Cancel drag
  const handleDragCancel = useCallback(() => {
    setActiveId(null)
    setDraggedFromIndex(null)
    setIsDragging(false)
    setIsDndKitDragging(false)
    setPointerPos(null)
    setDragPreviewLabel('')
  }, [])

  // Exit drag mode on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDragging) {
        setActiveId(null)
        setDraggedFromIndex(null)
        setIsDragging(false)
        setIsDndKitDragging(false)
        setPointerPos(null)
        setDragPreviewLabel('')
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isDragging])

  // Trigger dnd-kit to take over when we enter drag mode from contentEditable
  useEffect(() => {
    if (!isDragging || isDndKitDragging || !pointerPos) return

    // Wait for the tokenized view to render
    const timer = setTimeout(() => {
      const targetChip = document.querySelector('[data-drag-target="true"]')
      if (targetChip) {
        // Dispatch synthetic pointerdown to let dnd-kit take over
        const pointerDownEvent = new PointerEvent('pointerdown', {
          bubbles: true,
          cancelable: true,
          clientX: pointerPos.x,
          clientY: pointerPos.y,
          pointerId: 1,
          pointerType: 'mouse',
          isPrimary: true,
          button: 0,
          buttons: 1,
        })
        targetChip.dispatchEvent(pointerDownEvent)
      }
    }, 10)

    return () => clearTimeout(timer)
  }, [isDragging, isDndKitDragging, pointerPos])

  const tokens = parseTokens(value)
  const isEmpty = !value || value.trim() === ''

  const getDraggedLabel = () => {
    if (!activeId) return ''
    if (activeId.startsWith('existing-')) {
      const nodeId = activeId.replace('existing-', '').replace(/-\d+$/, '')
      const token = tokens.find(t => t.type === 'variable' && t.nodeId === nodeId)
      return token?.type === 'variable' ? token.label : nodeId
    }
    return availableVariables.find(v => v.name === activeId)?.sourceNodeLabel ?? activeId
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className={`space-y-2 ${className}`}>
        {/* Variable palette */}
        {availableVariables.length > 0 && (
          <div className="text-xs text-gray-500">
            <span className="font-medium">Variables</span>
            <span className="text-gray-400 ml-1">(drag to insert)</span>
            <CompactVariablePalette variables={availableVariables} className="mt-1" />
          </div>
        )}

        {/* Editor container */}
        <div
          className={`
            w-full px-3 py-2 border rounded-lg bg-white transition-colors
            ${isDragging ? 'border-blue-300 bg-blue-50/30' : 'border-gray-300'}
            focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500
          `}
          style={{ minHeight: `${rows * 1.5}rem` }}
        >
          {/* Normal editing mode - hidden during drag */}
          <div className={`relative ${isDragging ? 'hidden' : ''}`}>
            {isEmpty && !isFocused && (
              <span className="absolute top-0 left-0 text-gray-400 pointer-events-none">
                {placeholder}
              </span>
            )}
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleInput}
              onClick={handleClick}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="outline-none min-h-[1.5rem] whitespace-pre-wrap break-words"
            />
          </div>

          {/* Tokenized view for drag - no drop zones until dnd-kit takes over */}
          {isDragging && (
            <div className="flex flex-wrap items-center gap-1 min-h-[1.5rem]">
              {isDndKitDragging && <DropZone id="drop-0" />}

              {tokens.map((token, index) => {
                const isBeingDragged = draggedFromIndex === index

                // Skip the dragged token entirely once dnd-kit takes over
                if (isBeingDragged && isDndKitDragging) {
                  return null
                }

                return (
                  <div key={index} className="flex items-center">
                    {token.type === 'text' ? (
                      <span>{token.value}</span>
                    ) : (
                      <DraggableChip
                        id={`existing-${token.nodeId}-${index}`}
                        nodeId={token.nodeId}
                        label={token.label}
                        isTarget={isBeingDragged && !isDndKitDragging}
                        isHidden={isBeingDragged && !isDndKitDragging}
                      />
                    )}
                    {isDndKitDragging && <DropZone id={`drop-${index + 1}`} />}
                  </div>
                )
              })}

              {tokens.length === 0 && (
                <span className="text-gray-400 ml-2">{placeholder}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Custom drag preview - shown when dragging from contentEditable before dnd-kit takes over */}
      {pointerPos && dragPreviewLabel && !isDndKitDragging && (
        <div
          className="fixed pointer-events-none z-50 px-2 py-1 text-sm bg-blue-100 text-blue-800 border border-blue-300 rounded-md shadow-lg"
          style={{
            left: pointerPos.x + 10,
            top: pointerPos.y + 10,
          }}
        >
          {dragPreviewLabel}
        </div>
      )}

      {/* Drag overlay - shown when dnd-kit is actually dragging */}
      <DragOverlay>
        {isDndKitDragging && activeId ? (
          <div className="px-2 py-1 text-sm bg-blue-100 text-blue-800 border border-blue-300 rounded-md shadow-lg">
            {getDraggedLabel()}
          </div>
        ) : null}
      </DragOverlay>

      {/* Styles for variable chips */}
      <style>{`
        .variable-chip {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          padding: 1px 6px;
          margin: 0 2px;
          font-size: 0.875rem;
          background-color: #dbeafe;
          color: #1e40af;
          border: 1px solid #bfdbfe;
          border-radius: 4px;
          white-space: nowrap;
          user-select: none;
          vertical-align: baseline;
          cursor: grab;
          touch-action: none;
        }
        .variable-chip:hover {
          background-color: #bfdbfe;
        }
        .variable-chip:active {
          cursor: grabbing;
        }
        .variable-remove {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 14px;
          height: 14px;
          padding: 0;
          margin-left: 2px;
          font-size: 14px;
          line-height: 1;
          color: #1e40af;
          background: transparent;
          border: none;
          border-radius: 2px;
          cursor: pointer;
        }
        .variable-remove:hover {
          background-color: #93c5fd;
        }
      `}</style>
    </DndContext>
  )
}

/**
 * Draggable chip for variables in drag mode
 */
function DraggableChip({
  id,
  nodeId,
  label,
  isTarget = false,
  isHidden = false,
}: {
  id: string
  nodeId: string
  label: string
  isTarget?: boolean
  isHidden?: boolean
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    data: { nodeId, label },
  })

  return (
    <span
      ref={setNodeRef}
      data-drag-target={isTarget ? 'true' : undefined}
      {...listeners}
      {...attributes}
      className={`
        draggable-chip inline-flex items-center gap-1 px-2 py-0.5 text-sm
        bg-blue-100 text-blue-800 border border-blue-200 rounded-md
        whitespace-nowrap cursor-grab active:cursor-grabbing
        hover:bg-blue-200 transition-colors
        ${isDragging ? 'opacity-50' : ''}
        ${isTarget ? 'ring-2 ring-blue-400 shadow-lg' : ''}
        ${isHidden ? 'invisible' : ''}
      `}
    >
      {label}
    </span>
  )
}

/**
 * Drop zone between tokens
 */
function DropZone({ id }: { id: string }) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      id={id}
      ref={setNodeRef}
      data-droppable="true"
      className={`
        transition-all duration-100 rounded self-stretch flex items-center
        ${isOver ? 'w-4 bg-blue-500 mx-0.5' : 'w-2 bg-blue-200 mx-0.5'}
        min-h-[1.5rem]
      `}
    />
  )
}

export { VariableTextEditor }
