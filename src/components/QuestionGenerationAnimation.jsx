import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const QuestionGenerationAnimation = ({ 
  show = false, 
  progress = 0, 
  currentStep = '', 
  totalQuestions = 10,
  generatedQuestions = 0,
  onComplete
}) => {
  const [animationStep, setAnimationStep] = useState(0)
  const [showPulse, setShowPulse] = useState(false)

  // Lista de etapas da geração
  const steps = [
    { icon: '🔍', label: 'Analisando conteúdo legal', duration: 1500 },
    { icon: '🧠', label: 'Processando com IA', duration: 2000 },
    { icon: '⚖️', label: 'Aplicando regras jurídicas', duration: 1800 },
    { icon: '📝', label: 'Gerando questões', duration: 3000 },
    { icon: '🎯', label: 'Validando qualidade', duration: 1200 },
    { icon: '✅', label: 'Finalizando', duration: 800 }
  ]

  useEffect(() => {
    if (show) {
      setShowPulse(true)
      
      // Animação cíclica das etapas - continua até show=false
      const stepInterval = setInterval(() => {
        setAnimationStep(prev => {
          // Voltar ao início quando chegar ao fim
          return (prev + 1) % steps.length
        })
      }, 3000) // 3 segundos por step

      return () => clearInterval(stepInterval)
    } else {
      setAnimationStep(0)
      setShowPulse(false)
    }
  }, [show])

  // A finalização agora é controlada pelo timer dos steps acima

  if (!show) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 50 }}
        className="bg-white rounded-2xl shadow-2xl p-8 mx-4 w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            animate={showPulse ? {
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            } : {}}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="text-6xl mb-4"
          >
            🎓
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Gerando Questões
          </h2>
          <p className="text-gray-600">
            Criando questões personalizadas com IA
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Progresso
            </span>
            <span className="text-sm font-bold text-primary-600">
              {generatedQuestions}/{totalQuestions} questões
            </span>
          </div>
          
          <div className="relative bg-gray-200 rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progress, 100)}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
            />
            
            {/* Shimmer effect */}
            <motion.div
              animate={{
                x: ['-100%', '100%']
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
            />
          </div>
          
          <div className="mt-2 text-center text-xs text-gray-500">
            {Math.round(progress)}% concluído
          </div>
        </div>

        {/* Steps Animation */}
        <div className="space-y-4 mb-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{
                opacity: index <= animationStep ? 1 : 0.3,
                x: 0,
                scale: index === animationStep ? 1.02 : 1
              }}
              transition={{
                duration: 0.3,
                delay: index * 0.1
              }}
              className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                index === animationStep
                  ? 'bg-primary-50 border-2 border-primary-200'
                  : index < animationStep
                  ? 'bg-green-50 border-2 border-green-200'
                  : 'bg-gray-50 border-2 border-transparent'
              }`}
            >
              <motion.div
                animate={index === animationStep ? {
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                } : {}}
                transition={{
                  duration: 1,
                  repeat: index === animationStep ? Infinity : 0,
                  ease: "easeInOut"
                }}
                className="text-2xl"
              >
                {index < animationStep ? '✅' : step.icon}
              </motion.div>
              
              <div className="flex-1">
                <div className={`font-medium text-sm ${
                  index === animationStep
                    ? 'text-primary-700'
                    : index < animationStep
                    ? 'text-green-700'
                    : 'text-gray-500'
                }`}>
                  {step.label}
                </div>
                
                {index === animationStep && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: step.duration / 1000 }}
                    className="mt-1 h-1 bg-primary-200 rounded-full overflow-hidden"
                  >
                    <motion.div
                      initial={{ x: '-100%' }}
                      animate={{ x: '0%' }}
                      transition={{
                        duration: step.duration / 1000,
                        ease: "easeInOut"
                      }}
                      className="h-full w-full bg-primary-500"
                    />
                  </motion.div>
                )}
              </div>

              {index < animationStep && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-green-500 text-sm font-bold"
                >
                  ✓
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Current Step Info */}
        <AnimatePresence>
          {currentStep && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200"
            >
              <div className="text-sm font-medium text-blue-900">
                {currentStep}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fun Facts */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-6 text-center text-xs text-gray-500"
        >
          💡 Cada questão é única e gerada especificamente para você!
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

export default QuestionGenerationAnimation