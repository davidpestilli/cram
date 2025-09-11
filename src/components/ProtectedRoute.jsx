import { useAuth } from '../contexts/AuthContext'
import { Navigate, useLocation } from 'react-router-dom'

const ProtectedRoute = ({ children }) => {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Se o usuário está autenticado mas não tem perfil configurado (ou tem perfil temporário),
  // redirecionar para ProfileSetup (exceto se já está na página de setup)
  if (user && (!profile || profile.is_temporary) && location.pathname !== '/profile-setup') {
    return <Navigate to="/profile-setup" replace />
  }

  return children
}

export default ProtectedRoute