import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { QuestionsService } from '../services/questionsService'
import { useXpSystem } from '../hooks/useXpSystem'
import { useAchievements } from '../hooks/useAchievements'
import Layout from '../components/Layout/Layout'
import XpGoldAnimation from '../components/XpGoldAnimation'
import LevelUpNotification from '../components/LevelUpNotification'
import StreakIndicator from '../components/StreakIndicator'
import ConfettiAnimation from '../components/ConfettiAnimation'
import ParticleSystem from '../components/ParticleSystem'
import ShakeAnimation from '../components/ShakeAnimation'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import AchievementNotification from '../components/AchievementNotification'
import AIQuestionHelper from '../components/AIQuestionHelper'
import LegalTextViewer from '../components/LegalTextViewer'

const StudySession = () => {
  const { subjectId, sectionId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { profile } = useAuth()
  const questionType = location.state?.questionType || 'auto'
  const { calculateXpGain, calculateGoldGain, updateUserXpAndGold } = useXpSystem()
  const { checkSpecificAchievements, getNextNotification, markNotificationShown } = useAchievements()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [questions, setQuestions] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [sectionContent, setSectionContent] = useState(null)
  const [userAnswer, setUserAnswer] = useState(null)
  const [showExplanation, setShowExplanation] = useState(false)
  
  // Cache simples de respostas durante a sessão
  const [questionAnswers, setQuestionAnswers] = useState(new Map())
  const [questionExplanations, setQuestionExplanations] = useState(new Map())
  
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    incorrect: 0,
    total: 0,
    xpGained: 0,
    goldGained: 0
  })
  const [lastQuestionReward, setLastQuestionReward] = useState(null)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [startTime, setStartTime] = useState(null)
  const [questionStartTime, setQuestionStartTime] = useState(null)
  
  // Animation states
  const [showXpAnimation, setShowXpAnimation] = useState(false)
  const [showLevelUpNotification, setShowLevelUpNotification] = useState(false)
  const [levelUpData, setLevelUpData] = useState(null)
  const [showParticles, setShowParticles] = useState(false)
  const [particleType, setParticleType] = useState('success')
  const [showShakeAnimation, setShowShakeAnimation] = useState(false)
  const [currentStreak, setCurrentStreak] = useState(0)
  
  // Achievement states
  const [showAchievementNotification, setShowAchievementNotification] = useState(false)
  const [currentAchievement, setCurrentAchievement] = useState(null)
  
  // Proteção robusta contra múltiplas chamadas em React StrictMode
  const isInitializingRef = useRef(false)
  const hasInitializedRef = useRef(false)
  const sessionKey = `study-session-${subjectId}-${sectionId}-${questionType}`

  const initializeStudySession = useCallback(async () => {
    // Proteção contra múltiplas chamadas - SIMPLIFICADA
    if (isInitializingRef.current || hasInitializedRef.current) {
      console.log('⚠️ Sessão já está sendo inicializada ou já foi inicializada, ignorando chamada duplicada')
      return
    }
    
    try {
      isInitializingRef.current = true
      setLoading(true)
      setStartTime(Date.now())

      console.log(`🚀 Initializing ${questionType} study session...`)

      const result = await QuestionsService.getOrCreateQuestions(
        parseInt(subjectId), 
        parseInt(sectionId),
        {
          userId: profile?.id,
          questionType: questionType
        }
      )

      console.log(`✅ Loaded ${result.questions?.length || 0} ${result.source} questions`)

      setQuestions(result.questions)
      setQuestionStartTime(Date.now())
      
      // Limpar cache ao iniciar nova sessão
      setQuestionAnswers(new Map())
      setQuestionExplanations(new Map())
      
      // Carregar conteúdo da seção para o viewer legal
      try {
        const sectionData = await QuestionsService.getSectionContent(parseInt(sectionId))
        setSectionContent(sectionData)
        console.log('📖 Conteúdo da seção carregado:', sectionData?.titulo)
      } catch (sectionError) {
        console.warn('⚠️ Erro ao carregar conteúdo da seção:', sectionError)
        // Não é crítico, continua sem o conteúdo
      }
      
      // Marcar como inicializado com sucesso
      hasInitializedRef.current = true

    } catch (err) {
      console.error('❌ Error initializing study session:', err)
      setError('Erro ao carregar questões. Tente novamente.')
    } finally {
      setLoading(false)
      isInitializingRef.current = false
    }
  }, [subjectId, sectionId, profile?.id, questionType])

  // Initialize study session when component mounts
  useEffect(() => {
    if (subjectId && sectionId && profile?.id && !hasInitializedRef.current && !isInitializingRef.current) {
      console.log(`🎬 Starting initialization for ${questionType} questions...`)
      initializeStudySession()
    }
  }, [subjectId, sectionId, profile?.id, questionType])

  // Check for achievement notifications - DESABILITADO TEMPORARIAMENTE
  // useEffect(() => {
  //   const achievement = getNextNotification()
  //   if (achievement && !showAchievementNotification) {
  //     setCurrentAchievement(achievement)
  //     setShowAchievementNotification(true)
  //   }
  // }, [getNextNotification, showAchievementNotification])

  // Atualizar estado da questão atual quando mudar de índice
  useEffect(() => {
    if (questions.length > 0) {
      const savedAnswer = questionAnswers.get(currentQuestionIndex)
      const savedExplanation = questionExplanations.get(currentQuestionIndex)
      
      // Só atualizar se houver dados salvos, senão manter estado atual
      if (savedAnswer !== undefined) {
        setUserAnswer(savedAnswer)
      } else if (userAnswer !== null) {
        // Reset para null apenas se não há resposta salva e temos resposta atual
        setUserAnswer(null)
      }
      
      if (savedExplanation !== undefined) {
        setShowExplanation(savedExplanation)
      } else if (showExplanation) {
        // Reset apenas se não há explicação salva e temos explicação atual
        setShowExplanation(false)
      }
    }
  }, [currentQuestionIndex, questions.length])
  
  // Cleanup on unmount to allow reinitializing next time
  useEffect(() => {
    return () => {
      hasInitializedRef.current = false
      isInitializingRef.current = false
    }
  }, [])

  const handleAchievementNotificationComplete = () => {
    setShowAchievementNotification(false)
    setCurrentAchievement(null)
    markNotificationShown()
  }

  const handleAnswer = async (answer) => {
    if (userAnswer !== null) return // Prevent double answers

    setUserAnswer(answer)
    
    const currentQuestion = questions[currentQuestionIndex]
    const isCorrect = answer === currentQuestion.correct_answer
    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000)

    // Calculate rewards
    const xpGain = calculateXpGain(isCorrect, currentQuestion.difficulty, {
      firstAttempt: timeSpent < 30, // First attempt bonus if answered quickly
      streak: sessionStats.correct + (isCorrect ? 1 : 0)
    })
    
    const goldGain = calculateGoldGain(isCorrect, currentQuestion.difficulty)

    // Update streak
    const newStreak = isCorrect ? currentStreak + 1 : 0
    setCurrentStreak(newStreak)

    // Update session stats
    const newStats = {
      ...sessionStats,
      total: sessionStats.total + 1,
      correct: sessionStats.correct + (isCorrect ? 1 : 0),
      incorrect: sessionStats.incorrect + (isCorrect ? 0 : 1),
      xpGained: sessionStats.xpGained + xpGain,
      goldGained: sessionStats.goldGained + goldGain
    }
    setSessionStats(newStats)

    // Store reward info for display
    setLastQuestionReward({
      xp: xpGain,
      gold: goldGain,
      isCorrect
    })

    try {
      // Save answer to database
      await QuestionsService.saveUserAnswer(
        profile.id,
        currentQuestion.id,
        answer,
        timeSpent
      )

      // Update user stats
      await QuestionsService.updateUserStats(
        profile.id,
        parseInt(subjectId),
        parseInt(sectionId),
        isCorrect
      )

      // Update XP and Gold
      if (xpGain > 0 || goldGain > 0) {
        const updateResult = await updateUserXpAndGold(xpGain, goldGain, {
          correctAnswer: isCorrect,
          incorrectAnswer: !isCorrect
        })
        
        // Check for level up
        if (updateResult && updateResult.leveledUp) {
          setLevelUpData({
            newLevel: updateResult.newLevel,
            oldLevel: updateResult.newLevel - 1
          })
          
          // Check level up achievements
          checkSpecificAchievements('level_up', {
            newLevel: updateResult.newLevel
          })
        }
      }

      // Check achievements
      if (isCorrect) {
        // Check question answered achievement
        checkSpecificAchievements('question_answered', {
          isCorrect: true,
          totalCorrect: newStats.correct
        })
        
        // Check streak achievements
        if (newStreak > 1) {
          checkSpecificAchievements('streak_achieved', {
            streakCount: newStreak
          })
        }
      }

    } catch (error) {
      console.error('Error saving answer:', error)
    }

    // Show animations and explanation
    // Salvar resposta e estado da questão no cache
    setQuestionAnswers(prev => {
      const newMap = new Map(prev).set(currentQuestionIndex, answer)
      return newMap
    })
    
    if (isCorrect) {
      setShowXpAnimation(true)
      setShowParticles(true)
      setParticleType('success')
      setTimeout(() => {
        setShowExplanation(true)
        setShowParticles(false)
        // Salvar estado de explicação mostrada
        setQuestionExplanations(prev => new Map(prev).set(currentQuestionIndex, true))
      }, 1500) // Wait for animation to finish
    } else {
      setShowShakeAnimation(true)
      setShowParticles(true)
      setParticleType('error')
      setTimeout(() => {
        setShowExplanation(true)
        setShowParticles(false)
        setShowShakeAnimation(false)
        // Salvar estado de explicação mostrada
        setQuestionExplanations(prev => new Map(prev).set(currentQuestionIndex, true))
      }, 800)
    }
  }

  const handleNextQuestion = () => {
    // Reset animation states
    setShowXpAnimation(false)
    
    // Check if level up should be shown
    if (levelUpData) {
      setShowLevelUpNotification(true)
      return // Don't proceed until level up is dismissed
    }
    
    if (currentQuestionIndex + 1 >= questions.length) {
      // Session complete
      setSessionComplete(true)
    } else {
      // Next question
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setQuestionStartTime(Date.now())
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
      setQuestionStartTime(Date.now())
    }
  }

  const handleLevelUpComplete = () => {
    setShowLevelUpNotification(false)
    setLevelUpData(null)
    
    // Now proceed to next question or session complete
    if (currentQuestionIndex + 1 >= questions.length) {
      setSessionComplete(true)
      // Não limpar estado aqui - usuário pode querer revisar
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setQuestionStartTime(Date.now())
    }
  }

  const handleFinishSession = () => {
    navigate(`/subjects/${subjectId}/sections`)
  }

  const getAnswerButtonClass = (answer) => {
    const baseClass = 'w-full p-4 text-lg font-medium border-2 rounded-lg transition-all duration-300'
    
    if (userAnswer === null) {
      return `${baseClass} hover:scale-105 hover:shadow-md border-gray-300 hover:border-primary-300`
    }

    const currentQuestion = questions[currentQuestionIndex]
    const isThisCorrect = answer === currentQuestion.correct_answer
    const isThisSelected = answer === userAnswer

    if (isThisSelected) {
      if (isThisCorrect) {
        return `${baseClass} bg-green-100 border-green-500 text-green-800 shadow-lg animate-pulse`
      } else {
        return `${baseClass} bg-red-100 border-red-500 text-red-800 shadow-lg`
      }
    }

    if (isThisCorrect && userAnswer !== null) {
      return `${baseClass} bg-green-50 border-green-300 text-green-700 shadow-md`
    }

    return `${baseClass} border-gray-300 text-gray-500 opacity-60`
  }

  const getProgressPercentage = () => {
    return Math.round(((currentQuestionIndex + 1) / questions.length) * 100)
  }

  if (loading) {
    return (
      <Layout showFooter={false}>
        <div className="max-w-4xl mx-auto py-8 px-4">
          <div className="card p-8">
            <LoadingSpinner 
              size="lg" 
              text="Carregando questões..."
              type="dots"
            />
            <p className="text-sm text-gray-500 mt-4 text-center">
              Isso pode levar alguns segundos enquanto a IA prepara suas questões personalizadas
            </p>
          </div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout showFooter={false}>
        <div className="max-w-4xl mx-auto py-8 px-4">
          <div className="card p-8">
            <EmptyState
              icon="❌"
              title="Erro ao Carregar Questões"
              description={error}
              actionText="Tentar Novamente"
              onAction={() => {
                hasInitializedRef.current = false
                isInitializingRef.current = false
                sessionStorage.removeItem(sessionKey)
                initializeStudySession()
              }}
            />
            <div className="text-center mt-4">
              <Link
                to={`/subjects/${subjectId}/sections`}
                className="btn-secondary"
              >
                Voltar às Seções
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (questions.length === 0) {
    return (
      <Layout showFooter={false}>
        <div className="max-w-4xl mx-auto py-8 px-4">
          <div className="card p-8">
            <EmptyState
              icon="📝"
              title="Nenhuma Questão Encontrada"
              description="Não foi possível gerar questões para esta seção. Tente novamente mais tarde."
              actionText="Voltar às Seções"
              actionHref={`/subjects/${subjectId}/sections`}
            />
          </div>
        </div>
      </Layout>
    )
  }

  if (sessionComplete) {
    const accuracy = Math.round((sessionStats.correct / sessionStats.total) * 100)
    const totalTime = Math.round((Date.now() - startTime) / 1000 / 60) // minutes

    return (
      <Layout showFooter={false}>
        <div className="max-w-4xl mx-auto py-8 px-4">
          <div className="card p-8 text-center">
            <div className="text-6xl mb-6">
              {accuracy >= 80 ? '🎉' : accuracy >= 60 ? '👏' : '📚'}
            </div>
            <h2 className="text-2xl font-bold mb-4">Sessão Concluída!</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-3xl font-bold text-green-600">
                  {sessionStats.correct}
                </div>
                <div className="text-green-700">Corretas</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <div className="text-3xl font-bold text-red-600">
                  {sessionStats.incorrect}
                </div>
                <div className="text-red-700">Incorretas</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-3xl font-bold text-blue-600">
                  {accuracy}%
                </div>
                <div className="text-blue-700">Precisão</div>
              </div>
            </div>

            {/* Session Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-xl font-bold text-gray-700">{totalTime}</div>
                <div className="text-gray-600 text-sm">Minutos Estudados</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-xl font-bold text-gray-700">
                  {Math.round((sessionStats.total / totalTime) * 60) || 0}
                </div>
                <div className="text-gray-600 text-sm">Questões por Hora</div>
              </div>
            </div>

            {/* XP and Gold Gained */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  +{sessionStats.xpGained}
                </div>
                <div className="text-blue-700 text-sm flex items-center justify-center gap-1">
                  ✨ XP Ganho
                </div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  +{sessionStats.goldGained}
                </div>
                <div className="text-yellow-700 text-sm flex items-center justify-center gap-1">
                  🪙 Gold Ganho
                </div>
              </div>
            </div>

            <div className="bg-primary-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-primary-800 mb-2">
                {accuracy >= 80 ? 'Excelente desempenho!' :
                 accuracy >= 60 ? 'Bom trabalho!' :
                 'Continue estudando!'}
              </h3>
              <p className="text-primary-700 text-sm">
                {accuracy >= 80 ? 'Você dominou esta seção. Que tal tentar uma nova?' :
                 accuracy >= 60 ? 'Você está no caminho certo. Pratique mais para melhorar.' :
                 'Revise o conteúdo e tente novamente para fixar melhor os conceitos.'}
              </p>
            </div>

            <div className="flex justify-center space-x-4">
              <button
                onClick={() => {
                  setCurrentQuestionIndex(0)
                  setUserAnswer(null)
                  setShowExplanation(false)
                  setSessionComplete(false)
                  setSessionStats({ correct: 0, incorrect: 0, total: 0, xpGained: 0, goldGained: 0 })
                  setLastQuestionReward(null)
                  setStartTime(Date.now())
                  setQuestionStartTime(Date.now())
                  hasInitializedRef.current = false
                  isInitializingRef.current = false
                  sessionStorage.removeItem(sessionKey)
                  // Limpar cache de respostas
                  setQuestionAnswers(new Map())
                  setQuestionExplanations(new Map())
                  initializeStudySession()
                }}
                className="btn-secondary"
              >
                Estudar Novamente
              </button>
              <button
                onClick={handleFinishSession}
                className="btn-primary"
              >
                Voltar às Seções
              </button>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]

  return (
    <Layout showFooter={false}>
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                Questão {currentQuestionIndex + 1} de {questions.length}
              </div>
              <StreakIndicator streak={sessionStats.correct} />
            </div>
            <div className="text-sm text-gray-600">
              {sessionStats.correct}/{sessionStats.total} corretas
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <ShakeAnimation isActive={showShakeAnimation}>
          <div className="card p-8 mb-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">
              Esta afirmação está correta?
            </h2>
            <p className="text-lg text-gray-800 leading-relaxed">
              {currentQuestion.question_text}
            </p>
          </div>

          {/* Answer Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => handleAnswer(true)}
              disabled={userAnswer !== null}
              className={getAnswerButtonClass(true)}
            >
              ✅ VERDADEIRO
            </button>
            <button
              onClick={() => handleAnswer(false)}
              disabled={userAnswer !== null}
              className={getAnswerButtonClass(false)}
            >
              ❌ FALSO
            </button>
          </div>

          {/* Explanation */}
          {showExplanation && (
            <div className="border-t pt-6">
              <div className={`rounded-lg p-4 mb-4 ${
                userAnswer === currentQuestion.correct_answer
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}>
                <h3 className={`font-semibold mb-2 ${
                  userAnswer === currentQuestion.correct_answer
                    ? 'text-green-800'
                    : 'text-red-800'
                }`}>
                  {userAnswer === currentQuestion.correct_answer ? '🎉 Correto!' : '📚 Resposta Incorreta'}
                </h3>
                <p className={
                  userAnswer === currentQuestion.correct_answer
                    ? 'text-green-700'
                    : 'text-red-700'
                }>
                  {currentQuestion.explanation}
                </p>
              </div>

              {/* Source Text */}
              {currentQuestion.source_text && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2">📖 Texto Base:</h4>
                  <p className="text-gray-700 text-sm">
                    {currentQuestion.source_text}
                  </p>
                </div>
              )}

              {/* Modified Parts (for false questions) */}
              {currentQuestion.modified_parts && currentQuestion.modified_parts.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Partes Modificadas:</h4>
                  <ul className="text-yellow-700 text-sm">
                    {currentQuestion.modified_parts.map((part, index) => (
                      <li key={index} className="mb-1">• {part}</li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          )}
          
          {/* Navigation Buttons - Sempre visíveis */}
          <div className="flex justify-center items-center space-x-4 mt-6 pt-4 border-t">
            {currentQuestionIndex > 0 && (
              <button
                onClick={handlePreviousQuestion}
                className="btn-secondary px-6"
              >
                ← Questão Anterior
              </button>
            )}
            <button
              onClick={handleNextQuestion}
              className="btn-primary px-8"
            >
              {currentQuestionIndex + 1 >= questions.length ? 'Finalizar Sessão' : 'Próxima Questão'}
            </button>
          </div>
        </div>
        </ShakeAnimation>

        {/* Quick Stats */}
        <div className="text-center text-sm text-gray-500">
          <p>
            Dificuldade: {currentQuestion.difficulty}/5 • 
            Criada por: {currentQuestion.created_by_ai === 'mock' ? 'Sistema' : 'IA'}
          </p>
        </div>

        {/* Legal Text Viewer */}
        <LegalTextViewer 
          sectionContent={sectionContent}
          currentQuestion={currentQuestion}
          show={!loading} // Mostrar quando carregado
        />

        {/* AI Question Helper */}
        <AIQuestionHelper 
          question={currentQuestion}
          userAnswer={userAnswer}
          isCorrect={userAnswer === currentQuestion?.correct_answer}
          sectionContent={sectionContent}
          show={showExplanation} // Mostrar apenas após responder
        />

        {/* Animations */}
        <XpGoldAnimation 
          xpGained={lastQuestionReward?.xp || 0}
          goldGained={lastQuestionReward?.gold || 0}
          show={showXpAnimation}
          onComplete={() => setShowXpAnimation(false)}
        />

        <LevelUpNotification
          show={showLevelUpNotification}
          newLevel={levelUpData?.newLevel}
          onComplete={handleLevelUpComplete}
        />

        <ConfettiAnimation 
          show={sessionComplete}
          accuracy={sessionComplete ? Math.round((sessionStats.correct / sessionStats.total) * 100) : 0}
        />

        <ParticleSystem 
          show={showParticles}
          type={particleType}
          intensity={particleType === 'success' ? 'medium' : 'low'}
        />

        <AchievementNotification
          show={showAchievementNotification}
          achievement={currentAchievement}
          onComplete={handleAchievementNotificationComplete}
        />
      </div>
    </Layout>
  )
}

export default StudySession