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

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching achievements:', error)
      return []
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
      {
        id: 1,
        name: 'Primeiro Passo',
        description: 'Complete sua primeira questão',
        icon: '👶',
        category: 'bronze',
        type: 'study',
        xp_reward: 50,
        gold_reward: 25,
        condition_value: 1
      },
      {
        id: 2,
        name: 'Aprendiz Dedicado',
        description: 'Responda 10 questões corretamente',
        icon: '📚',
        category: 'bronze',
        type: 'study',
        xp_reward: 100,
        gold_reward: 50,
        condition_value: 10
      },
      {
        id: 3,
        name: 'Sequência Perfeita',
        description: 'Acerte 5 questões seguidas',
        icon: '⚡',
        category: 'silver',
        type: 'streak',
        xp_reward: 150,
        gold_reward: 75,
        condition_value: 5
      }
    ]
  }

  // Mock user achievements para desenvolvimento
  static getMockUserAchievements(userId) {
    return [
      {
        id: 1,
        user_id: userId,
        achievement_id: 1,
        is_completed: true,
        progress: 1,
        unlocked_at: new Date().toISOString(),
        achievements: this.getMockAchievements()[0]
      }
    ]
  }
}

export default AchievementsService