import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/Layout/Layout'

const Sections = () => {
  const { subjectId } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  
  const [subject, setSubject] = useState(null)
  const [sections, setSections] = useState([])
  const [userStats, setUserStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (subjectId) {
      fetchSubjectData()
    }
  }, [subjectId])

  const fetchSubjectData = async () => {
    try {
      setLoading(true)

      // Buscar dados da matéria
      const { data: subjectData, error: subjectError } = await supabase
        .from('subjects')
        .select('*')
        .eq('id', subjectId)
        .single()

      if (subjectError) throw subjectError

      // Verificar se matéria está ativa
      if (!subjectData.is_active) {
        setError('Esta matéria ainda não está disponível')
        return
      }

      setSubject(subjectData)

      // Buscar seções da matéria
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('sections')
        .select('*')
        .eq('subject_id', subjectId)
        .eq('is_active', true)
        .order('order_index')

      if (sectionsError) throw sectionsError
      setSections(sectionsData || [])

      // Buscar estatísticas do usuário se estiver logado
      if (profile) {
        const { data: statsData, error: statsError } = await supabase
          .from('user_section_stats')
          .select('*')
          .eq('user_id', profile.id)
          .eq('subject_id', subjectId)

        if (statsError && statsError.code !== 'PGRST116') {
          console.error('Error fetching user stats:', statsError)
        }

        // Converter array de stats em objeto indexado por section_id
        const statsMap = {}
        if (statsData) {
          statsData.forEach(stat => {
            statsMap[stat.section_id] = stat
          })
        }
        setUserStats(statsMap)
      }

    } catch (err) {
      setError('Erro ao carregar seções')
      console.error('Error fetching sections:', err)
    } finally {
      setLoading(false)
    }
  }

  const getSectionProgress = (sectionId) => {
    const stats = userStats[sectionId]
    if (!stats || stats.questions_answered === 0) return 0
    return Math.round((stats.questions_correct / stats.questions_answered) * 100)
  }

  const getSectionStatus = (sectionId) => {
    const stats = userStats[sectionId]
    if (!stats || stats.questions_answered === 0) {
      return { label: 'Não iniciado', color: 'gray' }
    }
    
    const progress = getSectionProgress(sectionId)
    if (progress >= 80) {
      return { label: 'Dominado', color: 'green' }
    } else if (progress >= 60) {
      return { label: 'Bom', color: 'blue' }
    } else if (progress >= 40) {
      return { label: 'Regular', color: 'yellow' }
    } else {
      return { label: 'Precisa revisar', color: 'red' }
    }
  }

  const getStatusBadgeClasses = (color) => {
    const colors = {
      gray: 'bg-gray-100 text-gray-800',
      green: 'bg-green-100 text-green-800',
      blue: 'bg-blue-100 text-blue-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      red: 'bg-red-100 text-red-800'
    }
    return colors[color] || colors.gray
  }

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6">
              {error}
            </div>
            <Link
              to="/subjects"
              className="btn-primary"
            >
              Voltar para Matérias
            </Link>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <Link to="/subjects" className="text-gray-500 hover:text-gray-700">
                  Matérias
                </Link>
              </li>
              <li>
                <svg className="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </li>
              <li>
                <span className="text-gray-900 font-medium">{subject?.name}</span>
              </li>
            </ol>
          </nav>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div 
              className="w-16 h-16 rounded-lg flex items-center justify-center text-3xl"
              style={{ 
                backgroundColor: `${subject?.color_code}20`,
                color: subject?.color_code
              }}
            >
              ⚖️
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {subject?.name}
              </h1>
              <p className="text-gray-600">
                {subject?.description}
              </p>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card p-4">
              <div className="text-2xl font-bold text-primary-600">
                {sections.length}
              </div>
              <div className="text-sm text-gray-500">Seções disponíveis</div>
            </div>
            <div className="card p-4">
              <div className="text-2xl font-bold text-green-600">
                {Object.keys(userStats).length}
              </div>
              <div className="text-sm text-gray-500">Seções estudadas</div>
            </div>
            <div className="card p-4">
              <div className="text-2xl font-bold text-blue-600">
                {Object.values(userStats).reduce((sum, stat) => sum + stat.questions_answered, 0)}
              </div>
              <div className="text-sm text-gray-500">Questões respondidas</div>
            </div>
            <div className="card p-4">
              <div className="text-2xl font-bold text-yellow-600">
                {Object.values(userStats).length > 0 
                  ? Math.round(Object.values(userStats).reduce((sum, stat) => sum + (stat.questions_correct / Math.max(stat.questions_answered, 1) * 100), 0) / Object.values(userStats).length)
                  : 0}%
              </div>
              <div className="text-sm text-gray-500">Taxa de acerto média</div>
            </div>
          </div>
        </div>

        {/* Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section, index) => {
            const status = getSectionStatus(section.id)
            const progress = getSectionProgress(section.id)
            const stats = userStats[section.id]

            return (
              <div
                key={section.id}
                className="card p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center text-primary-700 font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClasses(status.color)}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {section.name}
                </h3>

                {/* Description */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {section.description}
                </p>

                {/* Progress */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Progresso</span>
                    <span className="text-gray-900 font-medium">
                      {stats ? `${stats.questions_correct}/${stats.questions_answered}` : '0/0'}
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: subject?.color_code || '#EF4444'
                      }}
                    ></div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-2">
                    <Link
                      to={`/subjects/${subjectId}/sections/${section.id}/select`}
                      className="w-full btn-primary text-center block"
                    >
                      {stats && stats.questions_answered > 0 ? 'Continuar estudando' : 'Começar'}
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Study Tips */}
        <div className="mt-12">
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">💡 Dicas de Estudo</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-start space-x-2">
                <span className="text-green-500">✅</span>
                <div>
                  <strong>Estude em ordem:</strong> As seções foram organizadas em sequência lógica para melhor aprendizado.
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-blue-500">🔄</span>
                <div>
                  <strong>Revise regularmente:</strong> Volte às seções com baixo desempenho para fixar o conteúdo.
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-purple-500">🎯</span>
                <div>
                  <strong>Meta de 80%:</strong> Busque pelo menos 80% de acerto para considerar a seção dominada.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Sections