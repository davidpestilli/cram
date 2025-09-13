import { useState } from 'react'

// Componente para visualizar conteúdo matemático estruturado
// Equivalente ao LegalTextViewer, mas para conteúdo de Matemática

function formatMathContent(secaoData, titulo) {
  if (!secaoData) return 'Conteúdo não disponível'
  
  let mathContent = ''
  
  // Adicionar título da seção
  mathContent += `=== ${titulo} ===\n\n`
  
  if (secaoData.subsections && Array.isArray(secaoData.subsections)) {
    // Processar subseções ordenadas
    secaoData.subsections
      .sort((a, b) => a.ordem - b.ordem)
      .forEach(subsecao => {
        mathContent += `📋 ${subsecao.titulo}\n`
        mathContent += `${subsecao.conteudo}\n`
        
        // Adicionar tipo de conteúdo
        const tipoMap = {
          'conceito_base': '🔍 Conceito Fundamental',
          'metodo_calculo': '🧮 Método de Cálculo', 
          'aplicacao_pratica': '💼 Aplicação Prática',
          'interpretacao_dados': '📊 Interpretação de Dados',
          'metodo_resolucao': '🎯 Estratégia de Resolução'
        }
        
        if (subsecao.tipo && tipoMap[subsecao.tipo]) {
          mathContent += `${tipoMap[subsecao.tipo]}\n`
        }
        
        mathContent += '\n'
      })
  }
  
  return mathContent
}

function formatMathSummary(secaoData, titulo) {
  if (!secaoData) return 'Resumo não disponível'
  
  let summary = `📖 RESUMO: ${titulo}\n\n`
  
  if (secaoData.subsections && Array.isArray(secaoData.subsections)) {
    secaoData.subsections
      .sort((a, b) => a.ordem - b.ordem)
      .forEach((subsecao, index) => {
        summary += `${index + 1}. ${subsecao.titulo}\n`
        // Resumir o conteúdo (primeiras 100 caracteres)
        const resumo = subsecao.conteudo.length > 100 
          ? subsecao.conteudo.substring(0, 100) + '...'
          : subsecao.conteudo
        summary += `   ${resumo}\n\n`
      })
  }
  
  return summary
}

const MathContentViewer = ({ 
  sectionContent, 
  sectionTitle = 'Conteúdo Matemático',
  isOpen, 
  onClose 
}) => {
  const [viewMode, setViewMode] = useState('summary') // 'summary' ou 'detailed'

  if (!isOpen) return null

  const formattedContent = viewMode === 'detailed' 
    ? formatMathContent(sectionContent, sectionTitle)
    : formatMathSummary(sectionContent, sectionTitle)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
              <span className="text-emerald-600 text-sm font-bold">📚</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Ver Conteúdo - {sectionTitle}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* View Mode Selector */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('summary')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'summary'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              📋 Resumo
            </button>
            <button
              onClick={() => setViewMode('detailed')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'detailed'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              📖 Detalhado
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto p-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono leading-relaxed">
                {formattedContent}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {viewMode === 'summary' ? '📝 Visão geral dos tópicos' : '📚 Conteúdo completo para estudo'}
            </p>
            <div className="flex space-x-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MathContentViewer