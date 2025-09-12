import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import LoadingSpinner from './LoadingSpinner'
import QuestionsCards from './QuestionsCards'
import { useIsTouchDevice, useIsPhysicalMobile } from '../hooks/useMediaQuery'

const QuestionsTable = () => {
  const isTouchDevice = useIsTouchDevice()
  const isPhysicalMobile = useIsPhysicalMobile()
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [selectedQuestions, setSelectedQuestions] = useState(new Set())
  const [highlightedQuestions, setHighlightedQuestions] = useState(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortDirection, setSortDirection] = useState('desc')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [subjects, setSubjects] = useState([])
  const [deleting, setDeleting] = useState(false)
  const [expandedQuestion, setExpandedQuestion] = useState(null)

  const questionsPerPage = 100

  const loadSubjects = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('id, name')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setSubjects(data || [])
    } catch (err) {
      console.error('Error loading subjects:', err)
    }
  }, [])

  const loadQuestions = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      let query = supabase
        .from('questions')
        .select(`
          *,
          subjects(name),
          sections(name)
        `, { count: 'exact' })

      // Apply filters
      if (searchTerm) {
        query = query.ilike('question_text', `%${searchTerm}%`)
      }

      if (selectedSubject) {
        query = query.eq('subject_id', selectedSubject)
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortDirection === 'asc' })

      // Apply pagination
      const from = (currentPage - 1) * questionsPerPage
      const to = from + questionsPerPage - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) throw error

      setQuestions(data || [])
      setTotalQuestions(count || 0)
    } catch (err) {
      console.error('Error loading questions:', err)
      setError('Erro ao carregar questões')
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchTerm, sortBy, sortDirection, selectedSubject])

  useEffect(() => {
    loadSubjects()
  }, [loadSubjects])

  useEffect(() => {
    loadQuestions()
  }, [loadQuestions])

  const handleSelectAll = () => {
    if (selectedQuestions.size === questions.length) {
      setSelectedQuestions(new Set())
    } else {
      setSelectedQuestions(new Set(questions.map(q => q.id)))
    }
  }

  const handleSelectQuestion = (questionId) => {
    const newSelected = new Set(selectedQuestions)
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId)
    } else {
      newSelected.add(questionId)
    }
    setSelectedQuestions(newSelected)
  }

  const handleHighlightQuestion = (questionId) => {
    const newHighlighted = new Set(highlightedQuestions)
    
    if (newHighlighted.has(questionId)) {
      // Remove highlight se já estiver marcado
      newHighlighted.delete(questionId)
    } else if (newHighlighted.size >= 2) {
      // Se já tem 2 highlights, remove o mais antigo e adiciona o novo
      const oldestHighlight = Array.from(newHighlighted)[0]
      newHighlighted.delete(oldestHighlight)
      newHighlighted.add(questionId)
    } else {
      // Adiciona novo highlight (máximo 2)
      newHighlighted.add(questionId)
    }
    
    setHighlightedQuestions(newHighlighted)
  }

  const clearHighlights = () => {
    setHighlightedQuestions(new Set())
  }

  const getHighlightClass = (questionId) => {
    if (!highlightedQuestions.has(questionId)) return ''
    
    const highlightedArray = Array.from(highlightedQuestions)
    const index = highlightedArray.indexOf(questionId)
    
    if (index === 0) {
      return 'bg-yellow-100 border-l-4 border-yellow-500'
    } else if (index === 1) {
      return 'bg-blue-100 border-l-4 border-blue-500'
    }
    return ''
  }

  const checkQuestionCanBeDeleted = async (questionId) => {
    try {
      const { data, error } = await supabase
        .from('user_answers')
        .select('id')
        .eq('question_id', questionId)
        .limit(1)

      if (error) throw error
      return data.length === 0
    } catch (err) {
      console.error('Error checking question dependencies:', err)
      return false
    }
  }

  const deleteQuestion = async (questionId) => {
    try {
      const canDelete = await checkQuestionCanBeDeleted(questionId)
      if (!canDelete) {
        alert('Esta questão não pode ser deletada pois possui respostas associadas.')
        return false
      }

      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionId)

      if (error) throw error
      return true
    } catch (err) {
      console.error('Error deleting question:', err)
      alert('Erro ao deletar questão: ' + err.message)
      return false
    }
  }

  const handleDeleteSingle = async (questionId) => {
    if (!confirm('Tem certeza que deseja deletar esta questão?')) return

    setDeleting(true)
    const success = await deleteQuestion(questionId)
    if (success) {
      await loadQuestions()
      setSelectedQuestions(prev => {
        const newSet = new Set(prev)
        newSet.delete(questionId)
        return newSet
      })
    }
    setDeleting(false)
  }

  const handleDeleteSelected = async () => {
    if (selectedQuestions.size === 0) return
    
    if (!confirm(`Tem certeza que deseja deletar ${selectedQuestions.size} questões selecionadas?`)) return

    setDeleting(true)
    let deletedCount = 0
    let skippedCount = 0

    for (const questionId of selectedQuestions) {
      const success = await deleteQuestion(questionId)
      if (success) {
        deletedCount++
      } else {
        skippedCount++
      }
    }

    alert(`${deletedCount} questões deletadas. ${skippedCount} questões não puderam ser deletadas (possuem respostas associadas).`)
    
    await loadQuestions()
    setSelectedQuestions(new Set())
    setDeleting(false)
  }

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortDirection('asc')
    }
    setCurrentPage(1)
  }

  const totalPages = Math.ceil(totalQuestions / questionsPerPage)

  const getSortIcon = (column) => {
    if (sortBy !== column) return '↕️'
    return sortDirection === 'asc' ? '↑' : '↓'
  }

  const truncateText = (text, maxLength = 150) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  if (loading && questions.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold">Tabela de Questões</h2>
        <div className="flex items-center gap-4">
          {highlightedQuestions.size > 0 && (
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-600">
                {highlightedQuestions.size} questão(ões) destacada(s) para comparação
              </div>
              <button
                onClick={clearHighlights}
                className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-gray-700"
              >
                Limpar Destaques
              </button>
            </div>
          )}
          <div className="text-sm text-gray-600">
            Total: {totalQuestions} questões
          </div>
        </div>
      </div>

      {/* Comparison Help */}
      {highlightedQuestions.size === 0 && (
        <div className="card p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3">
            <div className="text-2xl">💡</div>
            <div>
              <h3 className="font-semibold text-blue-900">Dica para Comparação</h3>
              <p className="text-blue-700 text-sm">
                Use o botão de highlight (🎯) para marcar até 2 questões e facilitar a comparação visual entre elas. 
                As questões destacadas aparecerão com cores diferentes para fácil identificação.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Highlighted Questions Summary */}
      {highlightedQuestions.size > 0 && (
        <div className="card p-4 bg-gradient-to-r from-yellow-50 to-blue-50 border">
          <h3 className="font-semibold mb-3">🎯 Questões Destacadas para Comparação</h3>
          <div className="space-y-2">
            {Array.from(highlightedQuestions).map((questionId, index) => {
              const question = questions.find(q => q.id === questionId)
              if (!question) return null
              
              const colorClass = index === 0 ? 'border-l-4 border-yellow-500 bg-yellow-50' : 'border-l-4 border-blue-500 bg-blue-50'
              const colorLabel = index === 0 ? 'Amarelo' : 'Azul'
              
              return (
                <div key={questionId} className={`p-3 rounded ${colorClass}`}>
                  <div className="flex justify-between items-start">
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => setExpandedQuestion(
                        expandedQuestion === questionId ? null : questionId
                      )}
                    >
                      <div className="text-xs font-medium text-gray-600 mb-1">
                        Questão {index + 1} ({colorLabel}) - {question.subjects?.name}
                      </div>
                      {expandedQuestion === questionId ? (
                        <div className="text-sm">
                          <div className="whitespace-pre-wrap mb-3">
                            {question.question_text}
                          </div>
                          {question.explanation && (
                            <div className="bg-white bg-opacity-50 p-3 rounded border-l-4 border-blue-400">
                              <div className="font-medium mb-1 text-blue-800">💡 Explicação:</div>
                              <div className="text-gray-700 whitespace-pre-wrap">
                                {question.explanation}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm whitespace-pre-wrap">
                          {question.question_text}
                          {question.explanation && (
                            <div className="mt-2 text-xs text-blue-600 italic">
                              💡 Clique para ver a explicação
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleHighlightQuestion(questionId)}
                      className="ml-2 text-red-500 hover:text-red-700 text-xs"
                      title="Remover destaque"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Buscar por texto:</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Digite parte do texto da questão..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Matéria:</label>
            <select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Todas as matérias</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2">
            {selectedQuestions.size > 0 && (
              <button
                onClick={handleDeleteSelected}
                disabled={deleting}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Deletando...
                  </>
                ) : (
                  <>
                    🗑️ Deletar Selecionadas ({selectedQuestions.size})
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="card p-4 bg-red-50 border-red-200">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Questions Display - Responsive */}
      {isPhysicalMobile ? (
        // Mobile: Cards Layout
        <div className="space-y-4">
          <QuestionsCards 
            questions={questions}
            selectedQuestions={selectedQuestions}
            highlightedQuestions={highlightedQuestions}
            onToggleSelect={toggleQuestionSelection}
            onToggleHighlight={toggleQuestionHighlight}
            onExpandQuestion={setExpandedQuestion}
            expandedQuestion={expandedQuestion}
          />
        </div>
      ) : (
        // Desktop: Table Layout
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={questions.length > 0 && selectedQuestions.size === questions.length}
                    onChange={handleSelectAll}
                    className="rounded"
                  />
                </th>
                <th 
                  className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('question_text')}
                >
                  Questão {getSortIcon('question_text')}
                </th>
                <th 
                  className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('correct_answer')}
                >
                  Resposta {getSortIcon('correct_answer')}
                </th>
                <th 
                  className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('created_at')}
                >
                  Criado em {getSortIcon('created_at')}
                </th>
                <th className="px-4 py-3 text-left">Matéria</th>
                <th className="px-4 py-3 text-center">Comparar</th>
                <th className="px-4 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((question) => (
                <tr key={question.id} className={`border-t hover:bg-gray-50 ${getHighlightClass(question.id)}`}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedQuestions.has(question.id)}
                      onChange={() => handleSelectQuestion(question.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-2">
                      <div 
                        className="cursor-pointer"
                        onClick={() => setExpandedQuestion(
                          expandedQuestion === question.id ? null : question.id
                        )}
                      >
                        {expandedQuestion === question.id ? (
                          <div className="text-sm">
                            <div className="font-medium mb-2">📝 Questão completa:</div>
                            <div className="whitespace-pre-wrap bg-gray-50 p-3 rounded border">
                              {question.question_text}
                            </div>
                            {question.explanation && (
                              <div className="mt-2">
                                <div className="font-medium mb-1">💡 Explicação:</div>
                                <div className="text-gray-700 bg-blue-50 p-3 rounded border">
                                  {question.explanation}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : highlightedQuestions.has(question.id) ? (
                          <div className="text-sm">
                            <div className="whitespace-pre-wrap">
                              {question.question_text}
                            </div>
                            {question.explanation && (
                              <span className="text-primary-600 ml-2 cursor-pointer hover:underline">
                                Ver explicação...
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm">
                            {truncateText(question.question_text)}
                            {(question.question_text.length > 150 || question.explanation) && (
                              <span className="text-primary-600 ml-2 cursor-pointer hover:underline">
                                Ver mais...
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      question.correct_answer 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {question.correct_answer ? 'Verdadeiro' : 'Falso'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(question.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div>
                      <div className="font-medium">{question.subjects?.name}</div>
                      <div className="text-gray-500 text-xs">{question.sections?.name}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleHighlightQuestion(question.id)}
                      className={`p-1 rounded transition-colors ${
                        highlightedQuestions.has(question.id)
                          ? 'bg-yellow-200 text-yellow-800 hover:bg-yellow-300'
                          : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'
                      }`}
                      title={
                        highlightedQuestions.has(question.id)
                          ? 'Remover destaque'
                          : highlightedQuestions.size >= 2
                          ? 'Substituir destaque mais antigo'
                          : 'Destacar para comparação'
                      }
                    >
                      🎯
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleDeleteSingle(question.id)}
                      disabled={deleting}
                      className="text-red-600 hover:text-red-800 disabled:opacity-50 p-1"
                      title="Deletar questão"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {questions.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            Nenhuma questão encontrada com os filtros aplicados.
          </div>
        )}
      </div>
      )}

      {/* Empty State - Mobile */}
      {isPhysicalMobile && questions.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          <div className="mb-4 text-4xl">📝</div>
          <p className="text-lg font-medium">Nenhuma questão encontrada</p>
          <p className="text-sm">Ajuste os filtros para ver mais resultados</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            ⏮️ Primeira
          </button>
          
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            ⬅️ Anterior
          </button>

          <span className="px-4 py-1 text-sm">
            Página {currentPage} de {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Próxima ➡️
          </button>

          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Última ⏭️
          </button>
        </div>
      )}

      {loading && questions.length > 0 && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      )}
    </div>
  )
}

export default QuestionsTable