import { supabase } from '../lib/supabase'
import { generateQuestions } from './deepseekApi'

export class QuestionsService {
  static async getOrCreateQuestions(subjectId, sectionId, options = {}) {
    try {
      const { userId, questionType = 'auto', forceNew = false } = options
      
      // Opções de tipo de questão:
      // 'answered' - questões já respondidas pelo usuário
      // 'unanswered' - questões existentes não respondidas pelo usuário
      // 'new' - forçar criação de novas questões
      // 'auto' - comportamento padrão (tentar reutilizar, criar se necessário)
      
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

      // Por enquanto, usar o arquivo JSON estruturado local
      // Em produção, isso viria do campo content_file ou seria armazenado no banco
      const sectionContent = await this.loadSectionContentFromFile(sectionId)
      
      return {
        ...section,
        conteudo: sectionContent
      }

    } catch (error) {
      console.error('Error getting section content:', error)
      return null
    }
  }

  static async loadSectionContentFromFile(sectionId) {
    try {
      // Carregar o arquivo JSON estruturado real
      const response = await fetch('/direito_penal_estruturado.json')
      if (!response.ok) {
        throw new Error('Could not load structured content file')
      }
      
      const structuredContent = await response.json()
      
      // Encontrar a seção específica
      const section = structuredContent.secoes?.find(s => s.id === parseInt(sectionId))
      
      if (section) {
        return section
      } else {
        console.warn(`Section ${sectionId} not found in structured content, using mock`)
        return this.getMockSectionContent(sectionId)
      }
    } catch (error) {
      console.error('Error loading section content from file:', error)
      console.log('Falling back to mock content')
      return this.getMockSectionContent(sectionId)
    }
  }

  static getMockSectionContent(sectionId) {
    // Mock data baseado no arquivo direito_penal_estruturado.json
    // Em produção, isso seria carregado do arquivo ou banco de dados
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
      },
      2: {
        id: 2,
        titulo: "Falsificação de Papéis Públicos - Condutas Equiparadas",
        artigo: "Art. 293, §1º ao §5º",
        conteudo: {
          tipificacao: "Condutas equiparadas à falsificação de papéis públicos",
          condutas: [
            "usar, guardar, possuir ou deter papéis falsificados",
            "importar, exportar, adquirir, vender selo falsificado destinado a controle tributário",
            "utilizar produto com selo falsificado ou sem selo obrigatório"
          ],
          pena: "mesma pena do caput (reclusão, de dois a oito anos, e multa)",
          pontos_chave: [
            "Criminaliza não apenas a falsificação, mas toda a cadeia de circulação",
            "Pune mesmo quem recebeu de boa-fé, mas continuou usando após descobrir",
            "Penas diferenciadas conforme gravidade da conduta"
          ]
        }
      }
      // Adicionar mais seções conforme necessário
    }

    return mockSections[sectionId] || {
      titulo: `Seção ${sectionId}`,
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

  static async saveUserAnswer(userId, questionId, userAnswer, timeSpent = 0) {
    try {
      // Buscar a questão para verificar resposta correta
      const { data: question, error: questionError } = await supabase
        .from('questions')
        .select('correct_answer')
        .eq('id', questionId)
        .single()

      if (questionError) {
        throw questionError
      }

      const isCorrect = userAnswer === question.correct_answer

      // Verificar se já existe uma resposta para esta questão
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

      // Inserir nova resposta
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
      // Buscar stats atuais
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

      // Calcular mastery level (0-1)
      newStats.mastery_level = newStats.questions_correct / newStats.questions_answered

      if (currentStats) {
        // Atualizar stats existentes
        const { error } = await supabase
          .from('user_section_stats')
          .update(newStats)
          .eq('id', currentStats.id)

        if (error) throw error
      } else {
        // Criar novas stats
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

  static async generateNewQuestions(subjectId, sectionId) {
    try {
      // Buscar conteúdo da seção
      const sectionContent = await this.getSectionContent(sectionId)
      if (!sectionContent) {
        throw new Error('Section content not found')
      }

      // Gerar novas questões com IA
      console.log(`Generating new questions for section ${sectionId}...`)
      const generatedQuestions = await generateQuestions(sectionContent, 10)

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
      // Buscar questões que existem mas o usuário nunca respondeu
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('subject_id', subjectId)
        .eq('section_id', sectionId)
        .not('id', 'in', `(
          SELECT question_id 
          FROM user_answers 
          WHERE user_id = '${userId}'
        )`)
        .limit(limit)

      if (error) throw error

      console.log(`Found ${data.length} unanswered questions for user`)
      return {
        questions: data || [],
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
      // Estatísticas de questões disponíveis para o usuário
      const { data: totalQuestions } = await supabase
        .from('questions')
        .select('id', { count: 'exact' })
        .eq('subject_id', subjectId)
        .eq('section_id', sectionId)

      const { data: answeredQuestions } = await supabase
        .from('user_answers')
        .select('question_id', { count: 'exact' })
        .eq('user_id', userId)
        .in('question_id', `(
          SELECT id FROM questions 
          WHERE subject_id = ${subjectId} 
          AND section_id = ${sectionId}
        )`)

      const total = totalQuestions?.length || 0
      const answered = answeredQuestions?.length || 0
      const unanswered = total - answered

      return {
        total,
        answered,
        unanswered,
        canGenerateNew: true // sempre pode gerar novas
      }
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