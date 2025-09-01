import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import AchievementsService from '../services/achievementsService'

export const useAchievements = () => {
  const { profile } = useAuth()
  const [achievements, setAchievements] = useState([])
  const [userAchievements, setUserAchievements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pendingNotifications, setPendingNotifications] = useState([])
  const [stats, setStats] = useState({
    completed: 0,
    total: 0,
    completionRate: 0,
    byCategory: {},
    totalXpFromAchievements: 0
  })

  // Load achievements and user progress
  useEffect(() => {
    if (profile?.id) {
      loadAchievements()
    }
  }, [profile?.id])

  const loadAchievements = async () => {
    try {
      setLoading(true)
      setError(null)

      const [allAchievements, userProgress] = await Promise.all([
        AchievementsService.getAllAchievements(),
        AchievementsService.getUserAchievements(profile.id)
      ])

      // Use mock data if database is not available
      if (allAchievements.length === 0) {
        console.log('Using mock achievements data')
        setAchievements(AchievementsService.getMockAchievements())
        setUserAchievements(AchievementsService.getMockUserAchievements(profile.id))
      } else {
        setAchievements(allAchievements)
        setUserAchievements(userProgress)
      }

      // Calculate stats
      const achievementStats = await AchievementsService.getUserAchievementStats(profile.id)
      setStats(achievementStats)

    } catch (err) {
      console.error('Error loading achievements:', err)
      setError(err.message)
      
      // Fallback to mock data
      setAchievements(AchievementsService.getMockAchievements())
      setUserAchievements(AchievementsService.getMockUserAchievements(profile.id))
    } finally {
      setLoading(false)
    }
  }

  // Check for new achievements
  const checkAchievements = async () => {
    if (!profile?.id) return []

    try {
      const newAchievements = await AchievementsService.checkAndUnlockAchievements(profile.id)
      
      if (newAchievements.length > 0) {
        // Add to pending notifications
        setPendingNotifications(prev => [...prev, ...newAchievements])
        
        // Reload user achievements to get updated progress
        await loadAchievements()
      }

      return newAchievements
    } catch (error) {
      console.error('Error checking achievements:', error)
      return []
    }
  }

  // Check specific achievement triggers
  const checkSpecificAchievements = async (actionType, actionData = {}) => {
    if (!profile?.id) return []

    try {
      const newAchievements = await AchievementsService.checkSpecificAchievements(
        profile.id, 
        actionType, 
        actionData
      )

      if (newAchievements.length > 0) {
        setPendingNotifications(prev => [...prev, ...newAchievements])
        await loadAchievements()
      }

      return newAchievements
    } catch (error) {
      console.error('Error checking specific achievements:', error)
      return []
    }
  }

  // Get next pending notification
  const getNextNotification = () => {
    if (pendingNotifications.length === 0) return null

    const notification = pendingNotifications[0]
    const achievement = achievements.find(a => a.id === notification.unlocked_achievement_id)
    
    return achievement ? {
      ...achievement,
      name: notification.achievement_name,
      icon: notification.achievement_icon
    } : null
  }

  // Mark notification as shown
  const markNotificationShown = () => {
    if (pendingNotifications.length > 0) {
      const shownNotification = pendingNotifications[0]
      
      // Mark as notified in database
      AchievementsService.markAsNotified(
        profile.id, 
        shownNotification.unlocked_achievement_id
      )

      // Remove from pending
      setPendingNotifications(prev => prev.slice(1))
    }
  }

  // Get achievement by ID with user progress
  const getAchievementWithProgress = (achievementId) => {
    const achievement = achievements.find(a => a.id === achievementId)
    const userAchievement = userAchievements.find(ua => ua.achievement_id === achievementId)
    
    return {
      achievement,
      userAchievement,
      isCompleted: userAchievement?.is_completed || false,
      progress: userAchievement?.progress || 0
    }
  }

  // Get achievements by category
  const getAchievementsByCategory = (category = 'all') => {
    if (category === 'all') return achievements

    return achievements.filter(achievement => achievement.category === category)
  }

  // Get completed achievements
  const getCompletedAchievements = () => {
    return userAchievements
      .filter(ua => ua.is_completed)
      .map(ua => ({
        ...ua.achievements,
        userAchievement: ua
      }))
  }

  // Get in-progress achievements
  const getInProgressAchievements = () => {
    return userAchievements
      .filter(ua => !ua.is_completed && ua.progress > 0)
      .map(ua => ({
        ...ua.achievements,
        userAchievement: ua
      }))
  }

  // Get locked achievements
  const getLockedAchievements = () => {
    const userAchievementIds = userAchievements.map(ua => ua.achievement_id)
    
    return achievements.filter(achievement => 
      !userAchievementIds.includes(achievement.id)
    )
  }

  // Simulate achievement unlock (for testing)
  const simulateAchievementUnlock = (achievementId) => {
    const achievement = achievements.find(a => a.id === achievementId)
    if (achievement) {
      setPendingNotifications(prev => [...prev, {
        unlocked_achievement_id: achievement.id,
        achievement_name: achievement.name,
        achievement_icon: achievement.icon
      }])
    }
  }

  return {
    // Data
    achievements,
    userAchievements,
    stats,
    loading,
    error,
    
    // Notifications
    pendingNotifications,
    getNextNotification,
    markNotificationShown,
    
    // Actions
    checkAchievements,
    checkSpecificAchievements,
    loadAchievements,
    
    // Getters
    getAchievementWithProgress,
    getAchievementsByCategory,
    getCompletedAchievements,
    getInProgressAchievements,
    getLockedAchievements,
    
    // Testing
    simulateAchievementUnlock
  }
}

export default useAchievements