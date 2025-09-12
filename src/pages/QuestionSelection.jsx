import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { QuestionsService } from '../services/questionsService'
import Layout from '../components/Layout/Layout'
import StudyModeSelector from '../components/StudyModeSelector'
import QuestionsTable from '../components/QuestionsTable'
import spacedRepetitionService from '../services/spacedRepetitionService'
import { STUDY_MODES } from '../services/studyModeService'

const QuestionSelection = () => {
  const { subjectId, sectionId } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  
  const [loading, setLoading] = useState(true)
  const [questionStats, setQuestionStats] = useState(null)
  const [error, setError] = useState('')
  const [showQuestionsTable, setShowQuestionsTable] = useState(false)

  const loadQuestionStats = useCallback(async () => {
    try {
      setLoading(true)
      const stats = await QuestionsService.getQuestionStats(
        profile.id, 
        parseInt(subjectId), 
        parseInt(sectionId)
      )
      setQuestionStats(stats)
    } catch (err) {
      console.error('Error loading question stats:', err)
      setError('Erro ao carregar estatísticas de questões.')
    } finally {
      setLoading(false)
    }
  }, [subjectId, sectionId, profile?.id])

  useEffect(() => {
    if (subjectId && sectionId && profile?.id) {
      loadQuestionStats()
    }
  }, [subjectId, sectionId, profile?.id, loadQuestionStats])

  const handleQuestionTypeSelect = (questionType) => {
    if (questionType === 'table') {
      setShowQuestionsTable(true)
      return
    }
    
    navigate(`/subjects/${subjectId}/sections/${sectionId}/study`, {
      state: { questionType }
    })
  }

  const getCardClass = (isDisabled = false) => {
    return `card p-6 cursor-pointer transition-all duration-200 ${
      isDisabled 
        ? 'opacity-50 cursor-not-allowed bg-gray-100' 
        : 'hover:scale-105 hover:shadow-lg border-2 border-transparent hover:border-primary-300'
    }`
  }

  if (loading) {
    return (
      <Layout showFooter={false}>
        <div className="max-w-4xl mx-auto py-8 px-4">
          <div className="card p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando opções de questões...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout showFooter={false}>
        <div className="max-w-4xl mx-auto py-8 px-4">
          <div className="card p-8 text-center">
            <div className="text-4xl mb-4">❌</div>
            <h2 className="text-xl font-semibold mb-4">Erro</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={loadQuestionStats}
              className="btn-primary"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  if (showQuestionsTable) {
    return (
      <Layout showFooter={false}>
        <div className="max-w-7xl mx-auto py-8 px-4">
          <div className="mb-6">
            <button
              onClick={() => setShowQuestionsTable(false)}
              className="flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-4"
            >
              ← Voltar para Escolha de Tipos
            </button>
          </div>
          <QuestionsTable 
            subjectId={parseInt(subjectId)} 
            sectionId={parseInt(sectionId)} 
          />
        </div>
      </Layout>
    )
  }

  return (
    <Layout showFooter={false}>
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Escolha o Tipo de Questões</h1>
          <p className="text-gray-600">
            Selecione como você deseja estudar esta seção
          </p>
        </div>

        {/* Question Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          {/* Questões Já Respondidas */}
          <div 
            className={getCardClass(questionStats?.answered === 0)}
            onClick={() => questionStats?.answered > 0 && handleQuestionTypeSelect('answered')}
          >
            <div className="text-center">
              <div className="text-4xl mb-4">🔄</div>
              <h3 className="text-lg font-semibold mb-2">Revisar Respondidas</h3>
              <p className="text-gray-600 text-sm mb-4">
                Estude questões que você já respondeu anteriormente
              </p>
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-blue-600">
                  {questionStats?.answered || 0}
                </div>
                <div className="text-blue-700 text-xs">questões disponíveis</div>
              </div>
            </div>
          </div>

          {/* Questões Não Respondidas */}
          <div 
            className={getCardClass(questionStats?.unanswered === 0)}
            onClick={() => questionStats?.unanswered > 0 && handleQuestionTypeSelect('unanswered')}
          >
            <div className="text-center">
              <div className="text-4xl mb-4">🆕</div>
              <h3 className="text-lg font-semibold mb-2">Questões Existentes</h3>
              <p className="text-gray-600 text-sm mb-4">
                Questões criadas pela comunidade que você ainda não respondeu
              </p>
              <div className="bg-green-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-green-600">
                  {questionStats?.unanswered || 0}
                </div>
                <div className="text-green-700 text-xs">questões disponíveis</div>
              </div>
            </div>
          </div>

          {/* Gerar Novas Questões */}
          <div 
            className={getCardClass(false)}
            onClick={() => handleQuestionTypeSelect('new')}
          >
            <div className="text-center">
              <div className="text-4xl mb-4">✨</div>
              <h3 className="text-lg font-semibold mb-2">Gerar Novas</h3>
              <p className="text-gray-600 text-sm mb-4">
                Criar questões inéditas usando inteligência artificial
              </p>
              <div className="bg-purple-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-purple-600">∞</div>
                <div className="text-purple-700 text-xs">sempre disponível</div>
              </div>
            </div>
          </div>

          {/* Tabela de Questões */}
          <div 
            className={getCardClass(false)}
            onClick={() => handleQuestionTypeSelect('table')}
          >
            <div className="text-center">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-lg font-semibold mb-2">Tabela de Questões</h3>
              <p className="text-gray-600 text-sm mb-4">
                Visualizar, analisar e gerenciar todas as questões do banco
              </p>
              <div className="bg-orange-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-orange-600">📊</div>
                <div className="text-orange-700 text-xs">análise completa</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">📊 Estatísticas da Seção</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-700">
                {questionStats?.total || 0}
              </div>
              <div className="text-gray-600 text-sm">Total no Banco</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {questionStats?.answered || 0}
              </div>
              <div className="text-gray-600 text-sm">Já Respondidas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {questionStats?.unanswered || 0}
              </div>
              <div className="text-gray-600 text-sm">Não Respondidas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">∞</div>
              <div className="text-gray-600 text-sm">Pode Gerar</div>
            </div>
          </div>
        </div>

        {/* Helper Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            💡 Dica: Questões geradas por você ficam disponíveis para outros usuários estudarem também!
          </p>
        </div>
      </div>
    </Layout>
  )
}

export default QuestionSelection