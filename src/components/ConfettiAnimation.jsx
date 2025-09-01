import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const ConfettiAnimation = ({ show, accuracy }) => {
  const [particles, setParticles] = useState([])

  useEffect(() => {
    if (show && accuracy >= 70) {
      // Generate confetti particles
      const newParticles = [...Array(15)].map((_, i) => ({
        id: i,
        color: ['bg-blue-400', 'bg-green-400', 'bg-yellow-400', 'bg-red-400', 'bg-purple-400'][Math.floor(Math.random() * 5)],
        startX: Math.random() * 100,
        startY: -10,
        endX: Math.random() * 100,
        endY: 110,
        rotation: Math.random() * 360,
        size: Math.random() * 8 + 4
      }))
      
      setParticles(newParticles)
      
      // Clear particles after animation
      setTimeout(() => {
        setParticles([])
      }, 3000)
    }
  }, [show, accuracy])

  if (!show || accuracy < 70) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className={`absolute ${particle.color} rounded-sm`}
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.startX}%`,
            top: `${particle.startY}%`
          }}
          initial={{
            x: 0,
            y: 0,
            rotate: 0,
            opacity: 1
          }}
          animate={{
            x: (particle.endX - particle.startX) * 10,
            y: window.innerHeight * 1.2,
            rotate: particle.rotation,
            opacity: [1, 1, 0.8, 0]
          }}
          transition={{
            duration: 3,
            ease: "easeOut"
          }}
        />
      ))}
    </div>
  )
}

export default ConfettiAnimation