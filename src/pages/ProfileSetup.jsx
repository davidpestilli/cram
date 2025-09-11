import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

const ProfileSetup = () => {
  const [username, setUsername] = useState('')
  const [avatarGender, setAvatarGender] = useState('masculino')
  const [avatarClass, setAvatarClass] = useState('estudante')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { createProfile, profile, user } = useAuth()
  const navigate = useNavigate()

  // Definir username padrão baseado no email do usuário
  useEffect(() => {
    if (user?.email && !username) {
      const defaultUsername = user.email.split('@')[0]
      setUsername(defaultUsername)
    }
  }, [user, username])

  // Redirect if profile already exists and is not temporary
  console.log('ProfileSetup: Checking redirect conditions', {
    hasProfile: !!profile,
    isTemporary: profile?.is_temporary,
    username: profile?.username,
    shouldRedirect: profile && !profile.is_temporary
  })
  
  if (profile && !profile.is_temporary) {
    console.log('ProfileSetup: Redirecting to dashboard - profile exists and is not temporary')
    navigate('/dashboard', { replace: true })
    return null
  }

  const avatarClasses = [
    { id: 'estudante', name: 'Estudante', description: '+5% XP geral', bonus: 'Bônus universal' },
    { id: 'advogado', name: 'Advogado', description: '+15% Direito Civil', bonus: 'Especialista em Civil' },
    { id: 'juiz', name: 'Juiz', description: '+15% Processo Civil', bonus: 'Mestre dos processos' },
    { id: 'promotor', name: 'Promotor', description: '+15% Direito Penal', bonus: 'Defensor da justiça' },
    { id: 'delegado', name: 'Delegado', description: '+15% Processo Penal', bonus: 'Investigador experiente' },
    { id: 'procurador', name: 'Procurador', description: '+15% Direito Administrativo', bonus: 'Guardião do Estado' },
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (username.length < 3) {
      setError('Username deve ter pelo menos 3 caracteres')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await createProfile({
        username: username.trim(),
        avatar_gender: avatarGender,
        avatar_class: avatarClass
      })

      if (result.error) {
        setError(result.error.message)
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setError('Erro ao criar perfil. Tente novamente.')
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-600 font-pixel mb-2">
            CRAM
          </h1>
          <h2 className="text-2xl font-bold text-gray-900">
            Bem-vindo ao CRAM!
          </h2>
          <p className="text-gray-600 mt-2">
            Configure seu perfil para começar sua jornada de estudos jurídicos
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {/* Username */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Nome de Usuário</h3>
            <input
              type="text"
              placeholder="Digite seu username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input"
              required
              minLength={3}
              maxLength={20}
            />
            <p className="text-sm text-gray-500 mt-2">
              Será usado para identificá-lo no jogo
            </p>
          </div>

          {/* Gender */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Gênero do Avatar</h3>
            <div className="grid grid-cols-2 gap-4">
              <label className={`cursor-pointer p-4 border-2 rounded-lg transition-colors ${
                avatarGender === 'masculino' 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="gender"
                  value="masculino"
                  checked={avatarGender === 'masculino'}
                  onChange={(e) => setAvatarGender(e.target.value)}
                  className="sr-only"
                />
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-500 rounded-full mx-auto mb-2"></div>
                  <p className="font-medium">Masculino</p>
                </div>
              </label>

              <label className={`cursor-pointer p-4 border-2 rounded-lg transition-colors ${
                avatarGender === 'feminino' 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="gender"
                  value="feminino"
                  checked={avatarGender === 'feminino'}
                  onChange={(e) => setAvatarGender(e.target.value)}
                  className="sr-only"
                />
                <div className="text-center">
                  <div className="w-16 h-16 bg-pink-500 rounded-full mx-auto mb-2"></div>
                  <p className="font-medium">Feminino</p>
                </div>
              </label>
            </div>
          </div>

          {/* Class */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Classe do Avatar</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {avatarClasses.map((cls) => (
                <label
                  key={cls.id}
                  className={`cursor-pointer p-4 border-2 rounded-lg transition-colors ${
                    avatarClass === cls.id 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="class"
                    value={cls.id}
                    checked={avatarClass === cls.id}
                    onChange={(e) => setAvatarClass(e.target.value)}
                    className="sr-only"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{cls.name}</p>
                    <p className="text-sm text-primary-600">{cls.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{cls.bonus}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={loading || !username.trim()}
              className="btn-primary px-8 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Criando perfil...
                </div>
              ) : (
                'Começar Jornada!'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProfileSetup