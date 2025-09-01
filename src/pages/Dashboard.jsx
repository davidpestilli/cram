import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout/Layout'

const Dashboard = () => {
  const { user, profile } = useAuth()

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard
          </h2>
          <p className="text-gray-600">
            Bem-vindo de volta! Pronto para estudar?
          </p>
        </div>

        {!profile ? (
          <div className="card p-6">
            <h3 className="text-xl font-semibold mb-4">
              Complete seu perfil
            </h3>
            <p className="text-gray-600 mb-4">
              Você precisa completar seu perfil para começar a estudar.
            </p>
            <Link
              to="/profile-setup"
              className="btn-primary inline-block"
            >
              Criar Perfil
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Stats Cards */}
            <div className="card p-6">
              <div className="flex items-center">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <div className="w-6 h-6 bg-primary-600 rounded"></div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Level</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {profile.level || 1}
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="p-2 bg-secondary-100 rounded-lg">
                  <div className="w-6 h-6 bg-secondary-600 rounded"></div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">XP Total</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {profile.xp || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <div className="w-6 h-6 bg-yellow-600 rounded"></div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Gold</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {profile.gold || 100}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card p-6 md:col-span-2 lg:col-span-3">
              <h3 className="text-xl font-semibold mb-4">
                Ações Rápidas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  to="/subjects"
                  className="block p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
                >
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary-600 rounded-lg mx-auto mb-3"></div>
                    <h4 className="font-medium text-gray-900">Estudar</h4>
                    <p className="text-sm text-gray-500">Escolha uma matéria</p>
                  </div>
                </Link>

                <Link
                  to="/shop"
                  className="block p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-secondary-300 hover:bg-secondary-50 transition-colors"
                >
                  <div className="text-center">
                    <div className="w-12 h-12 bg-secondary-600 rounded-lg mx-auto mb-3"></div>
                    <h4 className="font-medium text-gray-900">Loja</h4>
                    <p className="text-sm text-gray-500">Comprar equipamentos</p>
                  </div>
                </Link>

                <Link
                  to="/profile"
                  className="block p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
                >
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-600 rounded-lg mx-auto mb-3"></div>
                    <h4 className="font-medium text-gray-900">Perfil</h4>
                    <p className="text-sm text-gray-500">Ver estatísticas</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Dashboard