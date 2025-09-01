import { motion } from 'framer-motion'

const Avatar = ({ 
  profile, 
  size = 'md', 
  showAnimation = false,
  className = '',
  equippedItems = {},
  celebrationType = null, // 'idle', 'celebration', 'error', 'levelup'
  onAnimationComplete
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12', 
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
    '2xl': 'w-32 h-32'
  }

  const getAvatarSprite = () => {
    const { avatar_class = 'estudante', avatar_gender = 'masculino' } = profile || {}
    
    // Pixel art sprites por classe
    const sprites = {
      estudante: '/sprites/avatars/swordsman_idle.png',
      advogado: '/sprites/avatars/gangster1_idle.png',
      juiz: '/sprites/avatars/gangster2_idle.png',
      promotor: '/sprites/avatars/gangster3_idle.png',
      delegado: '/sprites/avatars/gangster1_idle.png',
      procurador: '/sprites/avatars/swordsman_idle.png'
    }

    return sprites[avatar_class] || sprites.estudante
  }

  const getClassColor = () => {
    const { avatar_class = 'estudante' } = profile || {}
    
    const colors = {
      estudante: 'bg-blue-100 border-blue-300',
      advogado: 'bg-green-100 border-green-300',
      juiz: 'bg-purple-100 border-purple-300', 
      promotor: 'bg-red-100 border-red-300',
      delegado: 'bg-gray-100 border-gray-300',
      procurador: 'bg-yellow-100 border-yellow-300'
    }

    return colors[avatar_class] || colors.estudante
  }

  const getClassBadge = () => {
    const { avatar_class = 'estudante' } = profile || {}
    
    const badges = {
      estudante: '📚',
      advogado: '⚖️',
      juiz: '⚖️',
      promotor: '🔍',
      delegado: '🛡️',
      procurador: '📋'
    }

    return badges[avatar_class] || badges.estudante
  }

  const avatarContent = (
    <div className={`${sizeClasses[size]} ${getClassColor()} rounded-lg border-2 flex items-center justify-center relative overflow-hidden ${className}`}>
      {/* Avatar Sprite */}
      <img 
        src={getAvatarSprite()}
        alt="Avatar"
        className="w-full h-full object-cover pixelated"
        style={{ imageRendering: 'pixelated' }}
        onError={(e) => {
          // Fallback to emoji if sprite fails to load
          e.target.style.display = 'none'
          e.target.nextSibling.style.display = 'block'
        }}
      />
      {/* Fallback Emoji */}
      <span 
        className={`${size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : size === 'lg' ? 'text-lg' : size === 'xl' ? 'text-2xl' : 'text-3xl'} hidden`}
        style={{ display: 'none' }}
      >
        👤
      </span>
      
      {/* Class Badge */}
      {size !== 'sm' && (
        <div className="absolute -bottom-1 -right-1 bg-white rounded-full border border-gray-200 p-0.5">
          <span className="text-xs">{getClassBadge()}</span>
        </div>
      )}

      {/* Equipment Overlays */}
      {equippedItems.weapon && (
        <div className="absolute -top-1 -right-1">
          <span className="text-xs">⚔️</span>
        </div>
      )}

      {equippedItems.armor && (
        <div className="absolute -top-1 -left-1">
          <span className="text-xs">🛡️</span>
        </div>
      )}
    </div>
  )

  const getAnimationVariants = () => {
    switch (celebrationType) {
      case 'celebration':
        return {
          animate: {
            scale: [1, 1.2, 1.1, 1],
            rotate: [0, 10, -10, 5, -5, 0],
            y: [0, -10, -5, 0]
          },
          transition: {
            duration: 1,
            ease: "backOut",
            onComplete: onAnimationComplete
          }
        }
      
      case 'error':
        return {
          animate: {
            x: [-3, 3, -3, 3, -2, 2, 0],
            scale: [1, 0.95, 1]
          },
          transition: {
            duration: 0.5,
            ease: "easeInOut",
            onComplete: onAnimationComplete
          }
        }
      
      case 'levelup':
        return {
          animate: {
            scale: [1, 1.3, 1.2, 1.1, 1],
            rotate: [0, 360],
            boxShadow: [
              "0 0 0px rgba(59, 130, 246, 0)",
              "0 0 20px rgba(59, 130, 246, 0.8)",
              "0 0 40px rgba(59, 130, 246, 0.4)",
              "0 0 0px rgba(59, 130, 246, 0)"
            ]
          },
          transition: {
            duration: 2,
            ease: "easeOut",
            onComplete: onAnimationComplete
          }
        }
      
      case 'idle':
      default:
        return showAnimation ? {
          animate: {
            scale: [1, 1.02, 1],
            rotate: [0, 1, -1, 0]
          },
          transition: {
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }
        } : {}
    }
  }

  const animationProps = getAnimationVariants()

  if (showAnimation || celebrationType) {
    return (
      <motion.div {...animationProps}>
        {avatarContent}
      </motion.div>
    )
  }

  return avatarContent
}

export default Avatar