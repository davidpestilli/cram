import axios from 'axios'

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'
const API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY

const deepseekClient = axios.create({
  baseURL: 'https://api.deepseek.com/v1',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
  },
  timeout: 30000
})

class AIChatService {
  
  /**
   * Constrói o contexto completo da questão para a IA
   */
  buildContextPrompt(question, userAnswer, isCorrect, chatHistory = [], sectionContent = null) {
    const statusText = isCorrect ? '✅ ACERTOU' : '❌ ERROU'
    const userAnswerText = userAnswer ? 'VERDADEIRA' : 'FALSA'
    const correctAnswerText = question.correct_answer ? 'VERDADEIRA' : 'FALSA'

    let contextPrompt = `
CONTEXTO DA QUESTÃO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Questão: "${question.question_text}"

🎯 Resposta correta: ${correctAnswerText}
👤 Resposta do usuário: ${userAnswerText}
📊 Resultado: ${statusText}

📖 EXPLICAÇÃO OFICIAL:
${question.explanation}

⚖️ BASE LEGAL COMPLETA:
${this.formatCompleteLegalText(sectionContent, question)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`

    if (chatHistory.length > 0) {
      contextPrompt += `
💬 CONVERSA ANTERIOR:
${chatHistory.map(msg => `${msg.role === 'user' ? '👤 Usuário' : '🤖 IA'}: ${msg.content}`).join('\n')}

`
    }

    contextPrompt += `
🎓 INSTRUÇÕES PARA A IA:
- Seja um professor paciente e didático de Direito Penal
- Use linguagem clara e exemplos práticos
- ${isCorrect ? 
    'O usuário acertou! Aprofunde o conhecimento e parabenize.' : 
    'O usuário errou. Explique gentilmente onde foi o erro e como evitar.'
  }
- Foque sempre no aspecto educativo
- Use emojis para tornar a explicação mais amigável
- Limite sua resposta a no máximo 300 palavras

👤 PERGUNTA DO USUÁRIO: `

    return contextPrompt
  }

  /**
   * Gera sugestões contextuais baseadas no desempenho
   */
  getSmartSuggestions(question, isCorrect) {
    const baseSuggestions = [
      "💡 Explique este conceito com mais detalhes",
      "🏛️ Dê um exemplo prático desta situação", 
      "📚 Como isso aparece em provas?",
      "🔗 Quais artigos se relacionam com este?"
    ]
    
    if (!isCorrect) {
      return [
        "❓ Por que minha resposta está errada?",
        "🎯 Como não errar questões similares?", 
        "⚠️ Qual é a pegadinha desta questão?",
        "💭 Me ajude a memorizar isso",
        ...baseSuggestions.slice(0, 2)
      ]
    }
    
    return [
      "🤔 Quais são as exceções a esta regra?",
      "⚖️ Como isso se relaciona com outros crimes?",
      "📈 Me dê casos mais complexos",
      "🏆 Que nível de dificuldade eu deveria estudar?",
      ...baseSuggestions.slice(0, 2)
    ]
  }

  /**
   * Envia mensagem para a IA
   */
  async sendMessage(fullPrompt) {
    try {
      console.log('🤖 Enviando pergunta para a IA...')
      console.log('📝 Tamanho do prompt:', fullPrompt.length, 'caracteres')
      
      // Sanitizar e limitar o prompt
      const sanitizedPrompt = fullPrompt
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove caracteres de controle
        .substring(0, 4000) // Limita tamanho
        .trim()
      
      if (sanitizedPrompt.length !== fullPrompt.length) {
        console.log('⚠️ Prompt sanitizado/truncado')
      }
      
      const response = await deepseekClient.post('/chat/completions', {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `Você é um professor especialista em Direito Penal brasileiro com mais de 20 anos de experiência.
            
            CARACTERÍSTICAS:
            - Didático e paciente
            - Usa exemplos práticos do cotidiano
            - Explica de forma simples sem perder a precisão técnica
            - Encoraja o aprendizado
            - Usa emojis moderadamente para deixar amigável
            
            SEMPRE:
            - Responda de forma direta ao que foi perguntado
            - Use linguagem acessível 
            - Dê exemplos quando possível
            - Seja encorajador com erros
            - Limite a 300 palavras`
          },
          {
            role: 'user', 
            content: sanitizedPrompt
          }
        ],
        max_tokens: 600,
        temperature: 0.7,
        top_p: 0.9
      })

      if (!response.data?.choices?.[0]?.message?.content) {
        throw new Error('Resposta vazia da IA')
      }

      const aiResponse = response.data.choices[0].message.content
      console.log('✅ Resposta da IA recebida')
      
      return aiResponse

    } catch (error) {
      console.error('❌ Erro no chat com IA:', error)
      console.error('📊 Status:', error.response?.status)
      console.error('📋 Dados:', error.response?.data)
      console.error('📨 Config:', error.config?.data ? JSON.parse(error.config.data) : 'N/A')
      
      if (error.response?.status === 400) {
        console.error('🔍 Erro 400 - Requisição inválida. Possíveis causas:')
        console.error('- Prompt muito longo:', sanitizedPrompt.length, 'chars')
        console.error('- Caracteres especiais no prompt')
        console.error('- Parâmetros inválidos na requisição')
        return '🔍 Pergunta muito complexa. Tente uma pergunta mais simples e direta.'
      }
      
      if (error.response?.status === 401) {
        return '🔑 Problema de autenticação. Verifique a configuração da API.'
      }
      
      if (error.response?.status === 429) {
        return '⏰ Muitas perguntas! Aguarde um momento e tente novamente.'
      }
      
      if (error.response?.status >= 500) {
        return '🔧 Nosso professor IA está temporariamente indisponível. Tente novamente em alguns minutos.'
      }
      
      return '😅 Ops! Houve um problema na comunicação. Por favor, reformule sua pergunta e tente novamente.'
    }
  }

  /**
   * Verifica se o serviço está disponível
   */
  isAvailable() {
    const hasKey = !!API_KEY
    if (!hasKey) {
      console.warn('⚠️ VITE_DEEPSEEK_API_KEY não configurada')
    }
    return hasKey
  }

  /**
   * Testa a conexão com a API
   */
  async testConnection() {
    try {
      console.log('🧪 Testando conexão com DeepSeek API...')
      
      const response = await this.sendMessage('Teste de conexão. Responda apenas: "OK"')
      
      console.log('✅ Conexão testada com sucesso:', response)
      return { success: true, response }
    } catch (error) {
      console.error('❌ Falha no teste de conexão:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Formata o texto legal completo para o contexto da IA
   */
  formatCompleteLegalText(sectionContent, question) {
    if (!sectionContent?.conteudo) {
      // Fallback para o texto básico da questão
      return question.source_text || 'Art. 293 - Falsificar, fabricando-os ou alterando-os'
    }

    const { artigo, titulo, conteudo } = sectionContent
    let fullText = `${artigo} - ${titulo}\n\n`

    // Tipificação
    if (conteudo.tipificacao) {
      fullText += `${conteudo.tipificacao}\n\n`
    }

    // Objetos (incisos)
    if (conteudo.objetos && Array.isArray(conteudo.objetos)) {
      fullText += `OBJETOS PROTEGIDOS:\n`
      conteudo.objetos.forEach(objeto => {
        fullText += `${objeto}\n`
      })
      fullText += '\n'
    }

    // Elementos do crime
    if (conteudo.elementos && Array.isArray(conteudo.elementos)) {
      fullText += `ELEMENTOS DO CRIME:\n`
      conteudo.elementos.forEach(elemento => {
        fullText += `• ${elemento}\n`
      })
      fullText += '\n'
    }

    // Objetos protegidos (diferente de objetos/incisos)
    if (conteudo.objetos_protegidos && Array.isArray(conteudo.objetos_protegidos)) {
      fullText += `BENS JURÍDICOS PROTEGIDOS:\n`
      conteudo.objetos_protegidos.forEach(objeto => {
        fullText += `• ${objeto}\n`
      })
      fullText += '\n'
    }

    // Pena
    if (conteudo.pena) {
      fullText += `PENA: ${conteudo.pena}\n\n`
    }

    // Observações
    if (conteudo.observacoes) {
      fullText += `OBSERVAÇÕES IMPORTANTES:\n${conteudo.observacoes}\n\n`
    }

    return fullText.trim()
  }

  /**
   * Processa pergunta com contexto completo
   */
  async askQuestion(userMessage, question, userAnswer, isCorrect, chatHistory = [], sectionContent = null) {
    if (!this.isAvailable()) {
      throw new Error('Serviço de IA não configurado')
    }

    const contextPrompt = this.buildContextPrompt(question, userAnswer, isCorrect, chatHistory, sectionContent)
    const fullPrompt = contextPrompt + userMessage
    
    return await this.sendMessage(fullPrompt)
  }
}

export default new AIChatService()