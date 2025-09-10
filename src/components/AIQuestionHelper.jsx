import { useState, useEffect } from 'react'
import aiChatService from '../services/aiChatService'

const AIQuestionHelper = ({ question, userAnswer, isCorrect, sectionContent = null, show = true }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [chatHistory, setChatHistory] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [userInput, setUserInput] = useState('')

  // Reset chat quando muda de questão
  useEffect(() => {
    setChatHistory([])
    setIsOpen(false)
    setUserInput('')
  }, [question?.id])

  // Não renderizar se não deve mostrar ou se não há questão respondida
  if (!show || !question || userAnswer === null) {
    return null
  }

  const suggestions = aiChatService.getSmartSuggestions(question, isCorrect)

  const handleSendMessage = async (message) => {
    if (!message.trim()) return

    const userMessage = { role: 'user', content: message.trim() }
    const newHistory = [...chatHistory, userMessage]
    setChatHistory(newHistory)
    setUserInput('')
    setIsLoading(true)
    
    try {
      const aiResponse = await aiChatService.askQuestion(
        message.trim(), 
        question, 
        userAnswer, 
        isCorrect, 
        chatHistory,
        sectionContent
      )
      
      const aiMessage = { role: 'assistant', content: aiResponse }
      setChatHistory([...newHistory, aiMessage])
    } catch (error) {
      console.error('Erro no chat:', error)
      const errorMessage = { 
        role: 'assistant', 
        content: '😕 Desculpe, houve um problema. Tente reformular sua pergunta.' 
      }
      setChatHistory([...newHistory, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestionClick = (suggestion) => {
    // Remove emojis e limpa a mensagem
    const cleanMessage = suggestion
      .replace(/^[\u{1F000}-\u{1F9FF}][\u{FE00}-\u{FE0F}]?\s*/u, '') // Remove emojis do início
      .replace(/^[💡🏛️📚🔗❓🎯⚠️💭🤔⚖️📈🏆]\s*/, '') // Fallback para emojis específicos
      .trim()
    
    console.log('🔍 Sugestão original:', suggestion)
    console.log('🧹 Sugestão limpa:', cleanMessage)
    
    handleSendMessage(cleanMessage)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    handleSendMessage(userInput)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(userInput)
    }
  }

  return (
    <>
      {/* Botão flutuante */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`
            fixed bottom-6 right-6 z-50
            bg-blue-600 hover:bg-blue-700 text-white
            px-4 py-3 rounded-full shadow-lg
            flex items-center space-x-2
            transition-all duration-300 hover:scale-105
            ${isCorrect ? 'animate-pulse' : 'animate-bounce'}
          `}
          title="Tire dúvidas sobre esta questão com nossa IA"
        >
          <span className="text-lg">🤖</span>
          <span className="hidden sm:inline text-sm font-medium">
            Peça ajuda à IA
          </span>
        </button>
      )}

      {/* Modal/Painel do chat */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Chat Panel */}
          <div className="
            relative bg-white rounded-t-xl sm:rounded-xl shadow-2xl
            w-full sm:w-[600px] sm:max-w-[90vw]
            h-[80vh] sm:h-[600px] max-h-[90vh]
            flex flex-col
            animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95
            duration-300
          ">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-blue-50 rounded-t-xl sm:rounded-t-xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xl">🤖</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Professor IA</h3>
                  <p className="text-sm text-gray-600">
                    {isCorrect ? '🎉 Parabéns! Quer saber mais?' : '📚 Vamos esclarecer sua dúvida'}
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors"
                title="Fechar chat"
              >
                <span className="text-gray-600 text-sm">✕</span>
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col min-h-0">
              
              {/* Suggestions (shown when no chat history) */}
              {chatHistory.length === 0 && (
                <div className="p-4 border-b bg-gray-50">
                  <p className="text-sm text-gray-600 mb-3">
                    💡 Algumas sugestões para você:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {suggestions.slice(0, 6).map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="
                          text-left p-3 bg-white hover:bg-blue-50 
                          border border-gray-200 hover:border-blue-300
                          rounded-lg text-sm transition-colors
                          disabled:opacity-50 disabled:cursor-not-allowed
                        "
                        disabled={isLoading}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat History */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatHistory.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`
                      max-w-[85%] p-3 rounded-lg
                      ${message.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-br-sm' 
                        : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                      }
                    `}>
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg rounded-bl-sm p-3">
                      <div className="flex items-center space-x-2 text-gray-500">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-sm">Professor IA está pensando...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Input Area */}
            <div className="p-4 border-t bg-gray-50">
              <form onSubmit={handleSubmit} className="flex space-x-2">
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite sua dúvida sobre esta questão..."
                  disabled={isLoading}
                  rows={2}
                  className="
                    flex-1 p-3 border border-gray-300 rounded-lg
                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    disabled:bg-gray-100 disabled:cursor-not-allowed
                    resize-none text-sm
                  "
                />
                <button
                  type="submit"
                  disabled={isLoading || !userInput.trim()}
                  className="
                    px-4 py-3 bg-blue-600 hover:bg-blue-700 
                    disabled:bg-gray-300 disabled:cursor-not-allowed
                    text-white rounded-lg transition-colors
                    flex items-center justify-center
                    min-w-[60px]
                  "
                  title="Enviar pergunta"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span className="text-sm">📤</span>
                  )}
                </button>
              </form>
              
              <p className="text-xs text-gray-500 mt-2 text-center">
                Pressione Enter para enviar • Shift+Enter para nova linha
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default AIQuestionHelper