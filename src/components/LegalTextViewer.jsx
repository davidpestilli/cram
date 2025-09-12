import { useState } from 'react'

// Função para processar conteúdo estruturado do arquivo direito_penal_estruturado.json

// Função para formatar conteúdo legal estruturado
function formatCompleteLegalContent(conteudo) {
  if (!conteudo) return 'Conteúdo não disponível'
  
  let formattedContent = ''
  
  // Tipificação
  if (conteudo.tipificacao) {
    formattedContent += `📋 TIPIFICAÇÃO:\n${conteudo.tipificacao}\n\n`
  }
  
  // Objetos/Incisos (mais comum na Seção 1)
  if (conteudo.objetos && Array.isArray(conteudo.objetos)) {
    formattedContent += `📜 OBJETOS PROTEGIDOS (INCISOS):\n`
    conteudo.objetos.forEach(objeto => {
      formattedContent += `${objeto}\n`
    })
    formattedContent += '\n'
  }
  
  // Parágrafos estruturados (comum nas seções 2+)
  Object.keys(conteudo).forEach(key => {
    if (key.startsWith('paragrafo_')) {
      const paragrafo = conteudo[key]
      const numeroParag = key.replace('paragrafo_', '§')
      
      formattedContent += `📑 ${numeroParag.toUpperCase()}:\n`
      
      // Condutas (array)
      if (paragrafo.condutas && Array.isArray(paragrafo.condutas)) {
        formattedContent += `🔸 CONDUTAS:\n`
        paragrafo.condutas.forEach(conduta => {
          formattedContent += `   ${conduta}\n`
        })
      }
      
      // Conduta única
      if (paragrafo.conduta) {
        formattedContent += `🔸 CONDUTA: ${paragrafo.conduta}\n`
      }
      
      // Definição
      if (paragrafo.definicao) {
        formattedContent += `🔸 DEFINIÇÃO: ${paragrafo.definicao}\n`
      }
      
      // Pena
      if (paragrafo.pena) {
        formattedContent += `⚖️ PENA: ${paragrafo.pena}\n`
      }
      
      formattedContent += '\n'
    }
  })
  
  // Elementos do crime
  if (conteudo.elementos && Array.isArray(conteudo.elementos)) {
    formattedContent += `⚖️ ELEMENTOS DO CRIME:\n`
    conteudo.elementos.forEach(elemento => {
      formattedContent += `• ${elemento}\n`
    })
    formattedContent += '\n'
  }
  
  // Sujeitos
  if (conteudo.sujeito_ativo) {
    formattedContent += `👤 SUJEITO ATIVO: ${conteudo.sujeito_ativo}\n`
  }
  if (conteudo.sujeito_passivo) {
    formattedContent += `👥 SUJEITO PASSIVO: ${conteudo.sujeito_passivo}\n`
  }
  if (conteudo.sujeito_ativo || conteudo.sujeito_passivo) {
    formattedContent += '\n'
  }
  
  // Pena básica (para seções que não têm parágrafos)
  if (conteudo.pena && !Object.keys(conteudo).some(k => k.startsWith('paragrafo_'))) {
    formattedContent += `⚖️ PENA: ${conteudo.pena}\n\n`
  }
  
  // Pontos-chave
  if (conteudo.pontos_chave && Array.isArray(conteudo.pontos_chave)) {
    formattedContent += `💡 PONTOS-CHAVE:\n`
    conteudo.pontos_chave.forEach(ponto => {
      formattedContent += `• ${ponto}\n`
    })
    formattedContent += '\n'
  }
  
  return formattedContent.trim() || 'Informações não disponíveis'
}

const LegalTextViewer = ({ sectionContent, show = true }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  // Não renderizar se não deve mostrar ou não há conteúdo
  if (!show || !sectionContent) {
    return null
  }

  // Extrair dados da seção do arquivo direito_penal_estruturado.json
  const { titulo, artigo, conteudo } = sectionContent
  
  // Formatar o conteúdo usando a estrutura já organizada
  const formattedContent = formatCompleteLegalContent(conteudo)

  const handleCopyText = async () => {
    try {
      const textToCopy = `${artigo} - ${titulo}\n\n${formattedContent}`
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Erro ao copiar texto:', error)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  return (
    <>
      {/* Botão flutuante esquerdo */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`
            fixed bottom-6 left-6 z-50
            bg-green-600 hover:bg-green-700 text-white
            px-4 py-3 rounded-full shadow-lg
            flex items-center space-x-2
            transition-all duration-300 hover:scale-105
            animate-pulse hover:animate-none
          `}
          title="Ver texto legal completo desta seção"
        >
          <span className="text-lg">📖</span>
          <span className="hidden sm:inline text-sm font-medium">
            Ver Lei
          </span>
        </button>
      )}

      {/* Modal do texto legal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={handleClose}
          />
          
          {/* Modal Panel */}
          <div className="
            relative bg-white rounded-xl shadow-2xl
            w-full max-w-4xl max-h-[90vh]
            flex flex-col
            animate-in zoom-in-95 duration-300
          ">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b bg-green-50 rounded-t-xl">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-xl">⚖️</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{artigo}</h3>
                  <p className="text-sm text-gray-600">{titulo}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Botão de copiar */}
                <button
                  onClick={handleCopyText}
                  className={`
                    px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${copied 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }
                  `}
                  title="Copiar texto legal"
                >
                  {copied ? (
                    <>
                      <span className="text-xs">✅</span>
                      <span className="ml-1">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <span className="text-xs">📋</span>
                      <span className="ml-1 hidden sm:inline">Copiar</span>
                    </>
                  )}
                </button>

                {/* Botão fechar */}
                <button
                  onClick={handleClose}
                  className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors"
                  title="Fechar"
                >
                  <span className="text-gray-600 text-sm">✕</span>
                </button>
              </div>
            </div>


            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="prose prose-sm max-w-none">
                <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {formattedContent}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-gray-50 text-center">
              <p className="text-xs text-gray-500">
                📚 Texto legal oficial completo
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}


export default LegalTextViewer