import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Link, Navigate } from 'react-router-dom'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { user, signIn, signUp } = useAuth()

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    console.log('Login: Starting', { isLogin, email, passwordLength: password.length })

    try {
      let result
      if (isLogin) {
        console.log('Login: Attempting signIn')
        result = await signIn(email, password)
      } else {
        console.log('Login: Attempting signUp')
        result = await signUp(email, password)
      }

      console.log('Login: Result received', { 
        hasData: !!result.data, 
        hasError: !!result.error,
        errorMessage: result.error?.message,
        userData: result.data?.user ? { id: result.data.user.id, email: result.data.user.email } : null
      })

      if (result.error) {
        console.error('Login: Setting error message:', result.error.message)
        setError(result.error.message)
      } else {
        console.log('Login: Success, should redirect soon...')
        
        // Se é signup e o usuário foi criado mas não há sessão, significa que precisa confirmar email
        if (!isLogin && result.data?.user && !result.data?.session) {
          setError('')
          alert(`Conta criada com sucesso! Verifique seu email (${email}) para confirmar a conta e depois faça login.`)
          setIsLogin(true) // Volta para modo de login
          return
        }
      }
    } catch (err) {
      console.error('Login: Unexpected error caught:', err)
      setError('An unexpected error occurred')
    }
    
    setLoading(false)
    console.log('Login: Process completed, loading set to false')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-primary">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary-600 font-pixel">
            CRAM
          </h1>
          <h2 className="mt-2 text-2xl font-bold text-gray-900">
            {isLogin ? 'Entre na sua conta' : 'Crie sua conta'}
          </h2>
          <p className="mt-2 text-gray-600">
            Estudos gamificados
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="input mt-1"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="input mt-1"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isLogin ? 'Entrando...' : 'Criando conta...'}
                </div>
              ) : (
                isLogin ? 'Entrar' : 'Criar conta'
              )}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                console.log('Login: Toggling mode from', isLogin ? 'login' : 'signup', 'to', !isLogin ? 'login' : 'signup')
                setIsLogin(!isLogin)
                setError('')
              }}
              className="text-primary-600 hover:text-primary-500 font-medium"
            >
              {isLogin 
                ? 'Não tem uma conta? Cadastre-se' 
                : 'Já tem uma conta? Entre'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login