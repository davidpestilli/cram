import { motion, AnimatePresence } from 'framer-motion'

const LevelUpNotification = ({ show, newLevel, onComplete }) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
          onClick={onComplete}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ 
              scale: [0.5, 1.1, 1], 
              opacity: 1,
              rotate: [0, 5, -5, 0]
            }}
            transition={{
              duration: 0.8,
              times: [0, 0.6, 1],
              ease: "backOut"
            }}
            className="bg-white rounded-2xl p-8 text-center shadow-2xl max-w-md mx-4"
          >
            {/* Celebration Icon */}
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="text-6xl mb-4"
            >
              🎉
            </motion.div>

            {/* Level Up Text */}
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold text-primary-600 mb-2"
            >
              LEVEL UP!
            </motion.h2>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
              className="text-5xl font-bold text-primary-800 mb-4"
            >
              {newLevel}
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-gray-600 mb-6"
            >
              Parabéns! Você subiu de nível!
            </motion.p>

            {/* Confetti Animation */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    opacity: 0,
                    scale: 0,
                    x: "50%",
                    y: "50%"
                  }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0.5],
                    x: `${50 + (Math.random() - 0.5) * 200}%`,
                    y: `${50 + (Math.random() - 0.5) * 200}%`,
                    rotate: Math.random() * 360
                  }}
                  transition={{
                    duration: 2,
                    delay: 0.2 + i * 0.1,
                    ease: "easeOut"
                  }}
                  className="absolute w-3 h-3 bg-primary-400 rounded"
                />
              ))}
            </div>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onComplete}
              className="btn-primary px-6 py-2"
            >
              Continuar
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default LevelUpNotification