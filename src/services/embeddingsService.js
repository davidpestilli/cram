import OpenAI from 'openai'

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY
const EMBEDDING_MODEL = import.meta.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small'
const SIMILARITY_THRESHOLD = parseFloat(import.meta.env.SIMILARITY_THRESHOLD) || 0.75
const MAX_REGENERATION_ATTEMPTS = parseInt(import.meta.env.MAX_REGENERATION_ATTEMPTS) || 3

class EmbeddingsService {
  constructor() {
    if (!OPENAI_API_KEY) {
      console.warn('⚠️ OpenAI API Key não configurada. Sistema de embeddings será desabilitado.')
      this.enabled = false
      return
    }

    try {
      this.openai = new OpenAI({
        apiKey: OPENAI_API_KEY,
        dangerouslyAllowBrowser: true
      })
      this.enabled = true
      console.log('✅ EmbeddingsService inicializado com sucesso')
    } catch (error) {
      console.error('❌ Erro ao inicializar OpenAI client:', error)
      this.enabled = false
    }
  }

  isEnabled() {
    return this.enabled
  }

  async generateEmbedding(text) {
    if (!this.enabled) {
      console.warn('⚠️ EmbeddingsService desabilitado. Retornando null.')
      return null
    }

    try {
      console.log(`🔄 Gerando embedding para texto: "${text.substring(0, 100)}..."`)
      
      const response = await this.openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: text.trim(),
        encoding_format: 'float'
      })

      const embedding = response.data[0].embedding
      console.log(`✅ Embedding gerado com sucesso (dimensão: ${embedding.length})`)
      
      return embedding

    } catch (error) {
      console.error('❌ Erro ao gerar embedding:', error)
      
      // Log mais detalhado para debugging
      if (error.response) {
        console.error('📊 Resposta da API:', error.response.status, error.response.data)
      }
      
      return null
    }
  }

  async generateSemanticHash(questionData) {
    try {
      const normalizedText = this.normalizeQuestionText(questionData.question_text)
      const contentKey = `${normalizedText}|${questionData.correct_answer}|${questionData.source_text || ''}`
      
      // Usar Web Crypto API do browser
      const encoder = new TextEncoder()
      const data = encoder.encode(contentKey)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      
      // Converter para hex
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
      const hash = hashHex.substring(0, 16) // Usar apenas 16 caracteres para economia de espaço

      console.log(`🔑 Hash semântico gerado: ${hash} para questão: "${questionData.question_text.substring(0, 50)}..."`)
      return hash

    } catch (error) {
      console.error('❌ Erro ao gerar hash semântico:', error)
      return null
    }
  }

  normalizeQuestionText(text) {
    if (!text) return ''
    
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')  // Remove pontuação
      .replace(/\s+/g, ' ')      // Normaliza espaços
      .trim()
  }

  extractContentCategories(questionText, sectionContent = {}) {
    try {
      const categories = []
      const text = questionText.toLowerCase()
      
      // Categorias por tipo de foco
      if (text.includes('pena') || text.includes('reclusão') || text.includes('detenção') || text.includes('multa')) {
        categories.push('pena')
      }
      
      if (text.includes('tipificação') || text.includes('falsificar') || text.includes('fabricar') || text.includes('alterar')) {
        categories.push('tipificacao')
      }
      
      if (text.includes('documento') || text.includes('papel') || text.includes('selo') || text.includes('vale')) {
        categories.push('objetos')
      }
      
      if (text.includes('sujeito') || text.includes('agente') || text.includes('autor')) {
        categories.push('sujeito')
      }
      
      if (text.includes('consumação') || text.includes('tentativa') || text.includes('configuração')) {
        categories.push('consumacao')
      }

      // Categorias por artigo (se disponível)
      if (sectionContent.artigo) {
        const articleNumber = sectionContent.artigo.match(/\d+/)?.[0]
        if (articleNumber) {
          categories.push(`art_${articleNumber}`)
        }
      }

      // Categoria por resposta
      categories.push('true_false')

      console.log(`🏷️ Categorias extraídas: ${categories.join(', ')} para questão: "${questionText.substring(0, 50)}..."`)
      return categories

    } catch (error) {
      console.error('❌ Erro ao extrair categorias:', error)
      return ['general']
    }
  }

  calculateSimilarity(embedding1, embedding2) {
    if (!embedding1 || !embedding2) return 0
    
    try {
      // Cosseno de similaridade
      let dotProduct = 0
      let norm1 = 0
      let norm2 = 0
      
      for (let i = 0; i < embedding1.length; i++) {
        dotProduct += embedding1[i] * embedding2[i]
        norm1 += embedding1[i] * embedding1[i]
        norm2 += embedding2[i] * embedding2[i]
      }
      
      const similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))
      return similarity

    } catch (error) {
      console.error('❌ Erro ao calcular similaridade:', error)
      return 0
    }
  }

  async processQuestionForEmbedding(questionData, sectionContent = {}) {
    if (!this.enabled) {
      const semanticHash = await this.generateSemanticHash(questionData)
      return {
        ...questionData,
        embedding: null,
        semantic_hash: semanticHash,
        content_categories: this.extractContentCategories(questionData.question_text, sectionContent)
      }
    }

    try {
      // Criar texto combinado para embedding (questão + explicação)
      const embeddingText = `${questionData.question_text}\n${questionData.explanation || ''}`
      
      const embedding = await this.generateEmbedding(embeddingText)
      const semanticHash = await this.generateSemanticHash(questionData)
      const contentCategories = this.extractContentCategories(questionData.question_text, sectionContent)

      return {
        ...questionData,
        embedding: embedding,
        semantic_hash: semanticHash,
        content_categories: contentCategories
      }

    } catch (error) {
      console.error('❌ Erro ao processar questão para embedding:', error)
      
      // Fallback sem embedding
      const fallbackSemanticHash = await this.generateSemanticHash(questionData)
      return {
        ...questionData,
        embedding: null,
        semantic_hash: fallbackSemanticHash,
        content_categories: this.extractContentCategories(questionData.question_text, sectionContent)
      }
    }
  }

  async findSimilarQuestions(queryEmbedding, existingQuestions, threshold = SIMILARITY_THRESHOLD) {
    if (!queryEmbedding || !Array.isArray(existingQuestions)) {
      return []
    }

    try {
      const similarities = []

      for (const question of existingQuestions) {
        if (!question.embedding) continue

        const similarity = this.calculateSimilarity(queryEmbedding, question.embedding)
        
        if (similarity > threshold) {
          similarities.push({
            question: question,
            similarity: similarity
          })
        }
      }

      // Ordenar por similaridade (maior primeiro)
      similarities.sort((a, b) => b.similarity - a.similarity)

      console.log(`🔍 Encontradas ${similarities.length} questões similares acima do threshold ${threshold}`)
      
      if (similarities.length > 0) {
        console.log('📊 Top 3 similaridades:', similarities.slice(0, 3).map(s => ({
          id: s.question.id,
          similarity: s.similarity.toFixed(3),
          text_preview: s.question.question_text?.substring(0, 50) + '...'
        })))
      }

      return similarities

    } catch (error) {
      console.error('❌ Erro ao buscar questões similares:', error)
      return []
    }
  }

  async checkForSimilarQuestions(questionData, existingQuestions, sectionContent = {}) {
    try {
      // Processar questão para embedding
      const processedQuestion = await this.processQuestionForEmbedding(questionData, sectionContent)
      
      if (!processedQuestion.embedding) {
        console.log('⚠️ Embedding não disponível, usando apenas hash semântico')
        
        // Fallback: verificar por hash semântico
        const duplicateByHash = existingQuestions.find(q => 
          q.semantic_hash === processedQuestion.semantic_hash
        )
        
        return {
          hasSimilar: !!duplicateByHash,
          mostSimilar: duplicateByHash ? {
            question: duplicateByHash,
            similarity: 1.0,
            reason: 'semantic_hash_match'
          } : null,
          processedQuestion: processedQuestion
        }
      }

      // Verificar similaridade por embedding
      const similarQuestions = await this.findSimilarQuestions(
        processedQuestion.embedding,
        existingQuestions,
        SIMILARITY_THRESHOLD
      )

      const hasSimilar = similarQuestions.length > 0
      const mostSimilar = hasSimilar ? similarQuestions[0] : null

      return {
        hasSimilar,
        mostSimilar,
        processedQuestion,
        allSimilar: similarQuestions
      }

    } catch (error) {
      console.error('❌ Erro ao verificar questões similares:', error)
      
      // Fallback seguro
      return {
        hasSimilar: false,
        mostSimilar: null,
        processedQuestion: questionData,
        allSimilar: []
      }
    }
  }

  async testConnection() {
    if (!this.enabled) {
      return {
        status: 'disabled',
        message: 'EmbeddingsService desabilitado (API Key não configurada)'
      }
    }

    try {
      console.log('🧪 Testando conexão com OpenAI Embeddings...')
      
      const testText = 'Teste de conexão com OpenAI'
      const embedding = await this.generateEmbedding(testText)
      
      if (embedding && Array.isArray(embedding) && embedding.length > 0) {
        return {
          status: 'success',
          message: `Conexão estabelecida com sucesso. Embedding gerado com ${embedding.length} dimensões.`,
          model: EMBEDDING_MODEL,
          dimensions: embedding.length
        }
      } else {
        return {
          status: 'error',
          message: 'Resposta inválida da API'
        }
      }

    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        details: error.response?.data
      }
    }
  }

  getConfig() {
    return {
      enabled: this.enabled,
      model: EMBEDDING_MODEL,
      similarityThreshold: SIMILARITY_THRESHOLD,
      maxRegenerationAttempts: MAX_REGENERATION_ATTEMPTS,
      hasApiKey: !!OPENAI_API_KEY
    }
  }
}

export default new EmbeddingsService()