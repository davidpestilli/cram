import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useEquipmentBonus } from './useEquipmentBonus'

export const useXpSystem = () => {
  const { profile, fetchProfile } = useAuth()
  const { applyXpBonus, applyGoldBonus, isCriticalHit, shouldShowHint } = useEquipmentBonus()
  const [updating, setUpdating] = useState(false)

  const calculateXpGain = (isCorrect, difficulty = 3, bonuses = {}) => {
    if (!isCorrect) return 0

    let baseXp = 10 // Base XP for correct answer
    
    // Difficulty bonus
    baseXp += (difficulty - 1) * 2 // +2 XP per difficulty level above 1
    
    // First attempt bonus
    if (bonuses.firstAttempt) {
      baseXp += 5
    }
    
    // Streak bonus
    if (bonuses.streak >= 5) {
      baseXp += Math.min(bonuses.streak, 25) // Max 25 bonus XP
    }
    
    // Critical hit (double XP)
    if (isCriticalHit()) {
      baseXp *= 2
      bonuses.criticalHit = true // Flag for UI feedback
    }
    
    // Apply equipment bonuses
    const context = {
      firstAttempt: bonuses.firstAttempt,
      difficulty,
      reviewMode: bonuses.reviewMode,
      sectionType: bonuses.sectionType
    }
    
    return applyXpBonus(baseXp, context)
  }

  const calculateGoldGain = (isCorrect, difficulty = 3, bonuses = {}) => {
    if (!isCorrect) return 0

    let baseGold = 5 + difficulty * 2 // 7-15 gold based on difficulty
    
    // Perfect score bonus
    if (bonuses.perfectScore) {
      baseGold += 100
    }
    
    // Apply equipment bonuses
    const context = {
      firstAttempt: bonuses.firstAttempt,
      difficulty,
      reviewMode: bonuses.reviewMode,
      sectionType: bonuses.sectionType
    }
    
    return applyGoldBonus(baseGold, context)
  }

  const updateUserXpAndGold = async (xpGain, goldGain, bonuses = {}) => {
    if (!profile || (xpGain === 0 && goldGain === 0)) return profile

    try {
      setUpdating(true)

      const newXp = profile.xp + xpGain
      const newGold = profile.gold + goldGain
      const newLevel = calculateLevel(newXp)
      const leveledUp = newLevel > profile.level

      // Update streak
      let newStreak = profile.current_streak
      let maxStreak = profile.max_streak

      if (bonuses.correctAnswer) {
        newStreak += 1
        maxStreak = Math.max(maxStreak, newStreak)
      } else if (bonuses.incorrectAnswer) {
        newStreak = 0
      }

      // Update profile in database
      const { error } = await supabase
        .from('user_profiles')
        .update({
          xp: newXp,
          gold: newGold,
          level: newLevel,
          current_streak: newStreak,
          max_streak: maxStreak,
          total_questions: profile.total_questions + 1,
          total_correct: profile.total_correct + (bonuses.correctAnswer ? 1 : 0)
        })
        .eq('id', profile.id)

      if (error) {
        throw error
      }

      // Refresh profile to get updated data
      await fetchProfile(profile.id)

      return {
        xpGained: xpGain,
        goldGained: goldGain,
        leveledUp,
        newLevel,
        newStreak
      }

    } catch (error) {
      console.error('Error updating XP and Gold:', error)
      return null
    } finally {
      setUpdating(false)
    }
  }

  const calculateLevel = (xp) => {
    // Simple level calculation: 1000 XP per level
    return Math.floor(xp / 1000) + 1
  }

  const getXpForLevel = (level) => {
    return (level - 1) * 1000
  }

  const getXpForNextLevel = (level) => {
    return level * 1000
  }

  const getXpProgress = (currentXp, currentLevel) => {
    const currentLevelXp = getXpForLevel(currentLevel)
    const nextLevelXp = getXpForNextLevel(currentLevel)
    const progressXp = currentXp - currentLevelXp
    const neededXp = nextLevelXp - currentLevelXp
    return Math.round((progressXp / neededXp) * 100)
  }

  return {
    calculateXpGain,
    calculateGoldGain,
    updateUserXpAndGold,
    calculateLevel,
    getXpForLevel,
    getXpForNextLevel,
    getXpProgress,
    updating
  }
}

export default useXpSystem