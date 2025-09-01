import { motion } from 'framer-motion'

const StreakIndicator = ({ streak, className = "" }) => {
  if (streak < 2) return null

  const getStreakColor = (streak) => {
    if (streak >= 10) return 'text-red-500'
    if (streak >= 5) return 'text-orange-500' 
    return 'text-yellow-500'
  }

  const getStreakIcon = (streak) => {
    if (streak >= 10) return '🔥🔥🔥'
    if (streak >= 5) return '🔥🔥'
    return '🔥'
  }

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ 
        scale: [0, 1.2, 1],
      }}
      transition={{
        duration: 0.6,
        ease: "backOut"
      }}
      className={`flex items-center gap-2 ${className}`}
    >
      <motion.span
        animate={{ 
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="text-2xl"
      >
        {getStreakIcon(streak)}
      </motion.span>
      
      <div className="text-center">
        <div className={`text-xl font-bold ${getStreakColor(streak)}`}>
          {streak}
        </div>
        <div className="text-xs text-gray-600">
          STREAK
        </div>
      </div>
    </motion.div>
  )
}

export default StreakIndicator