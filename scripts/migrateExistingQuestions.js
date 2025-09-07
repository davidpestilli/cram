import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
// Para Node.js, podemos usar crypto diretamente
import { createHash } from 'crypto'
import fs from 'fs/promises'
import path from 'path'

// Configurações - ajuste conforme seu .env
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'your-supabase-url'
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-key'
const OPENAI_API_KEY = process.env.VITE_OPENAI_API_KEY || 'your-openai-key'

console.log('🔄 Iniciando migração de questões existentes...')
console.log('📊 Configurações:')
console.log(`   Supabase URL: ${SUPABASE_URL ? '✅ OK' : '❌ NÃO CONFIGURADO'}`)
console.log(`   OpenAI Key: ${OPENAI_API_KEY ? '✅ OK' : '❌ NÃO CONFIGURADO'}`)

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
let openai = null

if (OPENAI_API_KEY && OPENAI_API_KEY !== 'your-openai-key') {
  try {
    openai = new OpenAI({ apiKey: OPENAI_API_KEY })
    console.log('✅ OpenAI client inicializado')
  } catch (error) {
    console.warn('⚠️ Erro ao inicializar OpenAI client:', error.message)
  }
} else {
  console.warn('⚠️ OpenAI Key não configurada - apenas hash semântico será gerado')
}

class QuestionsEmbeddingsMigrator {
  constructor() {
    this.batchSize = 10 // Processar em lotes de 10 questões
    this.delayBetweenRequests = 1000 // 1 segundo entre requests OpenAI
    this.stats = {
      total: 0,
      processed: 0,
      withEmbeddings: 0,
      withHashOnly: 0,
      errors: 0,
      skipped: 0
    }
  }

  async generateEmbedding(text) {
    if (!openai) return null

    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text.trim(),
        encoding_format: 'float'
      })

      return response.data[0].embedding
    } catch (error) {
      console.error('❌ Erro ao gerar embedding:', error.message)
      return null
    }
  }

  generateSemanticHash(questionData) {
    try {
      const normalizedText = this.normalizeQuestionText(questionData.question_text)
      const contentKey = `${normalizedText}|${questionData.correct_answer}|${questionData.source_text || ''}`
      
      return createHash('sha256')
        .update(contentKey)
        .digest('hex')
        .substring(0, 16)
    } catch (error) {
      console.error('❌ Erro ao gerar hash:', error)
      return null
    }
  }

  normalizeQuestionText(text) {
    if (!text) return ''
    
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  extractContentCategories(questionText) {
    const categories = []
    const text = questionText.toLowerCase()
    
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

    categories.push('true_false')
    
    return categories.length > 1 ? categories : ['general']
  }

  async getQuestionsToMigrate() {
    try {
      console.log('📚 Buscando questões para migração...')
      
      const { data: questions, error } = await supabase
        .from('questions')
        .select('id, question_text, correct_answer, explanation, source_text, embedding, semantic_hash, content_categories, created_at')
        .is('embedding', null) // Só questões sem embedding
        .order('created_at', { ascending: true })

      if (error) throw error

      console.log(`📊 Encontradas ${questions?.length || 0} questões para migração`)
      return questions || []

    } catch (error) {
      console.error('❌ Erro ao buscar questões:', error)
      return []
    }
  }

  async processQuestionsBatch(questions) {
    const processedQuestions = []

    for (const question of questions) {
      try {
        console.log(`🔄 Processando questão ${question.id}...`)

        // Criar texto combinado para embedding
        const embeddingText = `${question.question_text}\n${question.explanation || ''}`
        
        // Gerar embedding (se OpenAI disponível)
        let embedding = null
        if (openai) {
          embedding = await this.generateEmbedding(embeddingText)
          if (embedding) {
            this.stats.withEmbeddings++
            console.log(`   ✅ Embedding gerado (${embedding.length} dimensões)`)
          }
        }

        // Gerar hash semântico
        const semanticHash = this.generateSemanticHash(question)
        if (semanticHash) {
          this.stats.withHashOnly++
          console.log(`   🔑 Hash semântico: ${semanticHash}`)
        }

        // Extrair categorias
        const contentCategories = this.extractContentCategories(question.question_text)
        console.log(`   🏷️ Categorias: ${contentCategories.join(', ')}`)

        processedQuestions.push({
          id: question.id,
          embedding: embedding,
          semantic_hash: semanticHash,
          content_categories: contentCategories
        })

        this.stats.processed++

        // Delay entre requests para não sobrecarregar APIs
        if (openai && embedding) {
          await new Promise(resolve => setTimeout(resolve, this.delayBetweenRequests))
        }

      } catch (error) {
        console.error(`❌ Erro ao processar questão ${question.id}:`, error.message)
        this.stats.errors++
      }
    }

    return processedQuestions
  }

  async updateQuestionsInDatabase(processedQuestions) {
    const updates = []

    for (const question of processedQuestions) {
      try {
        const { error } = await supabase
          .from('questions')
          .update({
            embedding: question.embedding,
            semantic_hash: question.semantic_hash,
            content_categories: question.content_categories
          })
          .eq('id', question.id)

        if (error) {
          console.error(`❌ Erro ao atualizar questão ${question.id}:`, error.message)
          this.stats.errors++
        } else {
          updates.push(question.id)
          console.log(`   💾 Questão ${question.id} atualizada`)
        }

      } catch (error) {
        console.error(`❌ Erro ao salvar questão ${question.id}:`, error.message)
        this.stats.errors++
      }
    }

    return updates
  }

  async migrate() {
    const startTime = Date.now()
    console.log('🚀 Iniciando migração...\n')

    try {
      // Buscar questões para migração
      const questionsToMigrate = await this.getQuestionsToMigrate()
      this.stats.total = questionsToMigrate.length

      if (questionsToMigrate.length === 0) {
        console.log('✅ Nenhuma questão precisa ser migrada!')
        return
      }

      // Processar em lotes
      const batches = []
      for (let i = 0; i < questionsToMigrate.length; i += this.batchSize) {
        batches.push(questionsToMigrate.slice(i, i + this.batchSize))
      }

      console.log(`📦 Processando ${batches.length} lotes de ${this.batchSize} questões cada...\n`)

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i]
        console.log(`📦 Lote ${i + 1}/${batches.length} (${batch.length} questões)...`)

        // Processar questões do lote
        const processedQuestions = await this.processQuestionsBatch(batch)

        // Atualizar no banco
        const updatedIds = await this.updateQuestionsInDatabase(processedQuestions)
        
        console.log(`   ✅ Lote ${i + 1} concluído: ${updatedIds.length}/${batch.length} questões atualizadas\n`)

        // Pequena pausa entre lotes
        if (i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      }

    } catch (error) {
      console.error('❌ Erro durante migração:', error)
    }

    // Relatório final
    const endTime = Date.now()
    const duration = ((endTime - startTime) / 1000).toFixed(1)

    console.log('\n' + '='.repeat(60))
    console.log('📊 RELATÓRIO FINAL DA MIGRAÇÃO')
    console.log('='.repeat(60))
    console.log(`⏱️  Tempo total: ${duration}s`)
    console.log(`📝 Questões encontradas: ${this.stats.total}`)
    console.log(`✅ Questões processadas: ${this.stats.processed}`)
    console.log(`🔗 Com embeddings: ${this.stats.withEmbeddings}`)
    console.log(`🔑 Com hash semântico: ${this.stats.withHashOnly}`)
    console.log(`❌ Erros: ${this.stats.errors}`)
    console.log(`📊 Taxa de sucesso: ${((this.stats.processed / this.stats.total) * 100).toFixed(1)}%`)
    
    if (this.stats.withEmbeddings > 0) {
      const cost = (this.stats.withEmbeddings * 0.0001).toFixed(4)
      console.log(`💰 Custo estimado OpenAI: $${cost}`)
    }

    console.log('='.repeat(60))

    // Salvar relatório
    await this.saveReport(duration)
  }

  async saveReport(duration) {
    try {
      const report = {
        migrationDate: new Date().toISOString(),
        duration: `${duration}s`,
        stats: this.stats,
        config: {
          batchSize: this.batchSize,
          delayBetweenRequests: this.delayBetweenRequests,
          openaiEnabled: !!openai
        }
      }

      const reportPath = path.join(process.cwd(), 'migration_reports', `embedding_migration_${Date.now()}.json`)
      
      // Criar diretório se não existir
      await fs.mkdir(path.dirname(reportPath), { recursive: true })
      
      // Salvar relatório
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2))
      
      console.log(`📄 Relatório salvo em: ${reportPath}`)

    } catch (error) {
      console.error('⚠️ Erro ao salvar relatório:', error.message)
    }
  }
}

// Executar migração se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const migrator = new QuestionsEmbeddingsMigrator()
  
  migrator.migrate().then(() => {
    console.log('🎉 Migração concluída!')
    process.exit(0)
  }).catch(error => {
    console.error('💥 Falha na migração:', error)
    process.exit(1)
  })
}

export default QuestionsEmbeddingsMigrator