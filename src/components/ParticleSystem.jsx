import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

const ParticleSystem = ({ 
  show, 
  type = 'success', // success, error, critical
  duration = 2000,
  onComplete,
  particleCount = 8
}) => {
  const [particles, setParticles] = useState([])

  useEffect(() => {
    if (show) {
      generateParticles()
      
      const timeout = setTimeout(() => {
        setParticles([])
        onComplete?.()
      }, duration)

      return () => clearTimeout(timeout)
    }
  }, [show, type, duration, particleCount, onComplete])

  const generateParticles = () => {
    const newParticles = [...Array(particleCount)].map((_, i) => ({
      id: i,
      color: getParticleColor(type),
      size: Math.random() * 8 + 4,
      startX: 50 + (Math.random() - 0.5) * 20,
      startY: 50 + (Math.random() - 0.5) * 20,
      endX: 50 + (Math.random() - 0.5) * 100,
      endY: 30 + Math.random() * 40,
      rotation: Math.random() * 360,
      delay: i * 50
    }))
    
    setParticles(newParticles)
  }

  const getParticleColor = (type) => {
    const colors = {
      success: ['bg-green-400', 'bg-emerald-400', 'bg-teal-400'],
      error: ['bg-red-400', 'bg-rose-400', 'bg-pink-400'],
      critical: ['bg-yellow-400', 'bg-orange-400', 'bg-amber-400'],
      levelup: ['bg-purple-400', 'bg-indigo-400', 'bg-blue-400']
    }
    
    const typeColors = colors[type] || colors.success
    return typeColors[Math.floor(Math.random() * typeColors.length)]
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className={`absolute ${particle.color} rounded-full`}
            style={{
              width: particle.size,
              height: particle.size,
              left: `${particle.startX}%`,
              top: `${particle.startY}%`
            }}
            initial={{
              opacity: 0,
              scale: 0,
              rotate: 0
            }}
            animate={{
              opacity: [0, 1, 1, 0],
              scale: [0, 1.2, 1, 0.8],
              x: (particle.endX - particle.startX) * 8,
              y: -(particle.endY + 100),
              rotate: particle.rotation
            }}
            transition={{
              duration: duration / 1000,
              delay: particle.delay / 1000,
              ease: "easeOut"
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

export default ParticleSystem