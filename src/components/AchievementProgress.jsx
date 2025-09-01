import { motion } from 'framer-motion'

const AchievementProgress = ({ 
  stats, 
  className = '',
  showDetails = true 
}) => {
  const { 
    completed = 0, 
    total = 0, 
    completionRate = 0, 
    byCategory = {},
    totalXpFromAchievements = 0 
  } = stats

  const categories = [
    { key: 'bronze', name: 'Bronze', color: 'from-orange-400 to-orange-600', icon: '🥉' },
    { key: 'silver', name: 'Prata', color: 'from-gray-300 to-gray-500', icon: '🥈' },
    { key: 'gold', name: 'Ouro', color: 'from-yellow-400 to-yellow-600', icon: '🥇' },
    { key: 'platinum', name: 'Platina', color: 'from-purple-400 to-purple-600', icon: '💎' },
    { key: 'secret', name: 'Secretas', color: 'from-pink-500 to-rose-600', icon: '🔮' }
  ]

  const progressVariants = {
    hidden: { width: 0, opacity: 0 },
    visible: { 
      width: `${completionRate}%`, 
      opacity: 1,
      transition: { 
        duration: 1.5, 
        ease: "easeOut",
        delay: 0.3
      }
    }
  }

  const counterVariants = {
    hidden: { scale: 0 },
    visible: { 
      scale: 1,
      transition: { 
        type: "spring",
        damping: 15,
        stiffness: 300,
        delay: 0.5
      }
    }
  }

  const getRank = () => {
    if (completionRate >= 90) return { name: 'Lenda', icon: '👑', color: 'text-purple-600' }
    if (completionRate >= 75) return { name: 'Mestre', icon: '🏆', color: 'text-gold-600' }
    if (completionRate >= 50) return { name: 'Veterano', icon: '⭐', color: 'text-blue-600' }
    if (completionRate >= 25) return { name: 'Explorador', icon: '🗺️', color: 'text-green-600' }
    return { name: 'Novato', icon: '🌱', color: 'text-gray-600' }
  }

  const rank = getRank()

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">
            Progresso de Conquistas
          </h3>
          <p className="text-gray-600 text-sm">
            Acompanhe suas conquistas e evolução
          </p>
        </div>
        <div className={`text-right ${rank.color}`}>
          <div className="text-2xl mb-1">{rank.icon}</div>
          <div className="text-sm font-medium">{rank.name}</div>
        </div>
      </div>

      {/* Main Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Conquistas Completadas
          </span>
          <motion.span 
            className="text-sm font-bold text-gray-900"
            variants={counterVariants}
            initial="hidden"
            animate="visible"
          >
            {completed}/{total} ({completionRate}%)
          </motion.span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 
                       shadow-sm relative"
            variants={progressVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Progress glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 
                           opacity-50 blur-sm" />
          </motion.div>
        </div>
      </div>

      {showDetails && (
        <>
          {/* Categories Breakdown */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-800 mb-3">
              Por Categoria
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {categories.map((category, index) => (
                <motion.div
                  key={category.key}
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index, duration: 0.3 }}
                >
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${category.color} 
                                  flex items-center justify-center text-white text-lg mx-auto mb-2
                                  shadow-lg hover:scale-105 transition-transform duration-200`}>
                    {category.icon}
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    {byCategory[category.key] || 0}
                  </div>
                  <div className="text-xs text-gray-600">
                    {category.name}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* XP from Achievements */}
            <motion.div
              className="bg-blue-50 rounded-lg p-4 border border-blue-200"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">✨</div>
                <div>
                  <div className="text-lg font-bold text-blue-800">
                    {totalXpFromAchievements.toLocaleString()}
                  </div>
                  <div className="text-sm text-blue-600">
                    XP de Conquistas
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Completion Percentage */}
            <motion.div
              className="bg-green-50 rounded-lg p-4 border border-green-200"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">📊</div>
                <div>
                  <div className="text-lg font-bold text-green-800">
                    {completionRate}%
                  </div>
                  <div className="text-sm text-green-600">
                    Taxa de Conclusão
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Next Milestones */}
          {completionRate < 100 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <span>🎯</span>
                Próximas Metas
              </h4>
              <div className="space-y-1 text-sm text-gray-600">
                {completionRate < 25 && (
                  <div>• Complete mais {Math.ceil((total * 0.25) - completed)} conquistas para se tornar Explorador</div>
                )}
                {completionRate >= 25 && completionRate < 50 && (
                  <div>• Complete mais {Math.ceil((total * 0.5) - completed)} conquistas para se tornar Veterano</div>
                )}
                {completionRate >= 50 && completionRate < 75 && (
                  <div>• Complete mais {Math.ceil((total * 0.75) - completed)} conquistas para se tornar Mestre</div>
                )}
                {completionRate >= 75 && completionRate < 90 && (
                  <div>• Complete mais {Math.ceil((total * 0.9) - completed)} conquistas para se tornar Lenda</div>
                )}
                {completionRate >= 90 && completionRate < 100 && (
                  <div>• Complete mais {total - completed} conquistas para 100% de conclusão!</div>
                )}
              </div>
            </div>
          )}

          {/* Perfect Completion */}
          {completionRate === 100 && (
            <motion.div 
              className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 
                         rounded-lg border border-purple-200"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-center">
                <div className="text-3xl mb-2">🎉</div>
                <div className="text-lg font-bold text-purple-800 mb-1">
                  Parabéns, Completista!
                </div>
                <div className="text-sm text-purple-600">
                  Você desbloqueou todas as conquistas disponíveis!
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  )
}

export default AchievementProgress