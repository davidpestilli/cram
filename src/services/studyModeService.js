import { supabase } from '../lib/supabase'

// Study mode types
export const STUDY_MODES = {
  NORMAL: 'normal',
  REVISION: 'revision', // Only incorrect questions
  CHALLENGE: 'challenge', // Mix of sections
  SIMULATION: 'simulation', // Timed mode
  COLLABORATIVE: 'collaborative' // Community questions
}

class StudyModeService {
  
  // Get questions for revision mode (only incorrect answers)
  async getRevisionQuestions(userId, sectionId = null, limit = 10) {
    try {
      let query = supabase
        .from('user_answers')
        .select(`
          question_id,
          questions!inner(*)
        `)
        .eq('user_id', userId)
        .eq('is_correct', false)
        .limit(limit)

      if (sectionId) {
        query = query.eq('questions.section_id', sectionId)
      }

      const { data, error } = await query

      if (error) throw error

      return data.map(item => ({
        ...item.questions,
        lastAnswered: item.created_at,
        timesIncorrect: 1 // Could be enhanced to count
      }))

    } catch (error) {
      console.error('Error fetching revision questions:', error)
      return []
    }
  }

  // Get questions for challenge mode (mix of sections)
  async getChallengeQuestions(userId, difficulty = 'mixed', limit = 10) {
    try {
      // Get user's weakest sections first
      const { data: stats } = await supabase
        .from('user_answers')
        .select(`
          questions!inner(section_id),
          is_correct
        `)
        .eq('user_id', userId)

      // Calculate accuracy per section
      const sectionStats = {}
      stats?.forEach(answer => {
        const sectionId = answer.questions.section_id
        if (!sectionStats[sectionId]) {
          sectionStats[sectionId] = { total: 0, correct: 0 }
        }
        sectionStats[sectionId].total++
        if (answer.is_correct) sectionStats[sectionId].correct++
      })

      // Sort sections by accuracy (worst first for challenge)
      const weakSections = Object.entries(sectionStats)
        .map(([sectionId, stats]) => ({
          sectionId,
          accuracy: stats.correct / stats.total
        }))
        .sort((a, b) => a.accuracy - b.accuracy)
        .slice(0, 3) // Take 3 weakest sections

      // Get random questions from weak sections
      const sectionIds = weakSections.map(s => s.sectionId)
      
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .in('section_id', sectionIds.length > 0 ? sectionIds : [1, 2, 3])
        .limit(limit)
        .order('created_at', { ascending: false })

      if (error) throw error

      return data || []

    } catch (error) {
      console.error('Error fetching challenge questions:', error)
      // Fallback to random questions
      return this.getRandomQuestions(limit)
    }
  }

  // Get questions for simulation mode with time limits
  async getSimulationQuestions(sectionId, timeLimit = 600, questionCount = 20) {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('section_id', sectionId)
        .limit(questionCount)
        .order('random()')

      if (error) throw error

      return {
        questions: data || [],
        timeLimit: timeLimit, // seconds
        questionCount: questionCount,
        timePerQuestion: Math.floor(timeLimit / questionCount)
      }

    } catch (error) {
      console.error('Error fetching simulation questions:', error)
      return { questions: [], timeLimit, questionCount, timePerQuestion: 30 }
    }
  }

  // Get community/collaborative questions (placeholder for future)
  async getCollaborativeQuestions(userId, limit = 10) {
    try {
      // For now, return regular questions with community flag
      // Future: implement user-generated questions
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .limit(limit)
        .order('created_at', { ascending: false })

      if (error) throw error

      return data?.map(q => ({
        ...q,
        isCollaborative: true,
        community: {
          createdBy: 'Sistema',
          likes: Math.floor(Math.random() * 20),
          difficulty: this.calculateQuestionDifficulty(q)
        }
      })) || []

    } catch (error) {
      console.error('Error fetching collaborative questions:', error)
      return []
    }
  }

  // Calculate question difficulty based on answer patterns
  calculateQuestionDifficulty(question) {
    // Placeholder logic - in real implementation, calculate based on user answers
    const difficultyLevels = ['Fácil', 'Médio', 'Difícil', 'Muito Difícil']
    return difficultyLevels[Math.floor(Math.random() * difficultyLevels.length)]
  }

  // Fallback random questions
  async getRandomQuestions(limit = 10) {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .limit(limit)
        .order('random()')

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching random questions:', error)
      return []
    }
  }

  // Get study mode configuration
  getStudyModeConfig(mode) {
    const configs = {
      [STUDY_MODES.NORMAL]: {
        name: 'Modo Normal',
        description: 'Estudo tradicional com questões variadas',
        icon: '📚',
        color: 'blue',
        timeLimit: null,
        questionCount: 10,
        showTimer: false,
        features: ['Feedback detalhado', 'Progresso salvo', 'XP normal']
      },
      [STUDY_MODES.REVISION]: {
        name: 'Modo Revisão',
        description: 'Apenas questões que você errou anteriormente',
        icon: '🔄',
        color: 'orange',
        timeLimit: null,
        questionCount: 10,
        showTimer: false,
        features: ['Foco em dificuldades', 'Reforço de aprendizado', 'XP +20%']
      },
      [STUDY_MODES.CHALLENGE]: {
        name: 'Modo Desafio',
        description: 'Mix das seções mais difíceis para você',
        icon: '⚔️',
        color: 'red',
        timeLimit: null,
        questionCount: 15,
        showTimer: false,
        features: ['Questões adaptativas', 'Foco em fraquezas', 'XP +50%']
      },
      [STUDY_MODES.SIMULATION]: {
        name: 'Modo Simulado',
        description: 'Simulação de prova com tempo limitado',
        icon: '⏱️',
        color: 'purple',
        timeLimit: 600, // 10 minutes
        questionCount: 20,
        showTimer: true,
        features: ['Cronômetro', 'Pressão real', 'Relatório final', 'XP +30%']
      },
      [STUDY_MODES.COLLABORATIVE]: {
        name: 'Modo Colaborativo',
        description: 'Questões criadas pela comunidade',
        icon: '👥',
        color: 'green',
        timeLimit: null,
        questionCount: 10,
        showTimer: false,
        features: ['Conteúdo variado', 'Avalie questões', 'Contribua', 'XP normal']
      }
    }

    return configs[mode] || configs[STUDY_MODES.NORMAL]
  }

  // Get XP multiplier for each mode
  getXpMultiplier(mode) {
    const multipliers = {
      [STUDY_MODES.NORMAL]: 1.0,
      [STUDY_MODES.REVISION]: 1.2,
      [STUDY_MODES.CHALLENGE]: 1.5,
      [STUDY_MODES.SIMULATION]: 1.3,
      [STUDY_MODES.COLLABORATIVE]: 1.0
    }

    return multipliers[mode] || 1.0
  }

  // Save study session with mode context
  async saveStudySession(userId, sessionData, mode) {
    try {
      const xpMultiplier = this.getXpMultiplier(mode)
      const adjustedXp = Math.floor((sessionData.xpGained || 0) * xpMultiplier)
      
      const sessionRecord = {
        user_id: userId,
        mode: mode,
        questions_count: sessionData.questionsCount || 0,
        correct_answers: sessionData.correctAnswers || 0,
        xp_gained: adjustedXp,
        time_spent: sessionData.timeSpent || 0,
        completed_at: new Date().toISOString(),
        session_data: {
          ...sessionData,
          originalXp: sessionData.xpGained,
          xpMultiplier: xpMultiplier
        }
      }

      const { data, error } = await supabase
        .from('study_sessions')
        .insert([sessionRecord])
        .select()

      if (error) throw error

      return data?.[0] || null

    } catch (error) {
      console.error('Error saving study session:', error)
      return null
    }
  }
}

export default new StudyModeService()