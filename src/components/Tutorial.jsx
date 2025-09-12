import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useIsTouchDevice, useIsPhysicalMobile } from '../hooks/useMediaQuery'
import { useHorizontalSwipe } from '../hooks/useSwipeGestures'

const Tutorial = ({ isOpen, onClose, steps = [] }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const isTouchDevice = useIsTouchDevice()
  const isPhysicalMobile = useIsPhysicalMobile()
  
  // Swipe gestures para navegação (apenas em dispositivos touch)
  const { swipeHandlers } = useHorizontalSwipe(
    () => handleNext(), // Swipe left = próximo
    () => handlePrevious(), // Swipe right = anterior
    { disabled: !isTouchDevice }
  )

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      setCurrentStep(0)
    }
  }, [isOpen])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleClose()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => {
      onClose()
    }, 300)
  }

  const handleSkip = () => {
    handleClose()
  }

  if (!isOpen) return null

  const currentStepData = steps[currentStep]

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 z-50 bg-black/60 flex items-center justify-center ${
            isPhysicalMobile ? 'p-2' : 'p-4'
          }`}
        >
          <motion.div
            initial={{ 
              scale: isPhysicalMobile ? 0.9 : 0.8, 
              opacity: 0,
              y: isPhysicalMobile ? 50 : 0 
            }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ 
              scale: isPhysicalMobile ? 0.9 : 0.8, 
              opacity: 0,
              y: isPhysicalMobile ? 50 : 0
            }}
            className={`bg-white shadow-2xl w-full relative ${
              isPhysicalMobile 
                ? 'rounded-t-xl max-w-full max-h-[90vh] overflow-auto p-4' // Mobile: full width, rounded top
                : 'rounded-xl max-w-md p-6' // Desktop: centered modal
            }`}
            style={isPhysicalMobile ? { 
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0
            } : {}}
            {...(isTouchDevice ? swipeHandlers : {})}
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Step Counter */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                Tutorial
              </h2>
              <span className="text-sm text-gray-500">
                {currentStep + 1} de {steps.length}
              </span>
            </div>

            {/* Step Content */}
            <div className="mb-6">
              {currentStepData?.icon && (
                <div className="mb-4 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-2xl">{currentStepData.icon}</span>
                  </div>
                </div>
              )}
              
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {currentStepData?.title}
              </h3>
              
              <p className="text-gray-600 leading-relaxed">
                {currentStepData?.description}
              </p>

              {currentStepData?.image && (
                <div className="mt-4 text-center">
                  <img 
                    src={currentStepData.image} 
                    alt={currentStepData.title}
                    className="rounded-lg shadow-md max-w-full h-auto"
                  />
                </div>
              )}
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex space-x-2">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 flex-1 rounded-full transition-colors ${
                      index <= currentStep ? 'bg-blue-500' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              
              {/* Swipe Indication - Mobile Only */}
              {isTouchDevice && (
                <div className="flex items-center justify-center mt-3">
                  <div className="flex items-center text-xs text-gray-400">
                    <span>👈</span>
                    <span className="mx-2">Deslize para navegar</span>
                    <span>👉</span>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation - Touch Optimized */}
            <div className={`flex justify-between items-center ${
              isPhysicalMobile ? 'gap-3' : ''
            }`}>
              <div className={`flex ${isPhysicalMobile ? 'gap-3' : 'space-x-2'}`}>
                {currentStep > 0 && (
                  <button
                    onClick={handlePrevious}
                    className={`text-gray-600 hover:text-gray-800 transition-colors ${
                      isTouchDevice 
                        ? 'min-h-[44px] px-4 py-3 text-base' 
                        : 'px-4 py-2'
                    }`}
                  >
                    Anterior
                  </button>
                )}
                <button
                  onClick={handleSkip}
                  className={`text-gray-500 hover:text-gray-700 transition-colors ${
                    isTouchDevice 
                      ? 'min-h-[44px] px-4 py-3 text-base' 
                      : 'px-4 py-2'
                  }`}
                >
                  Pular
                </button>
              </div>

              <button
                onClick={handleNext}
                className={`bg-blue-500 hover:bg-blue-600 text-white rounded-md font-medium transition-colors ${
                  isTouchDevice 
                    ? 'min-h-[44px] px-6 py-3 text-base' 
                    : 'px-6 py-2'
                }`}
              >
                {currentStep < steps.length - 1 ? 'Próximo' : 'Finalizar'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default Tutorial