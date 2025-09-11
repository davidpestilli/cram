import { useState } from 'react'
import Layout from '../components/Layout/Layout'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

const Profile = () => {
  const { profile, resetProgressData, deleteAllCramData, signOut } = useAuth()
  const navigate = useNavigate()
  
  const [showDangerZone, setShowDangerZone] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [activeConfirmation, setActiveConfirmation] = useState(null)

  const getXpForNextLevel = (level) => {
    return level * 1000
  }

  const getXpProgress = () => {
    if (!profile) return 0
    const currentLevelXp = (profile.level - 1) * 1000
    const nextLevelXp = profile.level * 1000
    const progressXp = profile.xp - currentLevelXp
    const neededXp = nextLevelXp - currentLevelXp
    return Math.round((progressXp / neededXp) * 100)
  }

  const getClassInfo = (className) => {
    const classes = {
      estudante: { name: 'Estudante', bonus: '+5% XP geral', icon: '🎓' },
      advogado: { name: 'Advogado', bonus: '+15% Direito Civil', icon: '⚖️' },
      juiz: { name: 'Juiz', bonus: '+15% Processo Civil', icon: '👨‍⚖️' },
      promotor: { name: 'Promotor', bonus: '+15% Direito Penal', icon: '🔍' },
      delegado: { name: 'Delegado', bonus: '+15% Processo Penal', icon: '👮‍♂️' },
      procurador: { name: 'Procurador', bonus: '+15% Direito Administrativo', icon: '🏛️' }
    }
    return classes[className] || classes.estudante
  }

  const handleResetProgress = async () => {
    if (confirmText !== 'RESETAR PROGRESSO') {
      alert('Digite exatamente "RESETAR PROGRESSO" para confirmar')
      return
    }

    setIsLoading(true)
    try {
      const result = await resetProgressData()
      if (result.success) {
        alert('Progresso resetado com sucesso! Você voltou ao nível 1.')
        setActiveConfirmation(null)
        setConfirmText('')
      } else {
        alert('Erro ao resetar progresso. Tente novamente.')
      }
    } catch (error) {
      alert('Erro inesperado. Tente novamente.')
    }
    setIsLoading(false)
  }

  const handleDeleteAccount = async () => {
    if (confirmText !== 'EXCLUIR CONTA CRAM') {
      alert('Digite exatamente "EXCLUIR CONTA CRAM" para confirmar')
      return
    }

    setIsLoading(true)
    try {
      const result = await deleteAllCramData()
      if (result.success) {
        alert('Conta do CRAM excluída com sucesso! Você será deslogado.')
        // Fazer logout completo para evitar conflito com ProtectedRoute
        await signOut()
        // O ProtectedRoute automaticamente redirecionará para /login
      } else {
        alert('Erro ao excluir conta. Tente novamente.')
      }
    } catch (error) {
      alert('Erro inesperado. Tente novamente.')
    }
    setIsLoading(false)
  }

  const openConfirmation = (action) => {
    setActiveConfirmation(action)
    setConfirmText('')
  }

  const closeConfirmation = () => {
    setActiveConfirmation(null)
    setConfirmText('')
  }

  if (!profile) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        </div>
      </Layout>
    )
  }

  const classInfo = getClassInfo(profile.avatar_class)

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Perfil do Jogador
          </h1>
          <p className="text-gray-600">
            Acompanhe seu progresso e estatísticas
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Avatar & Basic Info */}
          <div className="lg:col-span-1">
            <div className="card p-6">
              <div className="text-center">
                {/* Avatar Placeholder */}
                <div className="w-32 h-32 bg-primary-600 rounded-full mx-auto mb-4 flex items-center justify-center text-6xl text-white font-bold">
                  {profile.username[0].toUpperCase()}
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  {profile.username}
                </h2>
                
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <span className="text-2xl">{classInfo.icon}</span>
                  <span className="text-gray-600 capitalize">
                    {classInfo.name}
                  </span>
                </div>

                <div className="bg-primary-50 rounded-lg p-3 mb-4">
                  <div className="text-sm text-primary-700 font-medium">
                    Bônus da Classe
                  </div>
                  <div className="text-primary-600">
                    {classInfo.bonus}
                  </div>
                </div>

                <div className="text-sm text-gray-500">
                  Membro desde {new Date(profile.created_at).toLocaleDateString('pt-BR')}
                </div>
              </div>
            </div>
          </div>

          {/* Stats & Progress */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* Level & XP */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold mb-4">Progressão</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">
                      {profile.level}
                    </div>
                    <div className="text-sm text-gray-500">Level</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {profile.xp}
                    </div>
                    <div className="text-sm text-gray-500">XP Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-600">
                      {profile.gold}
                    </div>
                    <div className="text-sm text-gray-500">Gold</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600">
                      {profile.current_streak}
                    </div>
                    <div className="text-sm text-gray-500">Streak Atual</div>
                  </div>
                </div>

                {/* XP Progress Bar */}
                <div className="mt-6">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progresso para o Level {profile.level + 1}</span>
                    <span>{getXpProgress()}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${getXpProgress()}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{(profile.level - 1) * 1000} XP</span>
                    <span>{profile.level * 1000} XP</span>
                  </div>
                </div>
              </div>

              {/* Study Stats */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold mb-4">Estatísticas de Estudo</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {profile.total_correct}
                    </div>
                    <div className="text-sm text-gray-500">Questões Corretas</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-600">
                      {profile.total_questions}
                    </div>
                    <div className="text-sm text-gray-500">Questões Totais</div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Taxa de Acerto</span>
                    <span>
                      {profile.total_questions > 0 
                        ? Math.round((profile.total_correct / profile.total_questions) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${profile.total_questions > 0 
                          ? (profile.total_correct / profile.total_questions) * 100
                          : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Achievements Preview */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold mb-4">Conquistas</h3>
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">🏆</div>
                  <p className="text-gray-600">
                    Sistema de conquistas chegando em breve!
                  </p>
                </div>
              </div>

              {/* Records */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold mb-4">Recordes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">🔥</span>
                      <div>
                        <div className="font-semibold text-orange-700">
                          Maior Streak
                        </div>
                        <div className="text-2xl font-bold text-orange-600">
                          {profile.max_streak}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">⭐</span>
                      <div>
                        <div className="font-semibold text-purple-700">
                          Level Máximo
                        </div>
                        <div className="text-2xl font-bold text-purple-600">
                          {profile.level}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="card border-red-200">
                <div className="p-4 bg-red-50 border-b border-red-200">
                  <button
                    onClick={() => setShowDangerZone(!showDangerZone)}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">⚠️</span>
                      <h3 className="text-lg font-semibold text-red-800">
                        Zona de Perigo
                      </h3>
                    </div>
                    <span className="text-red-600">
                      {showDangerZone ? '−' : '+'}
                    </span>
                  </button>
                </div>

                {showDangerZone && (
                  <div className="p-6 space-y-4">
                    <p className="text-sm text-gray-600 mb-6">
                      ⚠️ <strong>Atenção:</strong> As ações abaixo são irreversíveis. Use com cuidado.
                    </p>

                    {/* Reset Progress */}
                    <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                      <h4 className="font-semibold text-yellow-800 mb-2">
                        🔄 Resetar Progresso de Estudos
                      </h4>
                      <p className="text-sm text-yellow-700 mb-3">
                        Remove todas as questões respondidas, conquistas, XP e gold. 
                        Mantém username e configurações do avatar.
                      </p>
                      <button
                        onClick={() => openConfirmation('reset')}
                        className="btn-secondary bg-yellow-600 hover:bg-yellow-700 text-white"
                      >
                        Resetar Progresso
                      </button>
                    </div>

                    {/* Delete Account */}
                    <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                      <h4 className="font-semibold text-red-800 mb-2">
                        🗑️ Excluir Conta do CRAM
                      </h4>
                      <p className="text-sm text-red-700 mb-3">
                        Remove TODOS os dados do CRAM (perfil, progresso, configurações). 
                        Você será deslogado e pode recriar sua conta quando quiser.
                      </p>
                      <button
                        onClick={() => openConfirmation('delete')}
                        className="btn-secondary bg-red-600 hover:bg-red-700 text-white"
                      >
                        Excluir Conta do CRAM
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Modal */}
        {activeConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-4">
                {activeConfirmation === 'reset' ? '🔄 Confirmar Reset de Progresso' : '🗑️ Confirmar Exclusão da Conta'}
              </h3>
              
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 mb-2">
                  <strong>⚠️ Esta ação é IRREVERSÍVEL!</strong>
                </p>
                <p className="text-sm text-red-600">
                  {activeConfirmation === 'reset' 
                    ? 'Todos os seus dados de progresso (XP, gold, questões respondidas, conquistas) serão permanentemente removidos.'
                    : 'Todos os seus dados do CRAM serão permanentemente removidos. Você será deslogado e pode recriar sua conta quando quiser.'
                  }
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Para confirmar, digite exatamente:
                </label>
                <div className="bg-gray-100 p-2 rounded text-sm font-mono mb-2">
                  {activeConfirmation === 'reset' ? 'RESETAR PROGRESSO' : 'EXCLUIR CONTA CRAM'}
                </div>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="input"
                  placeholder="Digite a confirmação aqui..."
                  disabled={isLoading}
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={closeConfirmation}
                  className="flex-1 btn-secondary"
                  disabled={isLoading}
                >
                  Cancelar
                </button>
                <button
                  onClick={activeConfirmation === 'reset' ? handleResetProgress : handleDeleteAccount}
                  className={`flex-1 text-white ${
                    activeConfirmation === 'reset' 
                      ? 'bg-yellow-600 hover:bg-yellow-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  } px-4 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed`}
                  disabled={isLoading || !confirmText}
                >
                  {isLoading ? 'Processando...' : (
                    activeConfirmation === 'reset' ? 'Resetar Progresso' : 'Excluir Conta'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Profile