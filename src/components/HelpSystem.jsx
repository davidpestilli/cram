import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const HelpSystem = ({ children, helpText, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const positionClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2'
  }

  const arrowClasses = {
    top: 'top-full border-t-gray-800 border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'bottom-full border-b-gray-800 border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full border-l-gray-800 border-t-transparent border-r-transparent border-b-transparent',
    right: 'right-full border-r-gray-800 border-t-transparent border-l-transparent border-b-transparent'
  }

  useEffect(() => {
    if (isHovered) {
      const timer = setTimeout(() => setIsVisible(true), 500) // Delay before showing
      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
    }
  }, [isHovered])

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      
      <AnimatePresence>
        {isVisible && helpText && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={`absolute z-50 ${positionClasses[position]} left-1/2 transform -translate-x-1/2`}
          >
            <div className="bg-gray-800 text-white text-sm rounded-md px-3 py-2 max-w-xs whitespace-normal shadow-lg">
              {helpText}
              <div className={`absolute left-1/2 transform -translate-x-1/2 w-0 h-0 border-4 ${arrowClasses[position]}`} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// FAQ Component
export const FAQ = ({ isOpen, onClose }) => {
  const faqData = [
    {
      question: 'Como funciona o sistema de XP?',
      answer: 'Você ganha XP respondendo questões corretamente. Cada acerto vale pontos que contribuem para seu nível global. Mantenha streaks de acertos para ganhar bônus!'
    },
    {
      question: 'Para que serve o Gold?',
      answer: 'O Gold é a moeda do jogo que você usa na loja para comprar itens, equipamentos e melhorias para seu avatar. Gold é ganho junto com XP nas sessões de estudo.'
    },
    {
      question: 'Como funcionam os itens da loja?',
      answer: 'Itens comprados na loja podem ser equipados no seu avatar e oferecem bônus como +10% de XP. Visite o inventário para equipar seus itens.'
    },
    {
      question: 'O que são conquistas?',
      answer: 'Conquistas são desafios especiais que você pode completar estudando. Há conquistas por número de acertos, streaks, níveis e muito mais!'
    },
    {
      question: 'Como as questões são geradas?',
      answer: 'Utilizamos IA avançada (DeepSeek) para gerar questões únicas baseadas no conteúdo de Direito Penal. Você sempre terá questões novas e desafiadoras!'
    },
    {
      question: 'Posso estudar offline?',
      answer: 'Algumas funcionalidades funcionam offline graças ao cache do navegador, mas para gerar novas questões e salvar progresso você precisa estar conectado.'
    }
  ]

  const [openItem, setOpenItem] = useState(null)

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">
              ❓ Perguntas Frequentes
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="space-y-4">
            {faqData.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => setOpenItem(openItem === index ? null : index)}
                  className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-800">{item.question}</span>
                  <svg 
                    className={`w-5 h-5 text-gray-500 transition-transform ${openItem === index ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                <AnimatePresence>
                  {openItem === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 pt-0 text-gray-600 leading-relaxed">
                        {item.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600 text-center">
            Não encontrou sua resposta? Entre em contato conosco através do suporte.
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default HelpSystem