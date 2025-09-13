import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout/Layout'

const Subjects = () => {
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSubjects()
  }, [])

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('id')

      if (error) throw error
      setSubjects(data || [])
    } catch (err) {
      setError('Erro ao carregar matérias')
      console.error('Error fetching subjects:', err)
    } finally {
      setLoading(false)
    }
  }

  const getSubjectIcon = (icon) => {
    const icons = {
      gavel: '⚖️',
      court: '🏛️',
      handshake: '🤝',
      document: '📄',
      flag: '🏴',
      building: '🏢',
      calculator: '🧮'
    }
    return icons[icon] || '📚'
  }

  const getStatusBadge = (isActive) => {
    if (isActive) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Disponível
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        Em breve
      </span>
    )
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

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Matérias
              </h1>
              <p className="text-gray-600">
                Escolha uma matéria para começar seus estudos
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">
                {subjects.filter(s => s.is_active).length} de {subjects.length} disponíveis
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Subjects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject) => (
            <div
              key={subject.id}
              className={`card p-6 transition-all duration-200 ${
                subject.is_active
                  ? 'hover:shadow-lg hover:-translate-y-1 cursor-pointer border-l-4'
                  : 'opacity-75 cursor-not-allowed'
              }`}
              style={{
                borderLeftColor: subject.is_active ? subject.color_code : '#D1D5DB'
              }}
            >
              {subject.is_active ? (
                <Link
                  to={`/subjects/${subject.id}/sections`}
                  className="block h-full"
                >
                  <SubjectCard subject={subject} />
                </Link>
              ) : (
                <SubjectCard subject={subject} />
              )}
            </div>
          ))}
        </div>

        {/* Coming Soon Section */}
        <div className="mt-12">
          <div className="card p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Mais matérias em breve!</h3>
            <p className="text-gray-600 mb-4">
              Estamos trabalhando para trazer mais conteúdo para você.
            </p>
            <div className="flex justify-center space-x-4 text-sm text-gray-500">
              <span>🔜 Português</span>
              <span>🔜 Raciocínio Lógico</span>
              <span>🔜 Informática</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

const SubjectCard = ({ subject }) => {
  const getSubjectIcon = (icon) => {
    const icons = {
      gavel: '⚖️',
      court: '🏛️',
      handshake: '🤝',
      document: '📄',
      flag: '🏴',
      building: '🏢',
      calculator: '🧮'
    }
    return icons[icon] || '📚'
  }

  const getStatusBadge = (isActive) => {
    if (isActive) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Disponível
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        Em breve
      </span>
    )
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div 
            className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
            style={{ 
              backgroundColor: subject.is_active ? `${subject.color_code}20` : '#F3F4F6',
              color: subject.is_active ? subject.color_code : '#6B7280'
            }}
          >
            {getSubjectIcon(subject.icon)}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {subject.name}
            </h3>
            {getStatusBadge(subject.is_active)}
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-600 mb-4 line-clamp-2">
        {subject.description}
      </p>

      {/* Progress/Stats */}
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Progresso</span>
          <span className="text-gray-900 font-medium">
            {subject.is_active ? '0/12 seções' : 'Bloqueado'}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-300"
            style={{
              width: subject.is_active ? '0%' : '0%',
              backgroundColor: subject.is_active ? subject.color_code : '#D1D5DB'
            }}
          ></div>
        </div>

        {subject.is_active && (
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Clique para começar</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        )}
      </div>
    </>
  )
}

export default Subjects