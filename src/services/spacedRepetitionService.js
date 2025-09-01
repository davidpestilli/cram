import { supabase } from '../lib/supabase'

// Spaced repetition intervals (in hours)
const SR_INTERVALS = {
  0: 1,        // 1 hour (first review after getting it wrong)
  1: 4,        // 4 hours
  2: 24,       // 1 day
  3: 72,       // 3 days
  4: 168,      // 1 week
  5: 336,      // 2 weeks
  6: 720,      // 1 month
  7: 2160,     // 3 months
  8: 4320      // 6 months
}

// Ease factors for difficulty adjustment
const EASE_FACTORS = {
  HARD: 1.3,
  GOOD: 2.5,
  EASY: 2.8
}

class SpacedRepetitionService {
  
  // Initialize spaced repetition data for a question
  async initializeQuestionSR(userId, questionId, difficulty = 'GOOD') {
    try {
      const easeFactor = EASE_FACTORS[difficulty]
      const nextReview = new Date()
      nextReview.setHours(nextReview.getHours() + SR_INTERVALS[0])

      const srData = {
        user_id: userId,
        question_id: questionId,
        repetition_count: 0,
        ease_factor: easeFactor,
        interval_hours: SR_INTERVALS[0],
        next_review: nextReview.toISOString(),
        last_review: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('spaced_repetition')
        .insert([srData])
        .select()

      if (error) throw error
      return data?.[0] || null

    } catch (error) {
      console.error('Error initializing SR data:', error)
      return null
    }
  }

  // Update spaced repetition data after answering a question
  async updateQuestionSR(userId, questionId, wasCorrect, difficulty = 'GOOD') {
    try {
      // Get existing SR data
      const { data: existing } = await supabase
        .from('spaced_repetition')
        .select('*')
        .eq('user_id', userId)
        .eq('question_id', questionId)
        .single()

      let srData
      
      if (!existing) {
        // Initialize if doesn't exist
        return this.initializeQuestionSR(userId, questionId, difficulty)
      }

      const now = new Date()
      
      if (wasCorrect) {
        // Successful recall - increase interval
        const newRepetitionCount = existing.repetition_count + 1
        let newEaseFactor = existing.ease_factor
        let newIntervalHours

        // Adjust ease factor based on difficulty
        if (difficulty === 'HARD') {
          newEaseFactor = Math.max(1.3, newEaseFactor - 0.15)
        } else if (difficulty === 'EASY') {
          newEaseFactor = newEaseFactor + 0.1
        }

        // Calculate new interval
        if (newRepetitionCount < Object.keys(SR_INTERVALS).length) {
          newIntervalHours = SR_INTERVALS[newRepetitionCount]
        } else {
          // Use ease factor for longer intervals
          newIntervalHours = Math.ceil(existing.interval_hours * newEaseFactor)
        }

        // Set next review time
        const nextReview = new Date(now)
        nextReview.setHours(nextReview.getHours() + newIntervalHours)

        srData = {
          repetition_count: newRepetitionCount,
          ease_factor: newEaseFactor,
          interval_hours: newIntervalHours,
          next_review: nextReview.toISOString(),
          last_review: now.toISOString(),
          updated_at: now.toISOString()
        }
      } else {
        // Failed recall - reset to beginning
        const nextReview = new Date(now)
        nextReview.setHours(nextReview.getHours() + SR_INTERVALS[0])

        srData = {
          repetition_count: 0,
          ease_factor: Math.max(1.3, existing.ease_factor - 0.2),
          interval_hours: SR_INTERVALS[0],
          next_review: nextReview.toISOString(),
          last_review: now.toISOString(),
          updated_at: now.toISOString()
        }
      }

      const { data, error } = await supabase
        .from('spaced_repetition')
        .update(srData)
        .eq('user_id', userId)
        .eq('question_id', questionId)
        .select()

      if (error) throw error
      return data?.[0] || null

    } catch (error) {
      console.error('Error updating SR data:', error)
      return null
    }
  }

  // Get questions due for review
  async getQuestionsForReview(userId, limit = 20) {
    try {
      const now = new Date().toISOString()
      
      const { data, error } = await supabase
        .from('spaced_repetition')
        .select(`
          *,
          questions!inner(*)
        `)
        .eq('user_id', userId)
        .lte('next_review', now)
        .order('next_review', { ascending: true })
        .limit(limit)

      if (error) throw error

      return data?.map(item => ({
        ...item.questions,
        sr_data: {
          repetition_count: item.repetition_count,
          ease_factor: item.ease_factor,
          interval_hours: item.interval_hours,
          next_review: item.next_review,
          last_review: item.last_review
        }
      })) || []

    } catch (error) {
      console.error('Error fetching questions for review:', error)
      return []
    }
  }

  // Get upcoming review schedule
  async getReviewSchedule(userId, days = 7) {
    try {
      const now = new Date()
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + days)

      const { data, error } = await supabase
        .from('spaced_repetition')
        .select('next_review, question_id')
        .eq('user_id', userId)
        .gte('next_review', now.toISOString())
        .lte('next_review', endDate.toISOString())
        .order('next_review')

      if (error) throw error

      // Group by date
      const schedule = {}
      data?.forEach(item => {
        const reviewDate = new Date(item.next_review).toDateString()
        if (!schedule[reviewDate]) {
          schedule[reviewDate] = []
        }
        schedule[reviewDate].push(item)
      })

      return schedule

    } catch (error) {
      console.error('Error fetching review schedule:', error)
      return {}
    }
  }

  // Get spaced repetition statistics
  async getSRStats(userId) {
    try {
      const { data, error } = await supabase
        .from('spaced_repetition')
        .select('*')
        .eq('user_id', userId)

      if (error) throw error

      if (!data || data.length === 0) {
        return {
          totalQuestions: 0,
          dueToday: 0,
          averageEaseFactor: 0,
          masteredQuestions: 0,
          strugglingQuestions: 0
        }
      }

      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const dueToday = data.filter(item => 
        new Date(item.next_review) >= today && 
        new Date(item.next_review) < tomorrow
      ).length

      const masteredQuestions = data.filter(item => 
        item.repetition_count >= 5 && 
        item.ease_factor >= 2.5
      ).length

      const strugglingQuestions = data.filter(item => 
        item.ease_factor < 1.5 || 
        (item.repetition_count === 0 && item.last_review)
      ).length

      const averageEaseFactor = data.reduce((sum, item) => sum + item.ease_factor, 0) / data.length

      return {
        totalQuestions: data.length,
        dueToday,
        averageEaseFactor: Math.round(averageEaseFactor * 100) / 100,
        masteredQuestions,
        strugglingQuestions,
        retentionRate: Math.round((masteredQuestions / data.length) * 100)
      }

    } catch (error) {
      console.error('Error fetching SR stats:', error)
      return {
        totalQuestions: 0,
        dueToday: 0,
        averageEaseFactor: 0,
        masteredQuestions: 0,
        strugglingQuestions: 0,
        retentionRate: 0
      }
    }
  }

  // Get difficulty recommendations based on performance
  getDifficultyRecommendation(questionData, userAnswer) {
    // Analyze user's response time and accuracy for this type of question
    // This is a simplified version - could be enhanced with ML
    
    const responseTime = userAnswer.responseTime || 30000 // milliseconds
    const isCorrect = userAnswer.isCorrect
    const currentEaseFactor = questionData.sr_data?.ease_factor || 2.5

    if (!isCorrect) {
      return 'HARD'
    }

    // Quick and confident answer
    if (responseTime < 10000 && currentEaseFactor >= 2.5) {
      return 'EASY'
    }

    // Slow or uncertain answer
    if (responseTime > 30000 || currentEaseFactor < 2.0) {
      return 'HARD'
    }

    return 'GOOD'
  }

  // Create adaptive study session based on SR
  async createAdaptiveSession(userId, targetMinutes = 20) {
    try {
      // Get questions due for review
      const dueQuestions = await this.getQuestionsForReview(userId, 50)
      
      // Get struggling questions (low ease factor)
      const { data: strugglingData } = await supabase
        .from('spaced_repetition')
        .select(`
          *,
          questions!inner(*)
        `)
        .eq('user_id', userId)
        .lt('ease_factor', 2.0)
        .order('ease_factor', { ascending: true })
        .limit(20)

      const strugglingQuestions = strugglingData?.map(item => ({
        ...item.questions,
        sr_data: {
          repetition_count: item.repetition_count,
          ease_factor: item.ease_factor,
          interval_hours: item.interval_hours,
          priority: 'struggling'
        }
      })) || []

      // Combine and prioritize
      const allQuestions = [
        ...dueQuestions.map(q => ({ ...q, priority: 'due' })),
        ...strugglingQuestions.filter(q => 
          !dueQuestions.some(dq => dq.id === q.id)
        )
      ]

      // Estimate time needed (assume 1-2 minutes per question)
      const estimatedQuestions = Math.min(
        Math.floor(targetMinutes / 1.5),
        allQuestions.length
      )

      return {
        questions: allQuestions.slice(0, estimatedQuestions),
        totalQuestions: allQuestions.length,
        estimatedTime: estimatedQuestions * 1.5,
        dueCount: dueQuestions.length,
        strugglingCount: strugglingQuestions.length,
        recommendations: this.generateStudyRecommendations(allQuestions)
      }

    } catch (error) {
      console.error('Error creating adaptive session:', error)
      return {
        questions: [],
        totalQuestions: 0,
        estimatedTime: 0,
        dueCount: 0,
        strugglingCount: 0,
        recommendations: []
      }
    }
  }

  // Generate study recommendations
  generateStudyRecommendations(questions) {
    const recommendations = []
    
    const dueCount = questions.filter(q => q.priority === 'due').length
    const strugglingCount = questions.filter(q => q.priority === 'struggling').length
    
    if (dueCount > 10) {
      recommendations.push({
        type: 'warning',
        message: `Você tem ${dueCount} questões atrasadas para revisão. Foque nelas primeiro!`
      })
    }
    
    if (strugglingCount > 5) {
      recommendations.push({
        type: 'tip',
        message: `${strugglingCount} questões estão com dificuldade alta. Considere revisar a teoria antes.`
      })
    }
    
    if (questions.length < 5) {
      recommendations.push({
        type: 'success',
        message: 'Parabéns! Você está em dia com suas revisões. Que tal estudar conteúdo novo?'
      })
    }
    
    return recommendations
  }
}

export default new SpacedRepetitionService()