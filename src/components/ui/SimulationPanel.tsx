import { useState, useEffect, useRef } from 'react'
import { X, Send, Play } from 'lucide-react'
import { useFlowStore } from '@/stores/flowStore'
import { startSimulation, sendSimulationInput } from '@/services/api'
import { FlowSimulationStatus } from '@/types/flow'

export default function SimulationPanel() {
  const [inputText, setInputText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const {
    simulationId,
    simulationStatus,
    simulationMessages,
    waitingForInput,
    updateSimulation,
    endSimulation,
  } = useFlowStore()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [simulationMessages])

  const handleStart = async () => {
    if (!simulationId) return
    setIsProcessing(true)
    try {
      const response = await startSimulation(simulationId)
      updateSimulation({
        status: response.status,
        messages: response.messages,
        waitingForInput: response.waiting_for_input,
        variables: response.variables,
      })
    } catch (error) {
      console.error('Failed to start simulation:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSendMessage = async () => {
    if (!simulationId || !inputText.trim()) return
    setIsProcessing(true)
    try {
      const response = await sendSimulationInput(simulationId, { text: inputText })
      updateSimulation({
        status: response.status,
        messages: response.messages,
        waitingForInput: response.waiting_for_input,
        variables: response.variables,
      })
      setInputText('')
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleButtonClick = async (buttonId: string) => {
    if (!simulationId) return
    setIsProcessing(true)
    try {
      const response = await sendSimulationInput(simulationId, { button_id: buttonId })
      updateSimulation({
        status: response.status,
        messages: response.messages,
        waitingForInput: response.waiting_for_input,
        variables: response.variables,
      })
    } catch (error) {
      console.error('Failed to send button click:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const isCompleted =
    simulationStatus === FlowSimulationStatus.COMPLETED ||
    simulationStatus === FlowSimulationStatus.ERROR

  const lastMessage = simulationMessages[simulationMessages.length - 1]
  const showButtons = lastMessage?.buttons && lastMessage.buttons.length > 0

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-md h-[600px] rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-green-500 text-white">
          <div>
            <h3 className="font-semibold">Flow Simulation</h3>
            <p className="text-xs opacity-80">
              Status: {simulationStatus ?? 'Ready'}
            </p>
          </div>
          <button
            onClick={endSimulation}
            className="p-1 hover:bg-white/20 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-100">
          {simulationMessages.length === 0 && !simulationStatus && (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">
                Click Start to begin the simulation
              </p>
              <button
                onClick={handleStart}
                disabled={isProcessing}
                className="flex items-center gap-2 mx-auto px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                Start Simulation
              </button>
            </div>
          )}

          {simulationMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.direction === 'incoming' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`
                  max-w-[80%] px-3 py-2 rounded-lg
                  ${message.direction === 'incoming' ? 'bg-green-500 text-white rounded-br-none' : 'bg-white shadow rounded-bl-none'}
                `}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                {message.media_url && (
                  <a
                    href={message.media_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs underline opacity-80 block mt-1"
                  >
                    View Media
                  </a>
                )}
              </div>
            </div>
          ))}

          {/* Button options */}
          {showButtons && waitingForInput && (
            <div className="flex flex-wrap gap-2 justify-end">
              {lastMessage.buttons!.map((button) => (
                <button
                  key={button.id}
                  onClick={() => handleButtonClick(button.id)}
                  disabled={isProcessing}
                  className="px-3 py-1.5 text-sm bg-white border border-green-500 text-green-600 rounded-full hover:bg-green-50 disabled:opacity-50"
                >
                  {button.label}
                </button>
              ))}
            </div>
          )}

          {isCompleted && (
            <div className="text-center py-4">
              <p className="text-gray-500 text-sm">
                {simulationStatus === FlowSimulationStatus.ERROR
                  ? 'Simulation ended with error'
                  : 'Simulation completed'}
              </p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 bg-white border-t border-gray-200">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              disabled={!waitingForInput || isProcessing || isCompleted}
              placeholder={
                isCompleted
                  ? 'Simulation ended'
                  : waitingForInput
                    ? 'Type your response...'
                    : 'Waiting for flow...'
              }
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleSendMessage}
              disabled={!waitingForInput || isProcessing || !inputText.trim() || isCompleted}
              className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
