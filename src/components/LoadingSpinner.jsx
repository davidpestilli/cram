import { motion } from 'framer-motion'

const LoadingSpinner = ({ 
  size = 'md', 
  color = 'primary',
  text = 'Carregando...',
  showText = true,
  type = 'spinner' // spinner, dots, pulse, bars
}) => {
  const sizeClasses = {
    sm: { spinner: 'w-4 h-4', dot: 'w-2 h-2' },
    md: { spinner: 'w-8 h-8', dot: 'w-3 h-3' },
    lg: { spinner: 'w-12 h-12', dot: 'w-4 h-4' },
    xl: { spinner: 'w-16 h-16', dot: 'w-5 h-5' }
  }

  const colorClasses = {
    primary: 'border-primary-600',
    blue: 'border-blue-600',
    green: 'border-green-600',
    red: 'border-red-600',
    white: 'border-white'
  }

  const dotColors = {
    primary: 'bg-primary-600',
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    white: 'bg-white'
  }

  const renderSpinner = () => {
    switch (type) {
      case 'dots':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className={`${sizeClasses[size].dot} ${dotColors[color]} rounded-full`}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        )

      case 'pulse':
        return (
          <motion.div
            className={`${sizeClasses[size].spinner} ${dotColors[color]} rounded-full`}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [1, 0.7, 1]
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )

      case 'bars':
        return (
          <div className="flex space-x-1 items-end">
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className={`w-1 ${dotColors[color]} rounded-full`}
                style={{ height: '16px' }}
                animate={{
                  scaleY: [1, 2, 1]
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.1,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        )

      case 'spinner':
      default:
        return (
          <div 
            className={`${sizeClasses[size].spinner} border-2 ${colorClasses[color]} border-t-transparent rounded-full animate-spin`}
          />
        )
    }
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      {renderSpinner()}
      {showText && (
        <motion.p
          className="text-gray-600 text-sm"
          animate={{
            opacity: [0.6, 1, 0.6]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {text}
        </motion.p>
      )}
    </div>
  )
}

export default LoadingSpinner