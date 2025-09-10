import { useState, useEffect, useCallback } from 'react'
import aiChatService from '../services/aiChatService'

/**
 * Hook para gerenciar estado do chat IA
 */
export const useAIChat = (question) => {
  const [isOpen, setIsOpen] = useState(false)
  const [chatHistory, setChatHistory] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Reset quando muda de questão
  useEffect(() => {
    setChatHistory([])
    setIsOpen(false)
    setError(null)
  }, [question?.id])

  const sendMessage = useCallback(async (message, userAnswer, isCorrect) => {
    if (!message.trim() || !question) return

    const userMessage = { role: 'user', content: message.trim() }
    const newHistory = [...chatHistory, userMessage]
    setChatHistory(newHistory)
    setIsLoading(true)
    setError(null)
    
    try {
      const aiResponse = await aiChatService.askQuestion(
        message.trim(), 
        question, 
        userAnswer, 
        isCorrect, 
        chatHistory
      )
      
      const aiMessage = { role: 'assistant', content: aiResponse }
      setChatHistory([...newHistory, aiMessage])
    } catch (err) {
      console.error('Erro no chat:', err)
      setError('Houve um problema na comunicação. Tente novamente.')
      
      // Remover mensagem do usuário se houve erro
      setChatHistory(chatHistory)
    } finally {
      setIsLoading(false)
    }
  }, [question, chatHistory])

  const getSuggestions = useCallback((isCorrect) => {
    if (!question) return []
    return aiChatService.getSmartSuggestions(question, isCorrect)
  }, [question])

  return {
    isOpen,
    setIsOpen,
    chatHistory,
    isLoading,
    error,
    sendMessage,
    getSuggestions,
    isAvailable: aiChatService.isAvailable()
  }
}

export default useAIChat