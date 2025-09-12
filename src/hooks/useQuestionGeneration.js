import { useState, useCallback, useRef } from 'react'

export const useQuestionGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('')
  const [generatedQuestions, setGeneratedQuestions] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(10)
  const [error, setError] = useState(null)
  
  // Refs para controlar timers
  const progressTimerRef = useRef(null)
  const stepTimerRef = useRef(null)

  // Simular progresso suave durante a geração
  const simulateProgress = useCallback((targetProgress, duration = 2000) => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current)
    }

    const startProgress = progress
    const progressDiff = targetProgress - startProgress
    const steps = 50
    const stepSize = progressDiff / steps
    const stepDuration = duration / steps
    let currentStep = 0

    progressTimerRef.current = setInterval(() => {
      currentStep++
      const newProgress = Math.min(startProgress + (stepSize * currentStep), targetProgress)
      setProgress(newProgress)

      if (currentStep >= steps || newProgress >= targetProgress) {
        clearInterval(progressTimerRef.current)
        progressTimerRef.current = null
      }
    }, stepDuration)
  }, [progress])

  // Iniciar processo de geração
  const startGeneration = useCallback(async (targetQuestions = 10) => {
    setIsGenerating(true)
    setProgress(0)
    setGeneratedQuestions(0)
    setTotalQuestions(targetQuestions)
    setError(null)
    
    // Simular diferentes etapas
    setCurrentStep('Analisando conteúdo da seção...')
    simulateProgress(15, 1500)
    
    setTimeout(() => {
      setCurrentStep('Processando com inteligência artificial...')
      simulateProgress(35, 2000)
    }, 1500)
    
    setTimeout(() => {
      setCurrentStep('Aplicando regras da matéria...')
      simulateProgress(55, 1800)
    }, 3500)
    
    setTimeout(() => {
      setCurrentStep('Criando questões personalizadas...')
      simulateProgress(85, 3000)
    }, 5300)
    
    setTimeout(() => {
      setCurrentStep('Validando qualidade e originalidade...')
      simulateProgress(95, 1200)
    }, 8300)
    
    setTimeout(() => {
      setCurrentStep('Finalizando...')
      simulateProgress(100, 800)
    }, 9500)
  }, [simulateProgress])

  // Atualizar progresso baseado em questões reais geradas
  const updateRealProgress = useCallback((questionsGenerated, total) => {
    setGeneratedQuestions(questionsGenerated)
    setTotalQuestions(total)
    
    // Calcular progresso real (80-95% baseado em questões geradas)
    const realProgress = Math.min(80 + (questionsGenerated / total) * 15, 95)
    setProgress(realProgress)
    
    if (questionsGenerated > 0) {
      setCurrentStep(`Questão ${questionsGenerated} de ${total} gerada com sucesso`)
    }
  }, [])

  // Completar geração
  const completeGeneration = useCallback(() => {
    setProgress(100)
    setCurrentStep('Questões prontas!')
    
    setTimeout(() => {
      setIsGenerating(false)
      setProgress(0)
      setCurrentStep('')
    }, 1500)
  }, [])

  // Tratar erro na geração
  const handleGenerationError = useCallback((errorMessage) => {
    setError(errorMessage)
    setCurrentStep('Erro na geração de questões')
    
    setTimeout(() => {
      setIsGenerating(false)
      setProgress(0)
      setError(null)
    }, 3000)
  }, [])

  // Resetar estado
  const resetGeneration = useCallback(() => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current)
    }
    if (stepTimerRef.current) {
      clearTimeout(stepTimerRef.current)
    }
    
    setIsGenerating(false)
    setProgress(0)
    setCurrentStep('')
    setGeneratedQuestions(0)
    setTotalQuestions(10)
    setError(null)
  }, [])

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current)
    }
    if (stepTimerRef.current) {
      clearTimeout(stepTimerRef.current)
    }
  }, [])

  return {
    // Estado
    isGenerating,
    progress,
    currentStep,
    generatedQuestions,
    totalQuestions,
    error,
    
    // Ações
    startGeneration,
    updateRealProgress,
    completeGeneration,
    handleGenerationError,
    resetGeneration,
    cleanup
  }
}

export default useQuestionGeneration