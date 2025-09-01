import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import studyModeService, { STUDY_MODES } from '../services/studyModeService'

const StudyModeSelector = ({ isOpen, onClose, onSelect, defaultMode = STUDY_MODES.NORMAL }) => {
  const [selectedMode, setSelectedMode] = useState(defaultMode)
  const [customSettings, setCustomSettings] = useState({
    questionCount: 10,
    timeLimit: 600,
    sections: []
  })

  const studyModes = Object.values(STUDY_MODES)

  const handleModeSelect = (mode) => {
    setSelectedMode(mode)
  }

  const handleConfirm = () => {
    const config = studyModeService.getStudyModeConfig(selectedMode)
    onSelect({
      mode: selectedMode,
      config: {
        ...config,
        ...customSettings
      }
    })
    onClose()
  }

  const handleCustomSettingChange = (setting, value) => {
    setCustomSettings(prev => ({
      ...prev,
      [setting]: value
    }))
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Escolha o Modo de Estudo
                </h2>
                <p className="text-gray-600 mt-1">
                  Selecione o modo que melhor se adapta ao seu objetivo de aprendizado
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex">
            {/* Mode Selection */}
            <div className="w-2/3 p-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {studyModes.map(mode => {
                  const config = studyModeService.getStudyModeConfig(mode)
                  const xpMultiplier = studyModeService.getXpMultiplier(mode)
                  
                  return (
                    <motion.div
                      key={mode}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleModeSelect(mode)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedMode === mode
                          ? `border-${config.color}-500 bg-${config.color}-50`
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="text-3xl">{config.icon}</div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 mb-1">
                            {config.name}
                            {xpMultiplier > 1.0 && (
                              <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                                +{Math.round((xpMultiplier - 1) * 100)}% XP
                              </span>
                            )}
                          </h3>
                          <p className="text-sm text-gray-600 mb-3">
                            {config.description}
                          </p>
                          
                          {/* Features */}
                          <div className="space-y-1">
                            {config.features.slice(0, 3).map((feature, index) => (
                              <div key={index} className="flex items-center text-xs text-gray-500">
                                <svg className="w-3 h-3 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                {feature}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      {/* Mode Stats */}
                      <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between text-xs text-gray-500">
                        <span>📊 {config.questionCount} questões</span>
                        {config.timeLimit && (
                          <span>⏱️ {Math.floor(config.timeLimit / 60)} min</span>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>

            {/* Selected Mode Details & Settings */}
            <div className="w-1/3 bg-gray-50 p-6 border-l border-gray-200">
              <div className="sticky top-0">
                <h3 className="font-semibold text-gray-800 mb-4">Configurações</h3>
                
                {selectedMode && (
                  <div className="space-y-4">
                    {/* Question Count */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Número de Questões
                      </label>
                      <select
                        value={customSettings.questionCount}
                        onChange={(e) => handleCustomSettingChange('questionCount', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value={5}>5 questões</option>
                        <option value={10}>10 questões</option>
                        <option value={15}>15 questões</option>
                        <option value={20}>20 questões</option>
                        <option value={30}>30 questões</option>
                      </select>
                    </div>

                    {/* Time Limit for Simulation Mode */}
                    {selectedMode === STUDY_MODES.SIMULATION && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tempo Limite (minutos)
                        </label>
                        <select
                          value={customSettings.timeLimit / 60}
                          onChange={(e) => handleCustomSettingChange('timeLimit', parseInt(e.target.value) * 60)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value={5}>5 minutos</option>
                          <option value={10}>10 minutos</option>
                          <option value={15}>15 minutos</option>
                          <option value={20}>20 minutos</option>
                          <option value={30}>30 minutos</option>
                        </select>
                      </div>
                    )}

                    {/* Mode Preview */}
                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="font-medium text-gray-800 mb-2">Resumo</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Questões:</span>
                          <span className="font-medium">{customSettings.questionCount}</span>
                        </div>
                        {selectedMode === STUDY_MODES.SIMULATION && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Tempo:</span>
                            <span className="font-medium">{customSettings.timeLimit / 60} min</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-600">Multiplicador XP:</span>
                          <span className="font-medium text-green-600">
                            x{studyModeService.getXpMultiplier(selectedMode)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      <button
                        onClick={handleConfirm}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-md transition-colors"
                      >
                        Iniciar Estudo
                      </button>
                      
                      <button
                        onClick={onClose}
                        className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default StudyModeSelector