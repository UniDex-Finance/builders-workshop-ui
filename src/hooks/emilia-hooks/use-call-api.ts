import { useState } from 'react'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ApiResponse {
  confirmationText: string
  trades: any[] | null
  messageId: string
  isError: boolean
}

interface UseCallApiProps {
  balance: number
}

export function useCallApi({ balance }: UseCallApiProps) {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = async (message: string) => {
    if (!message.trim()) return

    try {
      setIsLoading(true)
      setError(null)
      
      // Add user message to chat history
      setChatHistory(prev => [...prev, { role: 'user', content: message }])
      
      // Send to API
      const response = await fetch('https://emilia-backend-production.up.railway.app/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          balance
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data: ApiResponse = await response.json()

      if (data.isError) {
        throw new Error(data.confirmationText)
      }

      // Add assistant response to chat history
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: data.confirmationText 
      }])

      return data

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while processing your request'
      setError(errorMessage)
      
      // Add error message to chat
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: errorMessage
      }])

      return null
    } finally {
      setIsLoading(false)
    }
  }

  const clearChat = () => {
    setChatHistory([])
    setError(null)
  }

  return {
    chatHistory,
    isLoading,
    error,
    sendMessage,
    clearChat
  }
}
