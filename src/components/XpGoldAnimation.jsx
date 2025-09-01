import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

const XpGoldAnimation = ({ xpGained, goldGained, show, onComplete }) => {
  const [animations, setAnimations] = useState([])

  useEffect(() => {
    if (show && (xpGained > 0 || goldGained > 0)) {
      const newAnimations = []
      
      if (xpGained > 0) {
        newAnimations.push({
          id: `xp-${Date.now()}`,
          type: 'xp',
          amount: xpGained,
          color: 'text-blue-600'
        })
      }
      
      if (goldGained > 0) {
        newAnimations.push({
          id: `gold-${Date.now()}`,
          type: 'gold', 
          amount: goldGained,
          color: 'text-yellow-600'
        })
      }
      
      setAnimations(newAnimations)
      
      // Clear animations after they complete
      setTimeout(() => {
        setAnimations([])
        onComplete?.()
      }, 2000)
    }
  }, [show, xpGained, goldGained, onComplete])

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <AnimatePresence>
        {animations.map((anim, index) => (
          <motion.div
            key={anim.id}
            initial={{ 
              opacity: 0, 
              scale: 0.5, 
              y: 0,
              x: index * 60 - 30 // Offset horizontally
            }}
            animate={{ 
              opacity: [0, 1, 1, 0], 
              scale: [0.5, 1.2, 1, 1],
              y: [-20, -60, -80, -100],
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 2,
              times: [0, 0.2, 0.8, 1],
              ease: "easeOut"
            }}
            className={`text-2xl font-bold ${anim.color} flex items-center gap-2`}
          >
            {anim.type === 'xp' ? '✨' : '🪙'}
            +{anim.amount} {anim.type.toUpperCase()}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export default XpGoldAnimation