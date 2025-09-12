import React from 'react'

/**
 * Componente mobile-friendly para exibir questões em formato de cards
 */
const QuestionsCards = ({
  questions,
  selectedQuestions,
  highlightedQuestions,
  onToggleSelect,
  onToggleHighlight,
  onExpandQuestion,
  expandedQuestion
}) => {

  const truncateText = (text, maxLength = 100) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  const getSubjectColor = (subjectId) => {
    const colors = {
      1: 'bg-red-100 text-red-800 border-red-200',
      2: 'bg-blue-100 text-blue-800 border-blue-200', 
      3: 'bg-green-100 text-green-800 border-green-200',
      4: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      5: 'bg-purple-100 text-purple-800 border-purple-200',
      6: 'bg-pink-100 text-pink-800 border-pink-200'
    }
    return colors[subjectId] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  return (
    <div className="space-y-4">
      {questions.map((question, index) => {
        const isSelected = selectedQuestions.has(question.id)
        const isHighlighted = highlightedQuestions.has(question.id)
        const isExpanded = expandedQuestion === question.id

        return (
          <div
            key={question.id}
            className={`
              border-2 rounded-xl p-4 transition-all duration-200
              ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
              ${isHighlighted ? 'border-yellow-500 bg-yellow-50' : ''}
              ${isSelected && isHighlighted ? 'border-purple-500 bg-purple-50' : ''}
              shadow-sm hover:shadow-md
            `}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                {/* Question ID and Subject */}
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs font-mono text-gray-500">
                    #{question.id.substring(0, 8)}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getSubjectColor(question.subject_id)}`}>
                    {question.subjects?.name || `Matéria ${question.subject_id}`}
                  </span>
                </div>

                {/* Difficulty and Answer */}
                <div className="flex items-center space-x-2">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < question.difficulty ? '' : 'opacity-30'}>
                        ⭐
                      </span>
                    ))}
                  </div>
                  <span className={`text-sm font-semibold ${
                    question.correct_answer ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {question.correct_answer ? '✅ V' : '❌ F'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 ml-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleSelect(question.id)
                  }}
                  className={`p-2 rounded-lg transition-colors ${
                    isSelected 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title="Selecionar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleHighlight(question.id)
                  }}
                  className={`p-2 rounded-lg transition-colors ${
                    isHighlighted 
                      ? 'bg-yellow-500 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title="Destacar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Question Text */}
            <div 
              className="cursor-pointer"
              onClick={() => onExpandQuestion(isExpanded ? null : question.id)}
            >
              <p className="text-gray-800 text-sm leading-relaxed">
                {isExpanded 
                  ? question.question_text 
                  : truncateText(question.question_text)
                }
              </p>
              
              {question.question_text.length > 100 && (
                <button className="text-blue-600 text-xs mt-1 hover:underline">
                  {isExpanded ? 'Ver menos' : 'Ver mais'}
                </button>
              )}
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                {/* Explanation */}
                {question.explanation && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Explicação:</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {question.explanation}
                    </p>
                  </div>
                )}

                {/* Source Text */}
                {question.source_text && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Texto Base:</h4>
                    <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                      {question.source_text}
                    </p>
                  </div>
                )}

                {/* Metadata */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  <span>🤖 {question.created_by_ai || 'deepseek'}</span>
                  <span>📅 {new Date(question.created_at).toLocaleDateString('pt-BR')}</span>
                  {question.modified_parts && question.modified_parts.length > 0 && (
                    <span>✏️ {question.modified_parts.length} modificações</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default QuestionsCards