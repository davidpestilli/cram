import { supabase } from '../lib/supabase'
import { generateQuestions } from './deepseekApi'
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

  static async saveQuestions(questions, subjectId, sectionId) {
    try {
      // Preparar dados para inserção
      const questionsToInsert = questions.map(q => ({
        subject_id: subjectId,
        section_id: sectionId,
        question_text: q.question_text,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        difficulty: q.difficulty || 3,
        source_text: q.source_text,
        modified_parts: q.modified_parts || [],
        created_by_ai: q.created_by_ai || 'deepseek'
      }))

      // Inserir no banco
      const { data, error } = await supabase
        .from('questions')
        .insert(questionsToInsert)
        .select()

      if (error) {
        throw error
      }

      console.log(`Saved ${data.length} questions to database`)
      return data

    } catch (error) {
      console.error('Error saving questions:', error)
      throw error
    }
  }

  static async generateNewQuestions(subjectId, sectionId) {
    try {
      // Buscar conteúdo da seção
      const sectionContent = await this.getSectionContent(sectionId)
      if (!sectionContent) {
        throw new Error('Section content not found')
      }

      // Gerar novas questões com IA
      console.log(`Generating new questions for section ${sectionId}...`)
      // Gerar apenas 1 questão por vez para melhor confiabilidade
      const generatedQuestions = await generateQuestions(sectionContent, 1)

      // Salvar questões no banco
      const savedQuestions = await this.saveQuestions(generatedQuestions, subjectId, sectionId)

      return {
        questions: savedQuestions,
        source: 'generated',
        created: true
      }
    } catch (error) {
      console.error('Error generating new questions:', error)
      throw error
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
      const { data, error } = await supabase
        .from('questions')
        .select(`
          *,
          user_answers!inner(
            user_answer,
            is_correct,
            answered_at
          )
        `)
        .eq('subject_id', subjectId)
        .eq('section_id', sectionId)
        .eq('user_answers.user_id', userId)
        .order('user_answers.answered_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      console.log(`Found ${data.length} answered questions for user`)
      return {
        questions: data || [],
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
      console.log('Getting unanswered questions for:', { userId, subjectId, sectionId })
      
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