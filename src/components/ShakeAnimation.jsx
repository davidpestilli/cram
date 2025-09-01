import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

const ShakeAnimation = ({ 
  children, 
  trigger, 
  intensity = 10,
  duration = 0.6
}) => {
  const [isShaking, setIsShaking] = useState(false)

  useEffect(() => {
    if (trigger) {
      setIsShaking(true)
      const timeout = setTimeout(() => {
        setIsShaking(false)
      }, duration * 1000)

      return () => clearTimeout(timeout)
    }
  }, [trigger, duration])

  const shakeVariants = {
    shake: {
      x: [-intensity, intensity, -intensity, intensity, -intensity/2, intensity/2, 0],
      transition: {
        duration: duration,
        ease: "easeInOut"
      }
    },
    static: {
      x: 0
    }
  }

  return (
    <motion.div
      variants={shakeVariants}
      animate={isShaking ? "shake" : "static"}
    >
      {children}
    </motion.div>
  )
}

export default ShakeAnimation