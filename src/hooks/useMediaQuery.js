import { useState, useEffect } from 'react'

/**
 * Hook personalizado para media queries
 * @param {string} query - A media query CSS (ex: "(max-width: 768px)")
 * @returns {boolean} - Se a media query corresponde ou não
 */
export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    // Verificar se window.matchMedia está disponível (SSR safety)
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia(query)
    
    // Set inicial
    setMatches(mediaQuery.matches)

    // Event listener para mudanças
    const handler = (event) => setMatches(event.matches)
    
    // Usar addEventListener se disponível (método moderno)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    } else {
      // Fallback para browsers antigos
      mediaQuery.addListener(handler)
      return () => mediaQuery.removeListener(handler)
    }
  }, [query])

  return matches
}

/**
 * Hook específico para detectar dispositivos móveis
 * @returns {boolean} - True se for mobile (< 768px)
 */
export const useIsMobile = () => {
  return useMediaQuery('(max-width: 767px)')
}

/**
 * Hook específico para detectar tablets
 * @returns {boolean} - True se for tablet (768px - 1023px)
 */
export const useIsTablet = () => {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)')
}

/**
 * Hook específico para detectar desktop
 * @returns {boolean} - True se for desktop (>= 1024px)
 */
export const useIsDesktop = () => {
  return useMediaQuery('(min-width: 1024px)')
}

/**
 * Hook para detectar orientação
 * @returns {string} - 'portrait' ou 'landscape'
 */
export const useOrientation = () => {
  const [orientation, setOrientation] = useState('portrait')

  useEffect(() => {
    if (typeof window === 'undefined') return

    const updateOrientation = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape')
    }

    updateOrientation()
    window.addEventListener('resize', updateOrientation)
    window.addEventListener('orientationchange', updateOrientation)

    return () => {
      window.removeEventListener('resize', updateOrientation)
      window.removeEventListener('orientationchange', updateOrientation)
    }
  }, [])

  return orientation
}

/**
 * Hook para detectar tipo de dispositivo FÍSICO baseado em capacidades e User Agent
 * Diferencia dispositivos reais (desktop/notebook vs celular/tablet)
 * @returns {object} - Objeto com informações do dispositivo físico
 */
export const useDeviceType = () => {
  const [deviceInfo, setDeviceInfo] = useState({
    // Tipo de dispositivo físico
    isPhysicalMobile: false,    // Celular
    isPhysicalTablet: false,    // Tablet  
    isPhysicalDesktop: true,    // Desktop/Notebook
    
    // Capacidades do dispositivo
    hasTouch: false,           // Suporte a touch
    hasHover: false,           // Suporte a hover (mouse)
    hasFinePointer: false,     // Pointer preciso (mouse/trackpad)
    hasCoarsePointer: false,   // Pointer impreciso (touch)
    
    // Sistema operacional
    isIOS: false,
    isAndroid: false,
    isWindows: false,
    isMacOS: false,
    
    // Informações extras
    userAgent: '',
    maxTouchPoints: 0
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const userAgent = navigator.userAgent
    const maxTouchPoints = navigator.maxTouchPoints || 0
    
    // Detectar capacidades do dispositivo via CSS Media Queries
    const hasTouch = window.matchMedia('(pointer: coarse)').matches || maxTouchPoints > 0
    const hasHover = window.matchMedia('(hover: hover)').matches
    const hasFinePointer = window.matchMedia('(pointer: fine)').matches
    const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches
    
    // Detectar sistema operacional
    const isIOS = /iPad|iPhone|iPod/.test(userAgent)
    const isAndroid = /Android/i.test(userAgent)
    const isWindows = /Windows/i.test(userAgent)
    const isMacOS = /Macintosh|Mac OS X/i.test(userAgent)
    
    // Lógica para determinar tipo de dispositivo físico
    let isPhysicalMobile = false
    let isPhysicalTablet = false
    let isPhysicalDesktop = true
    
    // Celulares: Touch primário + sem hover confiável + user agent mobile
    if (hasCoarsePointer && !hasHover && /iPhone|Android.*Mobile|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
      isPhysicalMobile = true
      isPhysicalDesktop = false
    }
    // Tablets: Touch + tela grande OU iPad/Android tablet específico
    else if ((hasTouch && window.innerWidth >= 768) || /iPad|Android(?!.*Mobile)/i.test(userAgent)) {
      isPhysicalTablet = true
      isPhysicalDesktop = false
    }
    // Desktop/Notebook: Hover confiável + pointer fino OU não é mobile/tablet
    else if (hasHover && hasFinePointer) {
      isPhysicalDesktop = true
    }
    // Fallback: Se tem Windows/Mac e não é claramente mobile, é desktop
    else if ((isWindows || isMacOS) && !hasCoarsePointer) {
      isPhysicalDesktop = true
    }
    
    setDeviceInfo({
      isPhysicalMobile,
      isPhysicalTablet,
      isPhysicalDesktop,
      hasTouch,
      hasHover,
      hasFinePointer,
      hasCoarsePointer,
      isIOS,
      isAndroid,
      isWindows,
      isMacOS,
      userAgent,
      maxTouchPoints
    })
  }, [])

  return deviceInfo
}

/**
 * Hooks simplificados para tipos de dispositivo físico
 */
export const useIsPhysicalMobile = () => {
  const { isPhysicalMobile } = useDeviceType()
  return isPhysicalMobile
}

export const useIsPhysicalTablet = () => {
  const { isPhysicalTablet } = useDeviceType()
  return isPhysicalTablet
}

export const useIsPhysicalDesktop = () => {
  const { isPhysicalDesktop } = useDeviceType()
  return isPhysicalDesktop
}

/**
 * Hook para detectar se é um dispositivo touch (mobile OU tablet)
 */
export const useIsTouchDevice = () => {
  const { isPhysicalMobile, isPhysicalTablet } = useDeviceType()
  return isPhysicalMobile || isPhysicalTablet
}

export default useMediaQuery