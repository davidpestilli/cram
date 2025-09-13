import { supabase } from '../lib/supabase'
import { generateQuestions } from './deepseekApi'
import { generateQuestionsProgressively, resetGlobalQuestionCounter } from './directAIService'
import questionDeduplicationService from './questionDeduplicationService'
import direitoPenalEstruturado from '../data/direito_penal_estruturado.json'
import matematicaEstruturada from '../data/matematica_subsections.json'
import SubsectionDistributionService from './subsectionDistributionService'

console.log('🔄 QuestionsService carregado com import estático:', !!direitoPenalEstruturado)

// Controle de execução simultânea
const generationLocks = new Map()

export class QuestionsService {
  static async getOrCreateQuestions(subjectId, sectionId, options = {}) {
    try {
      const { userId, questionType = 'auto', forceNew = false } = options
      
      // Controle anti-concorrência
      const lockKey = `${subjectId}-${sectionId}-${questionType}`
      if (generationLocks.has(lockKey)) {
        console.log(`🔒 Geração já em andamento para ${lockKey}, aguardando...`)
        return await generationLocks.get(lockKey)
      }
      
      if (questionType === 'answered' && userId) {
        return await this.getAnsweredQuestions(userId, subjectId, sectionId)
      }
      
      if (questionType === 'unanswered' && userId) {
        return await this.getUnansweredQuestions(userId, subjectId, sectionId)
      }
      
      // Criar promise para controle de concorrência
      const generationPromise = this.executeGeneration(subjectId, sectionId, options)
      generationLocks.set(lockKey, generationPromise)
      
      try {
        const result = await generationPromise
        return result
      } finally {
        generationLocks.delete(lockKey)
      }

    } catch (error) {
      console.error('Error in getOrCreateQuestions:', error)
      throw error
    }
  }

  static async executeGeneration(subjectId, sectionId, options = {}) {
    const { userId, questionType = 'auto', forceNew = false, onProgress } = options

    if (questionType === 'new' || forceNew) {
      return await this.generateBalancedQuestions(subjectId, sectionId, 10, onProgress)
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

    // Fallback: geração equilibrada
    return await this.generateBalancedQuestions(subjectId, sectionId, 10)
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
      
      // Determinar qual fonte de dados usar baseado no sectionId
      let dataSource, sectionsArray
      
      if (sectionId >= 14 && sectionId <= 26) {
        // IDs 14-26: Matemática
        dataSource = matematicaEstruturada
        sectionsArray = matematicaEstruturada?.sections
        console.log(`📚 Carregando da fonte: Matemática`)
      } else {
        // IDs 1-13: Direito Penal  
        dataSource = direitoPenalEstruturado
        sectionsArray = direitoPenalEstruturado?.secoes
        console.log(`⚖️ Carregando da fonte: Direito Penal`)
      }
      
      if (!dataSource || !sectionsArray) {
        console.error('❌ Import falhou - dados não disponíveis')
        return this.getMockSectionContent(sectionId)
      }
      
      console.log(`✅ Import OK! ${sectionsArray.length} seções carregadas`)
      
      // Encontrar a seção específica
      let searchId = parseInt(sectionId)
      
      // Para Matemática, ajustar o ID: banco (14-26) → JSON (1-13)
      if (sectionId >= 14 && sectionId <= 26) {
        searchId = sectionId - 13
        console.log(`🔄 Mapeando ID do banco ${sectionId} → JSON ${searchId}`)
      }
      
      const section = sectionsArray.find(s => s.id === searchId)
      
      if (section) {
        console.log(`✅ Seção ${sectionId} encontrada: "${section.titulo}"`)
        
        // Para Direito Penal, mostrar artigo; para Matemática, mostrar fonte
        if (section.artigo) {
          console.log(`📝 Artigo: ${section.artigo}`)
        } else if (dataSource.fonte) {
          console.log(`📚 Fonte: ${dataSource.fonte}`)
        }
        
        return section
      } else {
        console.warn(`⚠️ Seção ${sectionId} não encontrada`)
        const availableSections = sectionsArray.map(s => `${s.id}: ${s.titulo}`).join(', ')
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
        content_categories: q.content_categories || [],
        // Campo de subseção para distribuição equilibrada
        subsection_id: q.subsection_id || null
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
    const lockKey = `${subjectId}-${sectionId}`
    
    // Verificar se já existe uma geração em andamento
    if (generationLocks.has(lockKey)) {
      console.log(`⏸️ Geração já em andamento para seção ${sectionId}, aguardando conclusão...`)
      return await generationLocks.get(lockKey)
    }

    // Criar promise e adicionar ao lock
    const generationPromise = this._executeGeneration(subjectId, sectionId, options)
    generationLocks.set(lockKey, generationPromise)
    
    try {
      const result = await generationPromise
      return result
    } finally {
      // Sempre remover o lock ao finalizar
      generationLocks.delete(lockKey)
    }
  }

  static async _executeGeneration(subjectId, sectionId, options = {}) {
    try {
      const { count = 5, onProgress = null } = options
      
      // Buscar conteúdo da seção
      const sectionContent = await this.getSectionContent(sectionId)
      if (!sectionContent) {
        throw new Error('Section content not found')
      }

      console.log(`🚀 Gerando ${count} novas questões para seção ${sectionId} com sistema 3F+2V...`)
      
      // Gerar questões com sistema progressivo inteligente (3F+2V + análise semântica)
      const generationResult = await generateQuestionsProgressively(sectionContent, count, onProgress, subjectId, sectionId)
      
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

  // =====================================================
  // MÉTODOS PARA DISTRIBUIÇÃO EQUILIBRADA POR SUBSEÇÕES
  // =====================================================

  /**
   * Gerar questões usando distribuição equilibrada por subseções
   * @param {number} subjectId - ID da matéria
   * @param {number} sectionId - ID da seção
   * @param {number} totalQuestions - Total de questões a gerar
   * @returns {Promise<Object>} Resultado da geração equilibrada
   */
  static async generateBalancedQuestions(subjectId, sectionId, totalQuestions = 10, onProgress = null) {
    try {
      console.log(`🎯 Iniciando geração equilibrada: ${totalQuestions} questões para seção ${sectionId}`)

      // Controle anti-concorrência específico para geração equilibrada
      const balancedLockKey = `balanced-${subjectId}-${sectionId}-${totalQuestions}`
      if (generationLocks.has(balancedLockKey)) {
        console.log(`🔒 Geração equilibrada já em andamento para seção ${sectionId}, aguardando...`)
        return await generationLocks.get(balancedLockKey)
      }

      const balancedPromise = this.executeBalancedGeneration(subjectId, sectionId, totalQuestions, onProgress)
      generationLocks.set(balancedLockKey, balancedPromise)
      
      try {
        const result = await balancedPromise
        return result
      } finally {
        generationLocks.delete(balancedLockKey)
      }

    } catch (error) {
      console.error('❌ Erro na geração equilibrada:', error)
      throw error
    }
  }

  static async executeBalancedGeneration(subjectId, sectionId, totalQuestions = 10, onProgress = null) {
    // Resetar contador global para manter distribuição 3F+2V e 3P+2T correta
    resetGlobalQuestionCounter()
    
    // Obter plano de distribuição com geração contínua permitida
    const generationPlan = await SubsectionDistributionService.planQuestionGeneration(
      sectionId, 
      totalQuestions, 
      true // allowContinuous = true
    )
    
    if (generationPlan.length === 0) {
      console.log('✅ Nenhuma subseção encontrada para geração')
      return {
        questions: [],
        source: 'balanced_generation',
        created: false,
        message: 'Nenhuma subseção disponível para geração'
      }
    }

    console.log(`📋 Plano de geração:`, generationPlan.map(p => 
      `${p.titulo}: ${p.questionsToGenerate} questões`
    ).join(', '))

    // Gerar questões para cada subseção no plano
    const allGeneratedQuestions = []
    const generationResults = []

    for (let i = 0; i < generationPlan.length; i++) {
      const subsectionPlan = generationPlan[i]
      console.log(`🎯 Gerando ${subsectionPlan.questionsToGenerate} questões para: ${subsectionPlan.titulo}`)
      
      try {
        const subsectionQuestions = await this.generateQuestionsForSubsection(
          subjectId, 
          sectionId, 
          subsectionPlan, 
          subsectionPlan.questionsToGenerate
        )

        if (subsectionQuestions && subsectionQuestions.length > 0) {
          allGeneratedQuestions.push(...subsectionQuestions)
          
          // Callback de progresso
          if (onProgress) {
            onProgress(allGeneratedQuestions.length, totalQuestions)
          }
          
          generationResults.push({
            subsectionId: subsectionPlan.subsectionId,
            titulo: subsectionPlan.titulo,
            requested: subsectionPlan.questionsToGenerate,
            generated: subsectionQuestions.length
          })
        }
      } catch (subsectionError) {
        console.error(`❌ Erro gerando questões para ${subsectionPlan.titulo}:`, subsectionError)
        generationResults.push({
          subsectionId: subsectionPlan.subsectionId,
          titulo: subsectionPlan.titulo,
          requested: subsectionPlan.questionsToGenerate,
          generated: 0,
          error: subsectionError.message
        })
      }
    }

    console.log(`✅ Geração equilibrada concluída: ${allGeneratedQuestions.length} questões geradas`)
    console.log(`📊 Resultados por subseção:`, generationResults)

    return {
      questions: allGeneratedQuestions,
      source: 'balanced_generation',
      created: true,
      generationPlan,
      results: generationResults,
      totalGenerated: allGeneratedQuestions.length
    }
  }

  /**
   * Gerar questões específicas para uma subseção
   * @param {number} subjectId - ID da matéria
   * @param {number} sectionId - ID da seção
   * @param {Object} subsectionPlan - Dados da subseção
   * @param {number} questionsCount - Quantidade a gerar
   * @returns {Promise<Array>} Lista de questões geradas
   */
  static async generateQuestionsForSubsection(subjectId, sectionId, subsectionPlan, questionsCount) {
    try {
      // Buscar conteúdo da seção
      const sectionContent = await this.getSectionContent(sectionId)
      if (!sectionContent) {
        throw new Error(`Conteúdo da seção ${sectionId} não encontrado`)
      }

      // Criar prompt específico para a subseção
      const subsectionPrompt = this.buildSubsectionPrompt(subsectionPlan, sectionContent, questionsCount)

      // Gerar questões usando o serviço de IA
      const generatedResult = await generateQuestionsProgressively({
        sectionContent: {
          ...sectionContent,
          // Focar no conteúdo específico da subseção
          foco_subsecao: {
            titulo: subsectionPlan.titulo,
            conteudo: subsectionPlan.conteudo,
            tipo: subsectionPlan.tipo
          }
        },
        customPrompt: subsectionPrompt,
        targetCount: questionsCount,
        subjectId,
        sectionId
      })

      // Extrair questões do resultado
      const generatedQuestions = generatedResult?.questions || []
      
      if (generatedQuestions.length === 0) {
        console.warn(`⚠️ Nenhuma questão gerada para subseção: ${subsectionPlan.titulo}`)
        return []
      }

      // Marcar questões com subsection_id
      const questionsWithSubsection = generatedQuestions.map(question => ({
        ...question,
        subsection_id: subsectionPlan.subsectionId
      }))

      // Salvar questões no banco
      await this.saveQuestions(questionsWithSubsection, subjectId, sectionId, sectionContent)

      console.log(`✅ ${questionsWithSubsection.length} questões geradas para subseção: ${subsectionPlan.titulo}`)
      
      return questionsWithSubsection

    } catch (error) {
      console.error(`❌ Erro gerando questões para subseção ${subsectionPlan.titulo}:`, error)
      throw error
    }
  }

  /**
   * Construir prompt específico para uma subseção
   * @param {Object} subsectionPlan - Dados da subseção
   * @param {Object} sectionContent - Conteúdo completo da seção
   * @param {number} questionsCount - Quantidade a gerar
   * @returns {string} Prompt personalizado
   */
  static buildSubsectionPrompt(subsectionPlan, sectionContent, questionsCount) {
    const baseInfo = `
Seção: ${sectionContent.titulo}
Artigo: ${sectionContent.artigo}
Foco específico: ${subsectionPlan.titulo}
Conteúdo específico: ${subsectionPlan.conteudo}
Tipo de conteúdo: ${subsectionPlan.tipo}
`

    let specificInstructions = ''

    switch (subsectionPlan.tipo) {
      case 'conceito_base':
        specificInstructions = `
FOQUE EM: Conceitos fundamentais e definições.
- Teste entendimento de tipificação e elementos do crime
- Explore modalidades de conduta (fabricar vs alterar)
- Questione sobre requisitos legais básicos
`
        break

      case 'objeto_crime':
        // Expandir contexto para objetos com conteúdo simples
        const expandedContext = this.expandObjectContext(subsectionPlan.conteudo, sectionContent)
        specificInstructions = `
FOQUE EM: Objetos protegidos pela lei - ${subsectionPlan.titulo}
- Teste identificação específica e diferenciação deste objeto
- Explore características legais que tornam este objeto protegido
- Questione sobre diferenças em relação a outros documentos/objetos
- ${expandedContext}
`
        break

      case 'consequencia':
        specificInstructions = `
FOQUE EM: Penalidades e consequências jurídicas.
- Teste conhecimento das penas aplicáveis
- Explore regime de cumprimento e dosimetria
- Questione sobre agravantes e atenuantes
`
        break

      case 'conduta_equiparada':
        specificInstructions = `
FOQUE EM: Condutas equiparadas ao crime principal.
- Teste entendimento das condutas específicas: ${subsectionPlan.conteudo}
- Explore diferenças de pena entre condutas
- Questione sobre elementos distintivos
`
        break

      case 'conduta_especifica':
        specificInstructions = `
FOQUE EM: Conduta específica e seus requisitos.
- Teste elementos específicos da conduta: ${subsectionPlan.conteudo}
- Explore requisitos subjetivos e objetivos
- Questione sobre situações limite
`
        break

      case 'crime_preparatorio':
        specificInstructions = `
FOQUE EM: Atos preparatórios e sua punição.
- Teste entendimento de perigo abstrato
- Explore diferença entre preparação e tentativa
- Questione sobre objetos especialmente destinados
`
        break

      case 'agravante':
        specificInstructions = `
FOQUE EM: Circunstâncias agravantes.
- Teste aplicação da agravante: ${subsectionPlan.conteudo}
- Explore requisitos para caracterização
- Questione sobre cálculo de aumento de pena
`
        break

      default:
        specificInstructions = `
FOQUE EM: ${subsectionPlan.titulo}
- Explore o conteúdo: ${subsectionPlan.conteudo}
- Teste compreensão específica deste aspecto
`
    }

    return `${baseInfo}

${specificInstructions}

INSTRUÇÕES ESPECÍFICAS:
- Gere EXATAMENTE ${questionsCount} questão(ões) focada(s) ESPECIFICAMENTE em: ${subsectionPlan.titulo}
- Todas as questões devem ser VERDADEIRO/FALSO
- VARIE os aspectos dentro desta subseção específica
- EVITE repetir conceitos óbvios ou genéricos
- Teste conhecimento ESPECÍFICO e DIFERENCIADO deste aspecto
- Contextualize dentro do artigo ${sectionContent.artigo} do Código Penal
`
  }

  /**
   * Expandir contexto para objetos com conteúdo muito simples
   * @param {string} content - Conteúdo da subseção
   * @param {Object} sectionContent - Conteúdo completo da seção
   * @returns {string} Contexto expandido
   */
  static expandObjectContext(content, sectionContent) {
    // Se o conteúdo é muito simples (poucas palavras), expandir contexto
    const wordCount = content.trim().split(/\s+/).length
    
    if (wordCount <= 3) {
      // Contexto expandido para objetos simples
      const contextualHints = {
        'vale postal': 'Explore aspectos específicos: quem emite, finalidade, diferença de outros valores, âmbito de proteção',
        'papel selado': 'Foque em: diferença de outros papéis, função tributária, forma de identificação',
        'selo': 'Aborde: função específica, órgão emissor, diferenciação de outros selos',
        'documento': 'Teste: caracterização específica, diferença de outros documentos, elementos essenciais'
      }
      
      // Buscar por palavras-chave no conteúdo
      for (const [keyword, hint] of Object.entries(contextualHints)) {
        if (content.toLowerCase().includes(keyword)) {
          return `CONTEXTO ESPECÍFICO: ${hint}`
        }
      }
      
      // Contexto genérico para objetos simples
      return 'CONTEXTO: Teste elementos distintivos, características específicas e âmbito de proteção legal'
    }
    
    // Para conteúdo mais detalhado, usar o próprio conteúdo
    return `CONTEXTO: Baseie-se nos elementos específicos: ${content}`
  }

  /**
   * Obter relatório de distribuição atual de uma seção
   * @param {number} sectionId - ID da seção
   * @returns {Promise<Object>} Relatório detalhado da distribuição
   */
  static async getDistributionReport(sectionId) {
    try {
      const summary = await SubsectionDistributionService.getDistributionSummary(sectionId)
      
      return {
        ...summary,
        recommendations: this.generateRecommendations(summary)
      }
    } catch (error) {
      console.error('Erro ao gerar relatório de distribuição:', error)
      throw error
    }
  }

  /**
   * Gerar recomendações baseadas na distribuição atual
   * @param {Object} summary - Resumo da distribuição
   * @returns {Array} Lista de recomendações
   */
  static generateRecommendations(summary) {
    const recommendations = []

    if (summary.totalDeficit > 0) {
      recommendations.push({
        type: 'generate',
        priority: 'high',
        message: `Gerar ${summary.totalDeficit} questões para equilibrar a seção`,
        action: 'generateBalancedQuestions',
        params: { questionsCount: summary.totalDeficit }
      })
    }

    if (summary.balancePercentage < 70) {
      recommendations.push({
        type: 'rebalance',
        priority: 'medium',
        message: 'Distribuição muito desequilibrada (< 70%)',
        action: 'reviewDistribution'
      })
    }

    if (summary.mostOverrepresented && summary.mostOverrepresented.deviationFromTarget > 3) {
      recommendations.push({
        type: 'reduce',
        priority: 'low',
        message: `Subseção "${summary.mostOverrepresented.titulo}" está sobre-representada`,
        action: 'considerRemoval',
        subsection: summary.mostOverrepresented.subsectionId
      })
    }

    return recommendations
  }
}

export default QuestionsService