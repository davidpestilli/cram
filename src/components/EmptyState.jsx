import { motion } from 'framer-motion'

const EmptyState = ({
  icon = '📦',
  title = 'Nenhum item encontrado',
  description = 'Não há items para exibir no momento.',
  actionText,
  actionHref,
  onAction,
  className = ''
}) => {
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  }

  const iconVariants = {
    idle: {
      scale: 1,
      rotate: 0
    },
    hover: {
      scale: 1.1,
      rotate: [0, 5, -5, 0],
      transition: {
        duration: 0.5
      }
    }
  }

  return (
    <motion.div
      className={`text-center py-12 ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        className="text-6xl mb-6"
        variants={iconVariants}
        initial="idle"
        whileHover="hover"
      >
        {icon}
      </motion.div>
      
      <motion.h3
        className="text-xl font-semibold text-gray-900 mb-3"
        variants={itemVariants}
      >
        {title}
      </motion.h3>
      
      <motion.p
        className="text-gray-600 mb-6 max-w-md mx-auto"
        variants={itemVariants}
      >
        {description}
      </motion.p>

      {(actionText && (actionHref || onAction)) && (
        <motion.div variants={itemVariants}>
          {actionHref ? (
            <motion.a
              href={actionHref}
              className="btn-primary inline-block"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {actionText}
            </motion.a>
          ) : (
            <motion.button
              onClick={onAction}
              className="btn-primary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {actionText}
            </motion.button>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}

export default EmptyState