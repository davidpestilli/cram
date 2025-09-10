import embeddingsService from './embeddingsService'
import { supabase } from '../lib/supabase'
import { generateSingleQuestion } from './directAIService'

const MAX_REGENERATION_ATTEMPTS = parseInt(import.meta.env.MAX_REGENERATION_ATTEMPTS) || 3
const SIMILARITY_THRESHOLD = parseFloat(import.meta.env.SIMILARITY_THRESHOLD) || 0.75

class QuestionDeduplicationService {
  constructor() {
    this.embeddingsEnabled = embeddingsService.isEnabled()
    console.log(`🔄 QuestionDeduplicationService inicializado. Embeddings: ${this.embeddingsEnabled ? '✅' : '❌'}`)
  }

  async getExistingQuestions(subjectId, sectionId, limit = 100) {
    try {
      const { data: questions, error } = await supabase
        .from('questions')
        .select('id, question_text, correct_answer, explanation, source_text, embedding, semantic_hash, content_categories, created_at')
        .eq('subject_id', subjectId)
        .eq('section_id', sectionId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('❌ Erro ao buscar questões existentes:', error)
        return []
      }

      console.log(`📚 Carregadas ${questions?.length || 0} questões existentes para comparação`)
      return questions || []

    } catch (error) {
      console.error('❌ Erro ao carregar questões:', error)
      return []
    }
  }

  async checkForSimilarQuestions(questionData, subjectId, sectionId, sectionContent = {}) {
    try {
      console.log(`🔍 Verificando similaridade para questão: "${questionData.question_text?.substring(0, 50)}..."`)
      
      // Buscar questões existentes
      const existingQuestions = await this.getExistingQuestions(subjectId, sectionId)
      
      if (existingQuestions.length === 0) {
        console.log('✅ Nenhuma questão existente para comparar')
        return {
          hasSimilar: false,
          mostSimilar: null,
          processedQuestion: await embeddingsService.processQuestionForEmbedding(questionData, sectionContent),
          method: 'no_existing_questions'
        }
      }

      // Verificar similaridade usando embeddings service
      const similarityResult = await embeddingsService.checkForSimilarQuestions(
        questionData,
        existingQuestions,
        sectionContent
      )

      const logLevel = similarityResult.hasSimilar ? 'warn' : 'info'
      console.log(`${similarityResult.hasSimilar ? '⚠️' : '✅'} Verificação concluída:`, {
        hasSimilar: similarityResult.hasSimilar,
        method: this.embeddingsEnabled ? 'embeddings' : 'semantic_hash',
        mostSimilarId: similarityResult.mostSimilar?.question?.id,
        similarity: similarityResult.mostSimilar?.similarity
      })

      return {
        ...similarityResult,
        method: this.embeddingsEnabled ? 'embeddings' : 'semantic_hash',
        existingCount: existingQuestions.length
      }

    } catch (error) {
      console.error('❌ Erro ao verificar questões similares:', error)
      
      // Fallback seguro
      return {
        hasSimilar: false,
        mostSimilar: null,
        processedQuestion: questionData,
        method: 'error_fallback',
        error: error.message
      }
    }
  }

  async findDuplicates(embedding, subjectId, sectionId, threshold = SIMILARITY_THRESHOLD) {
    if (!this.embeddingsEnabled || !embedding) {
      console.log('⚠️ Busca por duplicatas via embedding indisponível')
      return []
    }

    try {
      // Usar função RPC do Supabase para busca vetorial
      const { data: similarQuestions, error } = await supabase
        .rpc('find_similar_questions', {
          query_embedding: embedding,
          similarity_threshold: threshold,
          match_count: 10,
          filter_subject_id: subjectId,
          filter_section_id: sectionId
        })

      if (error) {
        console.error('❌ Erro na busca RPC por similares:', error)
        return []
      }

      console.log(`🔍 Busca vetorial encontrou ${similarQuestions?.length || 0} questões similares`)
      
      if (similarQuestions?.length > 0) {
        console.log('📊 Top duplicatas:', similarQuestions.slice(0, 3).map(q => ({
          id: q.id,
          similarity: q.similarity?.toFixed(3),
          text: q.question_text?.substring(0, 50) + '...'
        })))
      }

      return similarQuestions || []

    } catch (error) {
      console.error('❌ Erro ao buscar duplicatas:', error)
      return []
    }
  }

  async regenerateIfSimilar(questionData, subjectId, sectionId, sectionContent, attemptCount = 0) {
    if (attemptCount >= MAX_REGENERATION_ATTEMPTS) {
      console.warn(`⚠️ Máximo de tentativas atingido (${MAX_REGENERATION_ATTEMPTS}). Retornando questão mesmo com similaridade.`)
      return {
        success: false,
        question: questionData,
        attempts: attemptCount,
        reason: 'max_attempts_reached',
        finalSimilarity: null
      }
    }

    try {
      console.log(`🔄 Tentativa ${attemptCount + 1}/${MAX_REGENERATION_ATTEMPTS} - Verificando questão...`)
      
      // Verificar similaridade da questão atual
      const similarityCheck = await this.checkForSimilarQuestions(
        questionData,
        subjectId,
        sectionId,
        sectionContent
      )

      // Se não há similaridade, retornar sucesso
      if (!similarityCheck.hasSimilar) {
        console.log(`✅ Questão aprovada na tentativa ${attemptCount + 1}`)
        return {
          success: true,
          question: similarityCheck.processedQuestion,
          attempts: attemptCount + 1,
          reason: 'similarity_check_passed',
          finalSimilarity: null
        }
      }

      // Se há similaridade, tentar regenerar
      console.log(`🔄 Similaridade detectada (${similarityCheck.mostSimilar?.similarity?.toFixed(3)}). Regenerando...`)
      
      // Regenerar questão com prompt modificado para evitar repetição
      const newQuestionData = await this.regenerateQuestion(
        sectionContent,
        questionData.id,
        attemptCount,
        similarityCheck.mostSimilar
      )

      // Recursão para verificar a nova questão
      return await this.regenerateIfSimilar(
        newQuestionData,
        subjectId,
        sectionId,
        sectionContent,
        attemptCount + 1
      )

    } catch (error) {
      console.error(`❌ Erro na tentativa ${attemptCount + 1}:`, error)
      
      return {
        success: false,
        question: questionData,
        attempts: attemptCount + 1,
        reason: 'regeneration_error',
        error: error.message
      }
    }
  }

  async regenerateQuestion(sectionContent, questionId, attemptCount, similarQuestion = null) {
    try {
      console.log(`🎯 Regenerando questão ${questionId} (tentativa ${attemptCount + 1})...`)
      
      // Criar prompt com instruções específicas para evitar repetição
      const avoidanceInstructions = this.createAvoidanceInstructions(similarQuestion, attemptCount)
      
      // Usar o mesmo sistema de geração progressiva, mas com instruções especiais
      const modifiedSectionContent = {
        ...sectionContent,
        avoidanceInstructions: avoidanceInstructions,
        regenerationAttempt: attemptCount + 1
      }

      // Regenerar usando o sistema existente
      const newQuestion = await generateSingleQuestion(modifiedSectionContent, questionId)
      
      console.log(`🔄 Nova questão gerada: "${newQuestion.question_text?.substring(0, 50)}..."`)
      
      return newQuestion

    } catch (error) {
      console.error('❌ Erro ao regenerar questão:', error)
      throw error
    }
  }

  createAvoidanceInstructions(similarQuestion, attemptCount) {
    const instructions = []
    
    if (similarQuestion) {
      instructions.push(`EVITE questões similares a: "${similarQuestion.question?.question_text?.substring(0, 100)}..."`)
      
      if (similarQuestion.question?.content_categories) {
        const categories = similarQuestion.question.content_categories.join(', ')
        instructions.push(`Já existe questão com categorias: ${categories}`)
      }
    }

    // Adicionar variações baseadas na tentativa
    switch (attemptCount) {
      case 0:
        instructions.push('Use uma abordagem diferente no foco da questão')
        break
      case 1:
        instructions.push('Mude completamente o aspecto jurídico testado (pena → tipificação, objeto → sujeito, etc.)')
        break
      case 2:
        instructions.push('Use um formato de pergunta completamente diferente e ângulo único')
        break
      default:
        instructions.push('Seja o mais criativo e único possível, explorando aspectos menos óbvios')
    }

    return instructions.join('\n')
  }

  async processQuestionsWithAntiRepetition(questions, subjectId, sectionId, sectionContent = {}) {
    const processedQuestions = []
    const regenerationStats = {
      totalProcessed: 0,
      regenerated: 0,
      failures: 0,
      attempts: []
    }

    console.log(`🔄 Processando ${questions.length} questões com sistema anti-repetição...`)

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i]
      regenerationStats.totalProcessed++

      try {
        console.log(`\n📝 Processando questão ${i + 1}/${questions.length}...`)
        
        const regenerationResult = await this.regenerateIfSimilar(
          question,
          subjectId,
          sectionId,
          sectionContent
        )

        if (regenerationResult.success) {
          processedQuestions.push(regenerationResult.question)
          
          if (regenerationResult.attempts > 1) {
            regenerationStats.regenerated++
          }
        } else {
          console.warn(`⚠️ Questão ${i + 1} não pôde ser otimizada:`, regenerationResult.reason)
          processedQuestions.push(regenerationResult.question)
          regenerationStats.failures++
        }

        regenerationStats.attempts.push(regenerationResult.attempts)

      } catch (error) {
        console.error(`❌ Erro ao processar questão ${i + 1}:`, error)
        processedQuestions.push(question) // Manter questão original em caso de erro
        regenerationStats.failures++
      }
    }

    // Relatório final
    const avgAttempts = regenerationStats.attempts.reduce((a, b) => a + b, 0) / regenerationStats.attempts.length
    
    console.log('\n📊 Relatório do sistema anti-repetição:')
    console.log(`   Total processadas: ${regenerationStats.totalProcessed}`)
    console.log(`   Regeneradas: ${regenerationStats.regenerated}`)
    console.log(`   Falhas: ${regenerationStats.failures}`)
    console.log(`   Tentativas médias: ${avgAttempts.toFixed(1)}`)
    console.log(`   Taxa de sucesso: ${((regenerationStats.totalProcessed - regenerationStats.failures) / regenerationStats.totalProcessed * 100).toFixed(1)}%`)

    return {
      questions: processedQuestions,
      stats: regenerationStats
    }
  }

  async getDeduplicationStats(subjectId, sectionId) {
    try {
      const { data: stats, error } = await supabase
        .rpc('get_embeddings_stats')

      if (error) {
        console.error('❌ Erro ao buscar estatísticas:', error)
        return null
      }

      const existingQuestions = await this.getExistingQuestions(subjectId, sectionId)
      
      return {
        global: stats?.[0] || {},
        section: {
          total_questions: existingQuestions.length,
          questions_with_embeddings: existingQuestions.filter(q => q.embedding).length,
          questions_with_hash: existingQuestions.filter(q => q.semantic_hash).length,
          unique_categories: [...new Set(existingQuestions.flatMap(q => q.content_categories || []))].length
        },
        service: {
          embeddings_enabled: this.embeddingsEnabled,
          similarity_threshold: SIMILARITY_THRESHOLD,
          max_regeneration_attempts: MAX_REGENERATION_ATTEMPTS
        }
      }

    } catch (error) {
      console.error('❌ Erro ao calcular estatísticas:', error)
      return null
    }
  }
}

export default new QuestionDeduplicationService()