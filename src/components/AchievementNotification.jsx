import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

const AchievementNotification = ({ 
  show, 
  achievement, 
  onComplete 
}) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (show && achievement) {
      setIsVisible(true)
      
      // Auto dismiss after 4 seconds
      const timer = setTimeout(() => {
        handleClose()
      }, 4000)

      return () => clearTimeout(timer)
    }
  }, [show, achievement])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => {
      if (onComplete) {
        onComplete()
      }
    }, 300) // Wait for exit animation
  }

  const getCategoryColor = (category) => {
    const colors = {
      bronze: 'from-orange-400 to-orange-600',
      silver: 'from-gray-300 to-gray-500', 
      gold: 'from-yellow-400 to-yellow-600',
      platinum: 'from-purple-400 to-purple-600',
      secret: 'from-pink-500 to-rose-600'
    }
    return colors[category] || colors.bronze
  }

  const getCategoryBorder = (category) => {
    const colors = {
      bronze: 'border-orange-500',
      silver: 'border-gray-400', 
      gold: 'border-yellow-500',
      platinum: 'border-purple-500',
      secret: 'border-pink-500'
    }
    return colors[category] || colors.bronze
  }

  const notificationVariants = {
    hidden: { 
      opacity: 0, 
      y: -100, 
      scale: 0.8,
      rotateX: -90
    },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      rotateX: 0,
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 300,
        duration: 0.6
      }
    },
    exit: { 
      opacity: 0, 
      y: -50, 
      scale: 0.9,
      transition: { 
        duration: 0.3 
      }
    }
  }

  const glowVariants = {
    animate: {
      scale: [1, 1.05, 1],
      opacity: [0.7, 1, 0.7],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  }

  const iconVariants = {
    animate: {
      rotate: [0, 10, -10, 5, -5, 0],
      scale: [1, 1.1, 1],
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  }

  const sparkleVariants = {
    animate: {
      scale: [0, 1, 0],
      rotate: [0, 180, 360],
      opacity: [0, 1, 0],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        repeatDelay: 0.5
      }
    }
  }

  if (!achievement) return null

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
          variants={notificationVariants}
          initial="hidden"
          animate="visible" 
          exit="exit"
          style={{ perspective: 1000 }}
        >
          {/* Glow effect */}
          <motion.div
            className={`absolute inset-0 bg-gradient-to-r ${getCategoryColor(achievement.category)} 
                       opacity-30 blur-xl rounded-2xl`}
            variants={glowVariants}
            animate="animate"
          />
          
          {/* Main notification */}
          <motion.div
            className={`relative bg-white border-2 ${getCategoryBorder(achievement.category)} 
                       rounded-2xl shadow-2xl overflow-hidden min-w-96 max-w-md`}
            onClick={handleClose}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Header with gradient */}
            <div className={`bg-gradient-to-r ${getCategoryColor(achievement.category)} 
                            text-white px-6 py-3 relative overflow-hidden`}>
              
              {/* Sparkles */}
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute text-yellow-200 text-lg"
                  style={{ 
                    left: `${20 + i * 30}%`, 
                    top: `${10 + (i % 2) * 20}px` 
                  }}
                  variants={sparkleVariants}
                  animate="animate"
                  transition={{ delay: i * 0.2 }}
                >
                  ✨
                </motion.div>
              ))}
              
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm uppercase tracking-wide">
                    🏆 Conquista Desbloqueada!
                  </span>
                </div>
                <button 
                  className="text-white/80 hover:text-white text-lg"
                  onClick={handleClose}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 bg-white">
              <div className="flex items-start gap-4">
                {/* Achievement Icon */}
                <motion.div
                  className="text-4xl"
                  variants={iconVariants}
                  animate="animate"
                >
                  {achievement.icon}
                </motion.div>

                {/* Achievement Details */}
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900 mb-1">
                    {achievement.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3 leading-relaxed">
                    {achievement.description}
                  </p>
                  
                  {/* Rewards */}
                  <div className="flex items-center gap-4">
                    {achievement.xp_reward > 0 && (
                      <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-full">
                        <span className="text-xs">✨</span>
                        <span className="text-xs font-medium text-blue-700">
                          +{achievement.xp_reward} XP
                        </span>
                      </div>
                    )}
                    {achievement.gold_reward > 0 && (
                      <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-full">
                        <span className="text-xs">🪙</span>
                        <span className="text-xs font-medium text-yellow-700">
                          +{achievement.gold_reward} Gold
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Category Badge */}
                <div className={`px-3 py-1 rounded-full text-xs font-medium capitalize
                               bg-gradient-to-r ${getCategoryColor(achievement.category)} 
                               text-white shadow-md`}>
                  {achievement.category}
                </div>
              </div>
            </div>

            {/* Bottom glow */}
            <div className={`h-1 bg-gradient-to-r ${getCategoryColor(achievement.category)}`} />
          </motion.div>

          {/* Confetti particles */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-yellow-400 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [0, 1, 0], 
                opacity: [0, 1, 0],
                y: [0, -50, -100],
                x: [0, Math.random() * 40 - 20],
                rotate: [0, 360]
              }}
              transition={{
                duration: 2,
                delay: i * 0.1,
                ease: "easeOut"
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default AchievementNotification