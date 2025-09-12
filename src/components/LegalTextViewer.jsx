import { useState } from 'react'

// Função para processar conteúdo estruturado do arquivo direito_penal_estruturado.json

// Função para formatar como "Lei Seca" (texto legal puro)
function formatLegalTextRaw(conteudo, artigo) {
  if (!conteudo) return 'Conteúdo não disponível'
  
  let legalText = ''
  
  // Identificar se é seção com múltiplos artigos
  const hasMultipleArticles = artigo.includes('-') || Object.keys(conteudo).some(key => key.startsWith('art_'))
  
  if (hasMultipleArticles) {
    // Processar artigos individuais
    Object.keys(conteudo)
      .filter(key => key.startsWith('art_'))
      .sort() // Ordenar por nome da chave
      .forEach(key => {
        const artigoData = conteudo[key]
        const numeroArt = key.replace('art_', 'Art. ').replace('_', ' ')
        
        legalText += `${numeroArt}\n`
        
        // Tipificação
        if (artigoData.tipificacao) {
          legalText += `${artigoData.tipificacao}\n`
        }
        
        // Conduta
        if (artigoData.conduta) {
          legalText += `${artigoData.conduta}\n`
        }
        
        // Condutas múltiplas
        if (artigoData.condutas && Array.isArray(artigoData.condutas)) {
          artigoData.condutas.forEach(conduta => {
            legalText += `${conduta}\n`
          })
        }
        
        // Finalidade específica
        if (artigoData.finalidade) {
          legalText += `com o fim de ${artigoData.finalidade}\n`
        }
        
        // Penas
        if (artigoData.pena) {
          legalText += `Pena: ${artigoData.pena}\n`
        }
        if (artigoData.pena_documento_publico) {
          legalText += `Pena - documento público: ${artigoData.pena_documento_publico}\n`
        }
        if (artigoData.pena_documento_particular) {
          legalText += `Pena - documento particular: ${artigoData.pena_documento_particular}\n`
        }
        
        // Consequência/Agravante
        if (artigoData.consequencia) {
          legalText += `${artigoData.consequencia}\n`
        }
        
        // Parágrafo único
        if (artigoData.paragrafo_unico) {
          legalText += `Parágrafo único: ${artigoData.paragrafo_unico}\n`
        }
        
        // Parágrafos numerados do artigo
        Object.keys(artigoData).forEach(subKey => {
          if (subKey.startsWith('paragrafo_') && subKey !== 'paragrafo_unico') {
            const paragrafoData = artigoData[subKey]
            const numeroParag = subKey.replace('paragrafo_', '§ ')
            
            legalText += `${numeroParag} `
            
            if (typeof paragrafoData === 'string') {
              legalText += `${paragrafoData}\n`
            } else if (paragrafoData.conduta) {
              legalText += `${paragrafoData.conduta}\n`
              if (paragrafoData.pena) {
                legalText += `Pena: ${paragrafoData.pena}\n`
              }
            }
          }
        })
        
        legalText += '\n'
      })
  } else {
    // Seção com artigo único
    
    // Tipificação/Conduta principal
    if (conteudo.tipificacao) {
      legalText += `${conteudo.tipificacao}\n`
    }
    
    // Objetos/Incisos
    if (conteudo.objetos && Array.isArray(conteudo.objetos)) {
      conteudo.objetos.forEach(objeto => {
        legalText += `${objeto}\n`
      })
    }
    
    // Pena básica
    if (conteudo.pena) {
      legalText += `Pena: ${conteudo.pena}\n`
    } else if (conteudo.pena_basica) {
      legalText += `Pena: ${conteudo.pena_basica}\n`
    }
    
    legalText += '\n'
    
    // Parágrafos da seção
    Object.keys(conteudo)
      .filter(key => key.startsWith('paragrafo_'))
      .sort()
      .forEach(key => {
        const paragrafo = conteudo[key]
        const numeroParag = key.replace('paragrafo_', '§ ')
        
        legalText += `${numeroParag} `
        
        // Condutas (array)
        if (paragrafo.condutas && Array.isArray(paragrafo.condutas)) {
          paragrafo.condutas.forEach((conduta, index) => {
            if (index === 0) {
              legalText += `${conduta}\n`
            } else {
              legalText += `${conduta}\n`
            }
          })
        }
        
        // Condutas equiparadas
        if (paragrafo.condutas_equiparadas && Array.isArray(paragrafo.condutas_equiparadas)) {
          paragrafo.condutas_equiparadas.forEach(conduta => {
            legalText += `${conduta}\n`
          })
        }
        
        // Conduta única
        if (paragrafo.conduta) {
          legalText += `${paragrafo.conduta}\n`
        }
        
        // Definição
        if (paragrafo.definicao) {
          legalText += `${paragrafo.definicao}\n`
        }
        
        // Pena do parágrafo
        if (paragrafo.pena) {
          legalText += `Pena: ${paragrafo.pena}\n`
        }
        
        // Consequência
        if (paragrafo.consequencia) {
          legalText += `${paragrafo.consequencia}\n`
        }
        
        legalText += '\n'
      })
  }
  
  return legalText.trim() || 'Texto legal não disponível'
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
  
  // Formatar como lei seca (texto legal puro)
  const formattedContent = formatLegalTextRaw(conteudo, artigo)

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
                ⚖️ Lei Seca - Código Penal Brasileiro
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}


export default LegalTextViewer