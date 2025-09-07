import { supabase } from '../lib/supabase'
import { generateQuestions } from './deepseekApi'
import { generateQuestionsProgressively } from './directAIService'
import questionDeduplicationService from './questionDeduplicationService'
import direitoPenalEstruturado from '../data/direito_penal_estruturado.json'

console.log('🔄 QuestionsService carregado com import estático:', !!direitoPenalEstruturado)

export class QuestionsService {
  static async getOrCreateQuestions(subjectId, sectionId, options = {}) {
    try {
      const { userId, questionType = 'auto', forceNew = false } = options
      
      if (questionType === 'answered' && userId) {
        return await this.getAnsweredQuestions(userId, subjectId, sectionId)
      }
      
      if (questionType === 'unanswered' && userId) {
        return await this.getUnansweredQuestions(userId, subjectId, sectionId)
      }
      
      if (questionType === 'new' || forceNew) {
        return await this.generateNewQuestions(subjectId, sectionId)
      }
      
      // Comportamento automático (padrão)
      if (!forceNew) {
        const existingQuestions = await this.getExistingQuestions(subjectId, sectionId)
        if (existingQuestions.length > 0) {
          console.log(`Found ${existingQuestions.length} existing questions for section ${sectionId}`)
          return {
            questions: existingQuestions,
            source: 'database',
            created: false
          }
        }
      }

      // Fallback: gerar novas questões
      return await this.generateNewQuestions(subjectId, sectionId)

    } catch (error) {
      console.error('Error in getOrCreateQuestions:', error)
      throw error
    }
  }

  static async getExistingQuestions(subjectId, sectionId) {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('subject_id', subjectId)
      .eq('section_id', sectionId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching existing questions:', error)
      return []
    }

    return data || []
  }

  static async getSectionContent(sectionId) {
    try {
      // Buscar informações da seção no banco
      const { data: section, error: sectionError } = await supabase
        .from('sections')
        .select('*')
        .eq('id', sectionId)
        .single()

      if (sectionError) {
        throw sectionError
      }

      // Usar o conteúdo estruturado direto do import
      const fileContent = this.loadSectionContentFromFile(sectionId)
      
      return {
        ...section,
        ...fileContent  // Merge directly so titulo, artigo etc. are at root level
      }

    } catch (error) {
      console.error('Error getting section content:', error)
      return null
    }
  }

  static loadSectionContentFromFile(sectionId) {
    try {
      console.log(`📂 [NOVO] Carregando seção ${sectionId} via import direto...`)
      
      // USAR DIRETO O IMPORT - SEM ASYNC, SEM FETCH!
      if (!direitoPenalEstruturado || !direitoPenalEstruturado.secoes) {
        console.error('❌ Import falhou - dados não disponíveis')
        return this.getMockSectionContent(sectionId)
      }
      
      console.log(`✅ Import OK! ${direitoPenalEstruturado.secoes.length} seções carregadas`)
      
      // Encontrar a seção específica
      const section = direitoPenalEstruturado.secoes.find(s => s.id === parseInt(sectionId))
      
      if (section) {
        console.log(`✅ Seção ${sectionId} encontrada: "${section.titulo}"`)
        console.log(`📝 Artigo: ${section.artigo}`)
        return section
      } else {
        console.warn(`⚠️ Seção ${sectionId} não encontrada`)
        const availableSections = direitoPenalEstruturado.secoes.map(s => `${s.id}: ${s.titulo}`).join(', ')
        console.log(`📋 Seções disponíveis: ${availableSections}`)
        return this.getMockSectionContent(sectionId)
      }
    } catch (error) {
      console.error('❌ Erro ao carregar seção:', error)
      return this.getMockSectionContent(sectionId)
    }
  }

  static getMockSectionContent(sectionId) {
    // Mock data baseado no arquivo direito_penal_estruturado.json
    const mockSections = {
      1: {
        id: 1,
        titulo: "Falsificação de Papéis Públicos - Conceitos Básicos",
        artigo: "Art. 293",
        conteudo: {
          tipificacao: "Falsificar, fabricando-os ou alterando-os",
          objetos: [
            "selo destinado a controle tributário, papel selado ou qualquer papel de emissão legal destinado à arrecadação de tributo",
            "papel de crédito público que não seja moeda de curso legal",
            "vale postal",
            "cautela de penhor, caderneta de depósito de caixa econômica",
            "talão, recibo, guia, alvará ou qualquer outro documento relativo a arrecadação de rendas públicas",
            "bilhete, passe ou conhecimento de empresa de transporte administrada pela União, por Estado ou por Município"
          ],
          pena: "reclusão, de dois a oito anos, e multa",
          pontos_chave: [
            "Crime de falsificação documental específico para papéis públicos",
            "Duas modalidades: fabricação (criar do nada) e alteração (modificar existente)",
            "Objetos protegidos são específicos e taxativos",
            "Pena mais grave que falsificação de documento particular"
          ]
        }
      }
    }

    return mockSections[sectionId] || {
      id: parseInt(sectionId),
      titulo: `Seção ${sectionId}`,
      artigo: "Art. 293",
      conteudo: {
        tipificacao: "Conteúdo da seção não disponível",
        pena: "conforme legislação específica",
        pontos_chave: ["Conteúdo em desenvolvimento"]
      }
    }
  }

  static async saveQuestions(questions, subjectId, sectionId, sectionContent = {}) {
    try {
      console.log(`💾 Salvando ${questions.length} questões com sistema anti-repetição...`)
      
      // Processar questões com sistema anti-repetição
      const deduplicationResult = await questionDeduplicationService.processQuestionsWithAntiRepetition(
        questions,
        subjectId,
        sectionId,
        sectionContent
      )

      const processedQuestions = deduplicationResult.questions
      
      // Preparar dados para inserção com campos de embedding
      const questionsToInsert = processedQuestions.map(q => ({
        subject_id: subjectId,
        section_id: sectionId,
        question_text: q.question_text,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        difficulty: q.difficulty || 3,
        source_text: q.source_text,
        modified_parts: q.modified_parts || [],
        created_by_ai: q.created_by_ai || 'deepseek',
        // Novos campos de embeddings
        embedding: q.embedding || null,
        semantic_hash: q.semantic_hash || null,
        content_categories: q.content_categories || []
      }))

      // Inserir no banco
      const { data, error } = await supabase
        .from('questions')
        .insert(questionsToInsert)
        .select()

      if (error) {
        throw error
      }

      console.log(`✅ Salvas ${data.length} questões no banco com embeddings`)
      console.log(`📊 Estatísticas anti-repetição:`, deduplicationResult.stats)
      
      return {
        questions: data,
        deduplicationStats: deduplicationResult.stats
      }

    } catch (error) {
      console.error('❌ Erro ao salvar questões:', error)
      throw error
    }
  }

  static async generateNewQuestions(subjectId, sectionId, options = {}) {
    try {
      const { count = 5, onProgress = null } = options
      
      // Buscar conteúdo da seção
      const sectionContent = await this.getSectionContent(sectionId)
      if (!sectionContent) {
        throw new Error('Section content not found')
      }

      console.log(`🚀 Gerando ${count} novas questões para seção ${sectionId} com sistema 3F+2V...`)
      
      // Gerar questões com sistema progressivo (3F+2V)
      const generationResult = await generateQuestionsProgressively(sectionContent, count, onProgress)
      
      if (generationResult.questions.length === 0) {
        throw new Error('Nenhuma questão pôde ser gerada')
      }

      console.log(`📝 Geradas ${generationResult.questions.length}/${count} questões`)
      
      // Salvar questões no banco com sistema anti-repetição
      const saveResult = await this.saveQuestions(
        generationResult.questions, 
        subjectId, 
        sectionId, 
        sectionContent
      )

      return {
        questions: saveResult.questions || saveResult, // Compatibilidade com formato antigo
        source: 'generated_progressive',
        created: true,
        generationStats: {
          requested: count,
          generated: generationResult.questions.length,
          errors: generationResult.errors,
          successRate: (generationResult.questions.length / count * 100).toFixed(1) + '%'
        },
        deduplicationStats: saveResult.deduplicationStats,
        distribution: this.analyzeDistribution(saveResult.questions || saveResult)
      }
    } catch (error) {
      console.error('❌ Erro ao gerar novas questões:', error)
      throw error
    }
  }

  // Método auxiliar para analisar distribuição 3F+2V
  static analyzeDistribution(questions) {
    if (!Array.isArray(questions)) return { error: 'Invalid questions array' }
    
    const trueCount = questions.filter(q => q.correct_answer === true).length
    const falseCount = questions.filter(q => q.correct_answer === false).length
    
    return {
      total: questions.length,
      true_answers: trueCount,
      false_answers: falseCount,
      expected_distribution: '3F+2V',
      matches_expected: falseCount === 3 && trueCount === 2
    }
  }

  // Outros métodos mantidos iguais...
  static async saveUserAnswer(userId, questionId, userAnswer, timeSpent = 0) {
    try {
      const { data: question, error: questionError } = await supabase
        .from('questions')
        .select('correct_answer')
        .eq('id', questionId)
        .single()

      if (questionError) {
        throw questionError
      }

      const isCorrect = userAnswer === question.correct_answer
      const { data: existingAnswer } = await supabase
        .from('user_answers')
        .select('id, attempt_number')
        .eq('user_id', userId)
        .eq('question_id', questionId)
        .order('attempt_number', { ascending: false })
        .limit(1)

      const attemptNumber = existingAnswer && existingAnswer.length > 0 
        ? existingAnswer[0].attempt_number + 1 
        : 1

      const { data, error } = await supabase
        .from('user_answers')
        .insert({
          user_id: userId,
          question_id: questionId,
          user_answer: userAnswer,
          is_correct: isCorrect,
          time_spent: timeSpent,
          attempt_number: attemptNumber
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      return {
        ...data,
        is_correct: isCorrect
      }

    } catch (error) {
      console.error('Error saving user answer:', error)
      throw error
    }
  }

  static async updateUserStats(userId, subjectId, sectionId, isCorrect) {
    try {
      const { data: currentStats } = await supabase
        .from('user_section_stats')
        .select('*')
        .eq('user_id', userId)
        .eq('subject_id', subjectId)
        .eq('section_id', sectionId)
        .single()

      const newStats = {
        questions_answered: (currentStats?.questions_answered || 0) + 1,
        questions_correct: (currentStats?.questions_correct || 0) + (isCorrect ? 1 : 0),
        last_studied: new Date().toISOString()
      }

      newStats.mastery_level = newStats.questions_correct / newStats.questions_answered

      if (currentStats) {
        const { error } = await supabase
          .from('user_section_stats')
          .update(newStats)
          .eq('id', currentStats.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('user_section_stats')
          .insert({
            user_id: userId,
            subject_id: subjectId,
            section_id: sectionId,
            ...newStats
          })

        if (error) throw error
      }

      return newStats

    } catch (error) {
      console.error('Error updating user stats:', error)
      throw error
    }
  }

  static async getUserProgress(userId, subjectId, sectionId) {
    try {
      const { data, error } = await supabase
        .from('user_section_stats')
        .select('*')
        .eq('user_id', userId)
        .eq('subject_id', subjectId)
        .eq('section_id', sectionId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return data || {
        questions_answered: 0,
        questions_correct: 0,
        mastery_level: 0,
        last_studied: null
      }

    } catch (error) {
      console.error('Error getting user progress:', error)
      return {
        questions_answered: 0,
        questions_correct: 0,
        mastery_level: 0,
        last_studied: null
      }
    }
  }

  static async getAnsweredQuestions(userId, subjectId, sectionId, limit = 10) {
    try {
      // Primeiro buscar as respostas do usuário ordenadas
      const { data: userAnswers, error: answersError } = await supabase
        .from('user_answers')
        .select('question_id, user_answer, is_correct, answered_at')
        .eq('user_id', userId)
        .order('answered_at', { ascending: false })
        .limit(limit)

      if (answersError) throw answersError

      if (!userAnswers || userAnswers.length === 0) {
        return {
          questions: [],
          source: 'answered',
          created: false
        }
      }

      const questionIds = userAnswers.map(ua => ua.question_id)

      // Buscar as questões correspondentes
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('subject_id', subjectId)
        .eq('section_id', sectionId)
        .in('id', questionIds)

      if (questionsError) throw questionsError

      // Combinar questões com respostas do usuário na ordem correta
      const answeredQuestions = userAnswers.map(userAnswer => {
        const question = questions.find(q => q.id === userAnswer.question_id)
        return {
          ...question,
          user_answers: [userAnswer]
        }
      }).filter(q => q.id) // Remove questões não encontradas

      console.log(`Found ${answeredQuestions.length} answered questions for user`)
      return {
        questions: answeredQuestions,
        source: 'answered',
        created: false
      }
    } catch (error) {
      console.error('Error getting answered questions:', error)
      return {
        questions: [],
        source: 'answered',
        created: false
      }
    }
  }

  static async getUnansweredQuestions(userId, subjectId, sectionId, limit = 10) {
    try {
      const { data: allQuestions, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('subject_id', subjectId)
        .eq('section_id', sectionId)

      if (questionsError) throw questionsError

      if (!allQuestions || allQuestions.length === 0) {
        return {
          questions: [],
          source: 'unanswered',
          created: false
        }
      }

      const { data: answeredQuestions, error: answersError } = await supabase
        .from('user_answers')
        .select('question_id')
        .eq('user_id', userId)
        .in('question_id', allQuestions.map(q => q.id))

      const answeredIds = new Set(
        answersError ? [] : (answeredQuestions?.map(a => a.question_id) || [])
      )

      const unansweredQuestions = allQuestions
        .filter(q => !answeredIds.has(q.id))
        .slice(0, limit)

      console.log(`Found ${unansweredQuestions.length} unanswered questions for user`)
      return {
        questions: unansweredQuestions,
        source: 'unanswered',
        created: false
      }
    } catch (error) {
      console.error('Error getting unanswered questions:', error)
      return {
        questions: [],
        source: 'unanswered', 
        created: false
      }
    }
  }

  static async getQuestionStats(userId, subjectId, sectionId) {
    try {
      console.log('Getting question stats for:', { userId, subjectId, sectionId })
      
      const { data: allQuestions, error: questionsError } = await supabase
        .from('questions')
        .select('id')
        .eq('subject_id', subjectId)
        .eq('section_id', sectionId)

      if (questionsError) {
        console.error('Error fetching questions:', questionsError)
        throw questionsError
      }

      const total = allQuestions?.length || 0
      const questionIds = allQuestions?.map(q => q.id) || []
      
      let answered = 0
      if (total > 0 && questionIds.length > 0) {
        const { data: userAnswers, error: answersError } = await supabase
          .from('user_answers')
          .select('question_id')
          .eq('user_id', userId)
          .in('question_id', questionIds)

        if (answersError) {
          console.error('Error fetching user answers:', answersError)
        } else {
          const uniqueAnsweredQuestions = new Set(userAnswers?.map(a => a.question_id) || [])
          answered = uniqueAnsweredQuestions.size
        }
      }

      const unanswered = total - answered
      
      const stats = {
        total,
        answered,
        unanswered,
        canGenerateNew: true
      }

      console.log('Question stats calculated:', stats)
      return stats

    } catch (error) {
      console.error('Error getting question stats:', error)
      return {
        total: 0,
        answered: 0,
        unanswered: 0,
        canGenerateNew: true
      }
    }
  }
}

export default QuestionsService