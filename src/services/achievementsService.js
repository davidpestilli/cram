import { supabase } from '../lib/supabase'

export class AchievementsService {
  
  // Buscar todas as conquistas disponíveis
  static async getAllAchievements() {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('category', { ascending: true })
        .order('condition_value', { ascending: true })

      if (error) {
        console.log('Database error, using mock achievements:', error)
        return this.getMockAchievements()
      }
      return data?.length > 0 ? data : this.getMockAchievements()
    } catch (error) {
      console.error('Error fetching achievements, using mock data:', error)
      return this.getMockAchievements()
    }
  }

  // Buscar conquistas do usuário
  static async getUserAchievements(userId) {
    try {
      // Usar a view user_achievements_detailed criada no banco
      const { data, error } = await supabase
        .from('user_achievements_detailed')
        .select('*')
        .eq('user_id', userId)
        .order('unlocked_at', { ascending: false })

      if (error) throw error
      return data?.map(ua => ({
        ...ua,
        achievement_id: ua.achievement_id,
        achievements: {
          id: ua.achievement_id,
          name: ua.name,
          description: ua.description,
          icon: ua.icon,
          type: ua.type,
          category: ua.category,
          condition_type: ua.condition_type,
          condition_value: ua.condition_value,
          xp_reward: ua.xp_reward,
          gold_reward: ua.gold_reward
        }
      })) || []
    } catch (error) {
      console.error('Error fetching user achievements:', error)
      return []
    }
  }

  // Verificar e desbloquear conquistas
  static async checkAndUnlockAchievements(userId) {
    try {
      const { data, error } = await supabase
        .rpc('check_and_unlock_achievements', {
          user_uuid: userId
        })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error checking achievements:', error)
      
      // Fallback: verificação manual
      return await this.manualAchievementCheck(userId)
    }
  }

  // Verificação manual de conquistas (fallback)
  static async manualAchievementCheck(userId) {
    try {
      const unlockedAchievements = []

      // Buscar dados do usuário (usar user_profiles da DATABASE_STRUCTURE)
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (!profile) return []

      // Buscar conquistas não completadas
      const { data: achievements } = await supabase
        .from('achievements')
        .select('*')

      const { data: userAchievements } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)
        .eq('is_completed', true)

      const completedIds = userAchievements?.map(ua => ua.achievement_ref_id) || []

      // Verificar cada conquista
      for (const achievement of achievements || []) {
        if (completedIds.includes(achievement.id)) continue

        let shouldUnlock = false
        let progress = 0

        switch (achievement.condition_type) {
          case 'count':
            if (achievement.type === 'study') {
              progress = profile.total_correct || 0
            } else if (achievement.type === 'level') {
              progress = profile.level || 1
            }
            shouldUnlock = progress >= achievement.condition_value
            break

          case 'level':
            progress = profile.level || 1
            shouldUnlock = progress >= achievement.condition_value
            break
        }

        // Atualizar progresso
        await supabase
          .from('user_achievements')
          .upsert({
            user_id: userId,
            achievement_ref_id: achievement.id,
            title: achievement.name,
            description: achievement.description,
            progress,
            is_completed: shouldUnlock,
            unlocked_at: shouldUnlock ? new Date().toISOString() : null
          })

        if (shouldUnlock) {
          unlockedAchievements.push({
            unlocked_achievement_id: achievement.id,
            achievement_name: achievement.name,
            achievement_icon: achievement.icon
          })

          // Dar recompensas
          await supabase
            .from('user_profiles')
            .update({
              xp: (profile.xp || 0) + achievement.xp_reward,
              gold: (profile.gold || 0) + achievement.gold_reward
            })
            .eq('id', userId)
        }
      }

      return unlockedAchievements
    } catch (error) {
      console.error('Error in manual achievement check:', error)
      return []
    }
  }

  // Marcar conquista como notificada
  static async markAsNotified(userId, achievementId) {
    try {
      const { error } = await supabase
        .from('user_achievements')
        .update({ notified: true })
        .eq('user_id', userId)
        .eq('achievement_ref_id', achievementId)

      if (error) throw error
    } catch (error) {
      console.error('Error marking achievement as notified:', error)
    }
  }

  // Buscar conquistas por categoria
  static async getAchievementsByCategory(category = 'all') {
    try {
      let query = supabase
        .from('achievements')
        .select('*')

      if (category !== 'all') {
        query = query.eq('category', category)
      }

      const { data, error } = await query
        .order('condition_value', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching achievements by category:', error)
      return []
    }
  }

  // Calcular estatísticas de conquistas do usuário
  static async getUserAchievementStats(userId) {
    try {
      const [allAchievements, userAchievements] = await Promise.all([
        this.getAllAchievements(),
        this.getUserAchievements(userId)
      ])

      const completed = userAchievements.filter(ua => ua.is_completed).length
      const total = allAchievements.length
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

      // Contar por categoria
      const byCategory = {
        bronze: 0,
        silver: 0,
        gold: 0,
        platinum: 0,
        secret: 0
      }

      userAchievements
        .filter(ua => ua.is_completed)
        .forEach(ua => {
          const category = ua.achievements?.category
          if (byCategory.hasOwnProperty(category)) {
            byCategory[category]++
          }
        })

      // Calcular XP total das conquistas
      const totalXpFromAchievements = userAchievements
        .filter(ua => ua.is_completed)
        .reduce((sum, ua) => sum + (ua.achievements?.xp_reward || 0), 0)

      return {
        completed,
        total,
        completionRate,
        byCategory,
        totalXpFromAchievements
      }
    } catch (error) {
      console.error('Error calculating achievement stats:', error)
      return {
        completed: 0,
        total: 0,
        completionRate: 0,
        byCategory: { bronze: 0, silver: 0, gold: 0, platinum: 0, secret: 0 },
        totalXpFromAchievements: 0
      }
    }
  }

  // Verificar conquistas específicas baseadas em ações
  static async checkSpecificAchievements(userId, actionType, actionData = {}) {
    try {
      const unlockedAchievements = []

      // Buscar perfil atualizado
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (!profile) return []

      // Verificar conquistas baseadas na ação
      switch (actionType) {
        case 'question_answered':
          if (actionData.isCorrect) {
            // Verificar primeira questão
            if (profile.total_correct === 1) {
              await this.unlockAchievementByName(userId, 'Primeiro Passo')
            }
            
            // Verificar milestones de estudo
            const studyMilestones = [10, 50, 100, 500]
            if (studyMilestones.includes(profile.total_correct)) {
              const achievementNames = {
                10: 'Aprendiz Dedicado',
                50: 'Estudante Aplicado', 
                100: 'Mestre dos Estudos',
                500: 'Acadêmico Supremo'
              }
              await this.unlockAchievementByName(userId, achievementNames[profile.total_correct])
            }
          }
          break

        case 'level_up':
          const levelMilestones = [5, 10, 25, 50]
          if (levelMilestones.includes(profile.level)) {
            const achievementNames = {
              5: 'Novato',
              10: 'Experiente',
              25: 'Veterano', 
              50: 'Lendário'
            }
            await this.unlockAchievementByName(userId, achievementNames[profile.level])
          }
          break

        case 'streak_achieved':
          const streakMilestones = [2, 5, 10, 20]
          if (streakMilestones.includes(actionData.streakCount)) {
            const achievementNames = {
              2: 'Dupla Certeira',
              5: 'Sequência Perfeita',
              10: 'Combo Devastador',
              20: 'Imparável'
            }
            await this.unlockAchievementByName(userId, achievementNames[actionData.streakCount])
          }
          break

        case 'item_purchased':
          // Verificar primeira compra
          const { data: purchaseCount } = await supabase
            .from('user_inventory')
            .select('id', { count: 'exact' })
            .eq('user_id', userId)

          if (purchaseCount === 1) {
            await this.unlockAchievementByName(userId, 'Primeiro Comprador')
          } else if (purchaseCount === 5) {
            await this.unlockAchievementByName(userId, 'Colecionador')
          }
          break
      }

      return unlockedAchievements
    } catch (error) {
      console.error('Error checking specific achievements:', error)
      return []
    }
  }

  // Desbloquear conquista por nome (helper)
  static async unlockAchievementByName(userId, achievementName) {
    try {
      const { data: achievement } = await supabase
        .from('achievements')
        .select('*')
        .eq('name', achievementName)
        .single()

      if (!achievement) return false

      // Verificar se já tem
      const { data: existing } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)
        .eq('achievement_ref_id', achievement.id)
        .single()

      if (existing?.is_completed) return false

      // Desbloquear
      await supabase
        .from('user_achievements')
        .upsert({
          user_id: userId,
          achievement_ref_id: achievement.id,
          title: achievement.name,
          description: achievement.description,
          progress: achievement.condition_value,
          is_completed: true,
          unlocked_at: new Date().toISOString(),
          notified: false
        })

      // Dar recompensas
      await supabase
        .from('user_profiles')
        .update({
          xp: supabase.sql`xp + ${achievement.xp_reward}`,
          gold: supabase.sql`gold + ${achievement.gold_reward}`
        })
        .eq('id', userId)

      return true
    } catch (error) {
      console.error('Error unlocking achievement by name:', error)
      return false
    }
  }

  // Mock data para desenvolvimento (fallback)
  static getMockAchievements() {
    return [
      // BRONZE ACHIEVEMENTS
      {
        id: 1,
        name: 'Primeiro Passo',
        description: 'Complete sua primeira questão',
        icon: '🎯',
        category: 'bronze',
        type: 'progress',
        condition_type: 'questions_answered',
        condition_value: 1,
        xp_reward: 50,
        gold_reward: 10
      },
      {
        id: 2,
        name: 'Estudante Iniciante',
        description: 'Responda 10 questões corretamente',
        icon: '📚',
        category: 'bronze',
        type: 'progress',
        condition_type: 'correct_answers',
        condition_value: 10,
        xp_reward: 100,
        gold_reward: 25
      },
      {
        id: 3,
        name: 'Primeira Sessão',
        description: 'Complete sua primeira sessão de estudo',
        icon: '⏰',
        category: 'bronze',
        type: 'milestone',
        condition_type: 'study_sessions',
        condition_value: 1,
        xp_reward: 75,
        gold_reward: 15
      },
      {
        id: 4,
        name: 'Explorador',
        description: 'Estude 3 temas diferentes',
        icon: '🗺️',
        category: 'bronze',
        type: 'variety',
        condition_type: 'subjects_studied',
        condition_value: 3,
        xp_reward: 125,
        gold_reward: 30
      },
      {
        id: 5,
        name: 'Persistente',
        description: 'Mantenha uma sequência de 3 dias',
        icon: '🔥',
        category: 'bronze',
        type: 'streak',
        condition_type: 'daily_streak',
        condition_value: 3,
        xp_reward: 150,
        gold_reward: 40
      },

      // SILVER ACHIEVEMENTS
      {
        id: 6,
        name: 'Conhecedor',
        description: 'Responda 50 questões corretamente',
        icon: '🧠',
        category: 'silver',
        type: 'progress',
        condition_type: 'correct_answers',
        condition_value: 50,
        xp_reward: 200,
        gold_reward: 75
      },
      {
        id: 7,
        name: 'Maratonista',
        description: 'Complete 10 sessões de estudo',
        icon: '🏃',
        category: 'silver',
        type: 'milestone',
        condition_type: 'study_sessions',
        condition_value: 10,
        xp_reward: 250,
        gold_reward: 100
      },
      {
        id: 8,
        name: 'Especialista',
        description: 'Alcance 80% de acertos em um tema',
        icon: '📖',
        category: 'silver',
        type: 'mastery',
        condition_type: 'subject_accuracy',
        condition_value: 80,
        xp_reward: 300,
        gold_reward: 125
      },
      {
        id: 9,
        name: 'Dedicado',
        description: 'Mantenha uma sequência de 7 dias',
        icon: '🔥',
        category: 'silver',
        type: 'streak',
        condition_type: 'daily_streak',
        condition_value: 7,
        xp_reward: 350,
        gold_reward: 150
      },
      {
        id: 10,
        name: 'Colecionador',
        description: 'Estude todos os 12 temas disponíveis',
        icon: '🎭',
        category: 'silver',
        type: 'variety',
        condition_type: 'subjects_studied',
        condition_value: 12,
        xp_reward: 400,
        gold_reward: 200
      },

      // GOLD ACHIEVEMENTS
      {
        id: 11,
        name: 'Mestre das Questões',
        description: 'Responda 200 questões corretamente',
        icon: '👑',
        category: 'gold',
        type: 'progress',
        condition_type: 'correct_answers',
        condition_value: 200,
        xp_reward: 500,
        gold_reward: 250
      },
      {
        id: 12,
        name: 'Veterano',
        description: 'Complete 50 sessões de estudo',
        icon: '🎖️',
        category: 'gold',
        type: 'milestone',
        condition_type: 'study_sessions',
        condition_value: 50,
        xp_reward: 600,
        gold_reward: 300
      },
      {
        id: 13,
        name: 'Perfeccionista',
        description: 'Alcance 95% de acertos em 3 temas',
        icon: '⭐',
        category: 'gold',
        type: 'mastery',
        condition_type: 'perfect_subjects',
        condition_value: 3,
        xp_reward: 750,
        gold_reward: 400
      },
      {
        id: 14,
        name: 'Inabalável',
        description: 'Mantenha uma sequência de 30 dias',
        icon: '💪',
        category: 'gold',
        type: 'streak',
        condition_type: 'daily_streak',
        condition_value: 30,
        xp_reward: 1000,
        gold_reward: 500
      },

      // PLATINUM ACHIEVEMENTS
      {
        id: 15,
        name: 'Lenda Viva',
        description: 'Responda 1000 questões corretamente',
        icon: '💎',
        category: 'platinum',
        type: 'progress',
        condition_type: 'correct_answers',
        condition_value: 1000,
        xp_reward: 2000,
        gold_reward: 1000
      },
      {
        id: 16,
        name: 'Grande Mestre',
        description: 'Domine todos os temas com 95%+ de acertos',
        icon: '🏆',
        category: 'platinum',
        type: 'mastery',
        condition_type: 'all_subjects_mastered',
        condition_value: 12,
        xp_reward: 5000,
        gold_reward: 2500
      },

      // SECRET ACHIEVEMENTS
      {
        id: 17,
        name: 'Madrugador',
        description: 'Complete uma sessão antes das 6h',
        icon: '🌅',
        category: 'secret',
        type: 'special',
        condition_type: 'early_bird_session',
        condition_value: 1,
        xp_reward: 500,
        gold_reward: 250
      },
      {
        id: 18,
        name: 'Noturno',
        description: 'Complete uma sessão depois das 23h',
        icon: '🌙',
        category: 'secret',
        type: 'special',
        condition_type: 'night_owl_session',
        condition_value: 1,
        xp_reward: 500,
        gold_reward: 250
      },
      {
        id: 19,
        name: 'Velocista',
        description: 'Responda 20 questões em menos de 5min',
        icon: '⚡',
        category: 'secret',
        type: 'speed',
        condition_type: 'speed_questions',
        condition_value: 20,
        xp_reward: 750,
        gold_reward: 375
      },
      {
        id: 20,
        name: 'Descobridor',
        description: 'Encontre esta conquista secreta',
        icon: '🕵️',
        category: 'secret',
        type: 'easter_egg',
        condition_type: 'easter_egg_found',
        condition_value: 1,
        xp_reward: 1000,
        gold_reward: 500
      }
    ]
  }

  // Mock user achievements para desenvolvimento
  static getMockUserAchievements(userId) {
    const achievements = this.getMockAchievements()
    const now = new Date()
    
    return [
      // Conquistas Bronze Completadas
      {
        id: 1,
        user_id: userId,
        achievement_id: 1,
        is_completed: true,
        progress: 1,
        unlocked_at: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        notified_at: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        achievements: achievements.find(a => a.id === 1)
      },
      {
        id: 2,
        user_id: userId,
        achievement_id: 2,
        is_completed: true,
        progress: 10,
        unlocked_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        notified_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        achievements: achievements.find(a => a.id === 2)
      },
      {
        id: 3,
        user_id: userId,
        achievement_id: 3,
        is_completed: true,
        progress: 1,
        unlocked_at: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        notified_at: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        achievements: achievements.find(a => a.id === 3)
      },
      {
        id: 4,
        user_id: userId,
        achievement_id: 4,
        is_completed: true,
        progress: 3,
        unlocked_at: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        notified_at: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        achievements: achievements.find(a => a.id === 4)
      },

      // Conquistas Silver em Progresso
      {
        id: 5,
        user_id: userId,
        achievement_id: 6,
        is_completed: false,
        progress: 25,
        unlocked_at: null,
        notified_at: null,
        achievements: achievements.find(a => a.id === 6)
      },
      {
        id: 6,
        user_id: userId,
        achievement_id: 7,
        is_completed: false,
        progress: 4,
        unlocked_at: null,
        notified_at: null,
        achievements: achievements.find(a => a.id === 7)
      },
      {
        id: 7,
        user_id: userId,
        achievement_id: 8,
        is_completed: false,
        progress: 65,
        unlocked_at: null,
        notified_at: null,
        achievements: achievements.find(a => a.id === 8)
      },

      // Conquista Secreta
      {
        id: 8,
        user_id: userId,
        achievement_id: 17,
        is_completed: true,
        progress: 1,
        unlocked_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        notified_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        achievements: achievements.find(a => a.id === 17)
      }
    ]
  }

  // Mock statistics para desenvolvimento  
  static getMockUserAchievementStats(userId) {
    const userAchievements = this.getMockUserAchievements(userId)
    const allAchievements = this.getMockAchievements()
    
    const completed = userAchievements.filter(ua => ua.is_completed).length
    const total = allAchievements.length
    const completionRate = Math.round((completed / total) * 100)
    
    const byCategory = {
      bronze: {
        completed: userAchievements.filter(ua => ua.is_completed && 
          allAchievements.find(a => a.id === ua.achievement_id)?.category === 'bronze').length,
        total: allAchievements.filter(a => a.category === 'bronze').length
      },
      silver: {
        completed: userAchievements.filter(ua => ua.is_completed && 
          allAchievements.find(a => a.id === ua.achievement_id)?.category === 'silver').length,
        total: allAchievements.filter(a => a.category === 'silver').length
      },
      gold: {
        completed: userAchievements.filter(ua => ua.is_completed && 
          allAchievements.find(a => a.id === ua.achievement_id)?.category === 'gold').length,
        total: allAchievements.filter(a => a.category === 'gold').length
      },
      platinum: {
        completed: userAchievements.filter(ua => ua.is_completed && 
          allAchievements.find(a => a.id === ua.achievement_id)?.category === 'platinum').length,
        total: allAchievements.filter(a => a.category === 'platinum').length
      },
      secret: {
        completed: userAchievements.filter(ua => ua.is_completed && 
          allAchievements.find(a => a.id === ua.achievement_id)?.category === 'secret').length,
        total: allAchievements.filter(a => a.category === 'secret').length
      }
    }
    
    const totalXpFromAchievements = userAchievements
      .filter(ua => ua.is_completed)
      .reduce((sum, ua) => {
        const achievement = allAchievements.find(a => a.id === ua.achievement_id)
        return sum + (achievement?.xp_reward || 0)
      }, 0)
    
    return {
      completed,
      total,
      completionRate,
      byCategory,
      totalXpFromAchievements
    }
  }
}

export default AchievementsService