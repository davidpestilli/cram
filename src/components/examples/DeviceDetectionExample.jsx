import React from 'react'
import { 
  useIsMobile, 
  useIsTablet, 
  useIsDesktop,
  useOrientation,
  useDeviceType,
  useMediaQuery,
  useIsPhysicalMobile,
  useIsPhysicalTablet,
  useIsPhysicalDesktop,
  useIsTouchDevice
} from '../../hooks/useMediaQuery'

/**
 * Componente de exemplo mostrando como usar os hooks de detecção de dispositivo
 */
const DeviceDetectionExample = () => {
  // Detecção por tamanho de tela (responsiva)
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const isDesktop = useIsDesktop()
  
  // Detecção por dispositivo físico (mais precisa)
  const isPhysicalMobile = useIsPhysicalMobile()
  const isPhysicalTablet = useIsPhysicalTablet()
  const isPhysicalDesktop = useIsPhysicalDesktop()
  const isTouchDevice = useIsTouchDevice()
  
  const orientation = useOrientation()
  const deviceInfo = useDeviceType()
  
  // Exemplo de media query customizada
  const isVerySmall = useMediaQuery('(max-width: 480px)')
  const isLandscape = useMediaQuery('(orientation: landscape)')
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

  // Exemplos de uso condicional baseado no dispositivo
  const getLayoutClass = () => {
    if (isMobile) return 'grid-cols-1 gap-2 p-2'
    if (isTablet) return 'grid-cols-2 gap-4 p-4'
    return 'grid-cols-3 gap-6 p-6'
  }

  const getButtonSize = () => {
    if (isMobile) return 'px-6 py-3 text-base' // Maior para touch
    return 'px-4 py-2 text-sm'
  }

  const shouldShowTooltip = () => {
    // Não mostrar tooltips em mobile (touch devices não têm hover)
    return !isMobile
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Device Detection Examples</h1>
      
      {/* Informações do Dispositivo */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-4">Device Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p><strong>📐 Screen Size (Responsive):</strong></p>
            <ul className="ml-4">
              <li>Mobile: {isMobile ? '✅ Yes' : '❌ No'}</li>
              <li>Tablet: {isTablet ? '✅ Yes' : '❌ No'}</li>
              <li>Desktop: {isDesktop ? '✅ Yes' : '❌ No'}</li>
              <li>Very Small: {isVerySmall ? '✅ Yes' : '❌ No'}</li>
            </ul>
          </div>
          
          <div>
            <p><strong>📱 Physical Device:</strong></p>
            <ul className="ml-4">
              <li>📱 Mobile: {isPhysicalMobile ? '✅ Yes' : '❌ No'}</li>
              <li>📱 Tablet: {isPhysicalTablet ? '✅ Yes' : '❌ No'}</li>
              <li>💻 Desktop: {isPhysicalDesktop ? '✅ Yes' : '❌ No'}</li>
              <li>👆 Touch Device: {isTouchDevice ? '✅ Yes' : '❌ No'}</li>
            </ul>
          </div>

          <div>
            <p><strong>🔧 Device Capabilities:</strong></p>
            <ul className="ml-4">
              <li>Touch: {deviceInfo.hasTouch ? '✅ Yes' : '❌ No'}</li>
              <li>Hover: {deviceInfo.hasHover ? '✅ Yes' : '❌ No'}</li>
              <li>Fine Pointer: {deviceInfo.hasFinePointer ? '✅ Yes' : '❌ No'}</li>
              <li>Max Touch: {deviceInfo.maxTouchPoints}</li>
            </ul>
          </div>
          
          <div>
            <p><strong>Orientation & Preferences:</strong></p>
            <ul className="ml-4">
              <li>Orientation: {orientation}</li>
              <li>Landscape: {isLandscape ? '✅ Yes' : '❌ No'}</li>
              <li>Reduced Motion: {prefersReducedMotion ? '✅ Yes' : '❌ No'}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Explicação das Diferenças */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-3 text-blue-800">📚 Diferenças entre Detecção</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h3 className="font-medium text-blue-700 mb-2">📐 Screen Size (Responsive)</h3>
            <p className="text-blue-600">
              Baseado apenas no <strong>tamanho da janela</strong>. Muda quando você redimensiona o navegador.
              Útil para layouts responsivos.
            </p>
            <p className="text-xs text-blue-500 mt-1">
              Exemplo: Desktop com janela pequena = "Mobile"
            </p>
          </div>
          <div>
            <h3 className="font-medium text-blue-700 mb-2">📱 Physical Device</h3>
            <p className="text-blue-600">
              Baseado no <strong>dispositivo real</strong> (touch, hover, User Agent). 
              Não muda com redimensionamento. Útil para comportamentos específicos.
            </p>
            <p className="text-xs text-blue-500 mt-1">
              Exemplo: iPhone sempre será "Physical Mobile" independente da orientação
            </p>
          </div>
        </div>
      </div>

      {/* Exemplo de Layout Responsivo */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Responsive Layout Example</h2>
        <div className={`grid ${getLayoutClass()}`}>
          {[1, 2, 3, 4, 5, 6].map(num => (
            <div key={num} className="bg-blue-100 p-4 rounded">
              <h3 className="font-medium">Card {num}</h3>
              <p className="text-sm text-gray-600 mt-2">
                {isMobile && 'Mobile layout - full width'}
                {isTablet && 'Tablet layout - 2 columns'}  
                {isDesktop && 'Desktop layout - 3 columns'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Exemplo de Botões Touch-Friendly */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Touch-Friendly Buttons</h2>
        <div className="flex flex-wrap gap-2">
          <button className={`bg-blue-500 text-white rounded ${getButtonSize()}`}>
            Primary Action
          </button>
          <button className={`bg-gray-500 text-white rounded ${getButtonSize()}`}>
            Secondary Action
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {isMobile ? 'Buttons are larger for touch devices' : 'Standard button size for desktop'}
        </p>
      </div>

      {/* Exemplo de Conteúdo Condicional */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Conditional Content</h2>
        
        {isMobile && (
          <div className="bg-yellow-100 p-3 rounded mb-3">
            <p className="text-sm">📱 <strong>Mobile users:</strong> Swipe left/right to navigate</p>
          </div>
        )}
        
        {isDesktop && (
          <div className="bg-green-100 p-3 rounded mb-3">
            <p className="text-sm">🖥️ <strong>Desktop users:</strong> Use keyboard shortcuts (Ctrl+N for new)</p>
          </div>
        )}

        {shouldShowTooltip() && (
          <div className="bg-purple-100 p-3 rounded">
            <p className="text-sm">💡 Tooltips are enabled (hover support detected)</p>
          </div>
        )}
      </div>

      {/* Exemplo de Diferentes Comportamentos por Dispositivo */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Device-Specific Features</h2>
        
        {deviceInfo.isIOS && (
          <p className="text-sm bg-gray-100 p-2 rounded">
            🍎 iOS specific features could be enabled here
          </p>
        )}
        
        {deviceInfo.isAndroid && (
          <p className="text-sm bg-gray-100 p-2 rounded">
            🤖 Android specific features could be enabled here  
          </p>
        )}

        {orientation === 'landscape' && isMobile && (
          <p className="text-sm bg-orange-100 p-2 rounded mt-2">
            📱➡️ Landscape mode detected - optimized layout could be shown
          </p>
        )}
      </div>

      {/* Debug Info */}
      <details className="bg-gray-50 p-4 rounded">
        <summary className="font-medium cursor-pointer">Debug Information</summary>
        <pre className="text-xs mt-2 overflow-auto">
          {JSON.stringify({
            isMobile,
            isTablet, 
            isDesktop,
            orientation,
            deviceInfo,
            isVerySmall,
            isLandscape,
            prefersReducedMotion,
            windowSize: typeof window !== 'undefined' ? {
              width: window.innerWidth,
              height: window.innerHeight
            } : 'SSR'
          }, null, 2)}
        </pre>
      </details>
    </div>
  )
}

export default DeviceDetectionExample