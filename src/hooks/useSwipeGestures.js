import { useState, useRef, useCallback } from 'react'

/**
 * Hook para detectar gestos de swipe em dispositivos touch
 * @param {Object} options - Opções de configuração
 * @returns {Object} - Handlers e estado do swipe
 */
export const useSwipeGestures = (options = {}) => {
  const {
    onSwipeLeft = () => {},
    onSwipeRight = () => {},
    onSwipeUp = () => {},
    onSwipeDown = () => {},
    threshold = 50, // Distância mínima para considerar swipe
    velocity = 0.3, // Velocidade mínima
    preventDefault = false,
    disabled = false
  } = options

  const [isSwipeInProgress, setIsSwipeInProgress] = useState(false)
  const touchStartRef = useRef(null)
  const touchStartTimeRef = useRef(null)

  const handleTouchStart = useCallback((e) => {
    if (disabled) return

    const touch = e.touches[0]
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY
    }
    touchStartTimeRef.current = Date.now()
    setIsSwipeInProgress(true)

    if (preventDefault) {
      e.preventDefault()
    }
  }, [disabled, preventDefault])

  const handleTouchMove = useCallback((e) => {
    if (disabled || !touchStartRef.current) return

    if (preventDefault) {
      e.preventDefault()
    }
  }, [disabled, preventDefault])

  const handleTouchEnd = useCallback((e) => {
    if (disabled || !touchStartRef.current || !touchStartTimeRef.current) {
      setIsSwipeInProgress(false)
      return
    }

    const touch = e.changedTouches[0]
    const touchEnd = {
      x: touch.clientX,
      y: touch.clientY
    }

    const deltaX = touchEnd.x - touchStartRef.current.x
    const deltaY = touchEnd.y - touchStartRef.current.y
    const deltaTime = Date.now() - touchStartTimeRef.current

    // Calcular distância e velocidade
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    const calculatedVelocity = distance / deltaTime

    // Verificar se atende aos critérios mínimos
    if (distance >= threshold && calculatedVelocity >= velocity) {
      // Determinar direção principal
      const absDeltaX = Math.abs(deltaX)
      const absDeltaY = Math.abs(deltaY)

      if (absDeltaX > absDeltaY) {
        // Swipe horizontal
        if (deltaX > 0) {
          onSwipeRight(e, { deltaX, deltaY, distance, velocity: calculatedVelocity })
        } else {
          onSwipeLeft(e, { deltaX, deltaY, distance, velocity: calculatedVelocity })
        }
      } else {
        // Swipe vertical
        if (deltaY > 0) {
          onSwipeDown(e, { deltaX, deltaY, distance, velocity: calculatedVelocity })
        } else {
          onSwipeUp(e, { deltaX, deltaY, distance, velocity: calculatedVelocity })
        }
      }
    }

    // Reset
    touchStartRef.current = null
    touchStartTimeRef.current = null
    setIsSwipeInProgress(false)

    if (preventDefault) {
      e.preventDefault()
    }
  }, [disabled, threshold, velocity, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, preventDefault])

  const handleTouchCancel = useCallback((e) => {
    touchStartRef.current = null
    touchStartTimeRef.current = null
    setIsSwipeInProgress(false)

    if (preventDefault) {
      e.preventDefault()
    }
  }, [preventDefault])

  // Return handlers e estado
  return {
    // Handlers para adicionar aos elementos
    swipeHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchCancel
    },
    
    // Estado do swipe
    isSwipeInProgress,
    
    // Função helper para aplicar todos os handlers de uma vez
    bindSwipe: (element) => ({
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchCancel
    })
  }
}

/**
 * Hook simplificado para swipe horizontal (navegação)
 * @param {Function} onSwipeLeft - Callback para swipe left (próximo)
 * @param {Function} onSwipeRight - Callback para swipe right (anterior)
 * @param {Object} options - Opções adicionais
 */
export const useHorizontalSwipe = (onSwipeLeft, onSwipeRight, options = {}) => {
  return useSwipeGestures({
    onSwipeLeft,
    onSwipeRight,
    ...options
  })
}

/**
 * Hook simplificado para swipe vertical
 * @param {Function} onSwipeUp - Callback para swipe up
 * @param {Function} onSwipeDown - Callback para swipe down  
 * @param {Object} options - Opções adicionais
 */
export const useVerticalSwipe = (onSwipeUp, onSwipeDown, options = {}) => {
  return useSwipeGestures({
    onSwipeUp,
    onSwipeDown,
    ...options
  })
}

export default useSwipeGestures