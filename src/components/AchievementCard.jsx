import { motion } from 'framer-motion'

const AchievementCard = ({ 
  achievement, 
  userAchievement = null, 
  className = '' 
}) => {
  const isCompleted = userAchievement?.is_completed || false
  const progress = userAchievement?.progress || 0
  const progressPercentage = Math.min((progress / achievement.condition_value) * 100, 100)

  const getCategoryConfig = (category) => {
    const configs = {
      bronze: {
        gradient: 'from-orange-400 to-orange-600',
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-800',
        glow: 'shadow-orange-200'
      },
      silver: {
        gradient: 'from-gray-300 to-gray-500',
        bg: 'bg-gray-50',
        border: 'border-gray-200', 
        text: 'text-gray-800',
        glow: 'shadow-gray-200'
      },
      gold: {
        gradient: 'from-yellow-400 to-yellow-600',
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        text: 'text-yellow-800',
        glow: 'shadow-yellow-200'
      },
      platinum: {
        gradient: 'from-purple-400 to-purple-600',
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        text: 'text-purple-800',
        glow: 'shadow-purple-200'
      },
      secret: {
        gradient: 'from-pink-500 to-rose-600',
        bg: 'bg-pink-50',
        border: 'border-pink-200',
        text: 'text-pink-800',
        glow: 'shadow-pink-200'
      }
    }
    return configs[category] || configs.bronze
  }

  const config = getCategoryConfig(achievement.category)

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    },
    hover: { 
      scale: 1.02,
      y: -4,
      transition: { duration: 0.2 }
    }
  }

  const iconVariants = {
    completed: {
      scale: [1, 1.1, 1],
      rotate: [0, 5, -5, 0],
      transition: { 
        duration: 0.6,
        repeat: isCompleted ? Infinity : 0,
        repeatDelay: 3
      }
    },
    locked: {
      opacity: 0.4,
      scale: 0.9
    }
  }

  const formatConditionText = () => {
    switch (achievement.condition_type) {
      case 'count':
        if (achievement.type === 'study') {
          return `${achievement.condition_value} questões corretas`
        } else if (achievement.type === 'level') {
          return `Nível ${achievement.condition_value}`
        } else if (achievement.type === 'shop') {
          return `${achievement.condition_value} itens comprados`
        }
        break
      case 'streak':
        return `${achievement.condition_value} acertos seguidos`
      case 'accuracy':
        return `${achievement.condition_value}% de precisão`
      case 'level':
        return `Nível ${achievement.condition_value}`
      case 'special':
        return 'Condição especial'
    }
    return achievement.description
  }

  const getTypeIcon = () => {
    const icons = {
      study: '📚',
      streak: '🔥',
      level: '⭐',
      shop: '🛍️',
      special: '🎯'
    }
    return icons[achievement.type] || '🏆'
  }

  return (
    <motion.div
      className={`relative bg-white rounded-xl border-2 ${config.border} overflow-hidden 
                  transition-all duration-300 ${className}`}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      style={{
        boxShadow: isCompleted 
          ? `0 8px 25px -5px rgba(0, 0, 0, 0.1), 0 0 20px -5px ${config.glow.replace('shadow-', 'rgba(')}0.3)`
          : '0 4px 15px -3px rgba(0, 0, 0, 0.1)'
      }}
    >
      {/* Completed overlay */}
      {isCompleted && (
        <div className="absolute inset-0 pointer-events-none">
          <div className={`absolute top-0 right-0 w-0 h-0 border-l-[40px] border-b-[40px] 
                          border-l-transparent border-b-green-500`} />
          <div className="absolute top-1 right-1 text-white text-sm">
            ✓
          </div>
        </div>
      )}

      {/* Secret achievement blur */}
      {achievement.is_secret && !isCompleted && (
        <div className="absolute inset-0 backdrop-blur-sm bg-black/10 z-10 
                       flex items-center justify-center">
          <div className="text-center text-gray-600">
            <div className="text-3xl mb-2">🔒</div>
            <div className="text-sm font-medium">Conquista Secreta</div>
          </div>
        </div>
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* Achievement Icon */}
            <motion.div
              className={`text-3xl ${isCompleted ? '' : 'opacity-60'}`}
              variants={iconVariants}
              animate={isCompleted ? "completed" : "locked"}
            >
              {achievement.icon}
            </motion.div>

            {/* Title and Category */}
            <div>
              <h3 className={`font-bold text-lg ${isCompleted ? 'text-gray-900' : 'text-gray-600'}`}>
                {achievement.is_secret && !isCompleted ? '????' : achievement.name}
              </h3>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize
                                bg-gradient-to-r ${config.gradient} text-white`}>
                  {achievement.category}
                </span>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  {getTypeIcon()} {achievement.type}
                </span>
              </div>
            </div>
          </div>

          {/* Rewards */}
          <div className="text-right">
            {achievement.xp_reward > 0 && (
              <div className="text-xs text-blue-600 flex items-center gap-1 justify-end">
                <span>✨</span>
                <span>+{achievement.xp_reward}</span>
              </div>
            )}
            {achievement.gold_reward > 0 && (
              <div className="text-xs text-yellow-600 flex items-center gap-1 justify-end">
                <span>🪙</span>
                <span>+{achievement.gold_reward}</span>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <p className={`text-sm mb-3 leading-relaxed 
                      ${isCompleted ? 'text-gray-700' : 'text-gray-500'}`}>
          {achievement.is_secret && !isCompleted 
            ? 'Continue jogando para descobrir esta conquista misteriosa...'
            : achievement.description
          }
        </p>

        {/* Progress */}
        {!achievement.is_secret && (
          <div className="space-y-2">
            {/* Progress Bar */}
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Progresso</span>
              <span>{progress}/{achievement.condition_value}</span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <motion.div
                className={`h-full bg-gradient-to-r ${config.gradient} transition-all duration-500`}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>

            {/* Condition Text */}
            <div className="text-xs text-gray-500 text-center">
              {formatConditionText()}
            </div>
          </div>
        )}

        {/* Completion Date */}
        {isCompleted && userAchievement?.unlocked_at && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
              <span>🎉</span>
              <span>
                Desbloqueado em {new Date(userAchievement.unlocked_at).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom accent */}
      <div className={`h-1 bg-gradient-to-r ${config.gradient} 
                      ${isCompleted ? 'opacity-100' : 'opacity-40'}`} />
    </motion.div>
  )
}

export default AchievementCard