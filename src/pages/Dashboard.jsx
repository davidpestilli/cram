import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout/Layout'
import Tutorial from '../components/Tutorial'
import { defaultTutorialSteps } from '../constants/tutorialSteps'
import { FAQ } from '../components/HelpSystem'
import HelpSystem from '../components/HelpSystem'

const Dashboard = () => {
  const { user, profile } = useAuth()
  const [showTutorial, setShowTutorial] = useState(false)
  const [showFAQ, setShowFAQ] = useState(false)

  // Show tutorial for new users
  useEffect(() => {
    if (profile && !localStorage.getItem(`tutorial_completed_${user?.id}`)) {
      setShowTutorial(true)
    }
  }, [profile, user])

  const handleTutorialComplete = () => {
    setShowTutorial(false)
    if (user?.id) {
      localStorage.setItem(`tutorial_completed_${user.id}`, 'true')
    }
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Dashboard
              </h2>
              <p className="text-gray-600">
                Bem-vindo de volta! Pronto para estudar?
              </p>
            </div>
            
            {/* Help Actions */}
            <div className="flex items-center space-x-2">
              <HelpSystem 
                helpText="Clique aqui para ver as perguntas mais frequentes"
                position="bottom"
              >
                <button
                  onClick={() => setShowFAQ(true)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                  aria-label="Ajuda"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </HelpSystem>
              
              <HelpSystem 
                helpText="Clique aqui para ver o tutorial novamente"
                position="bottom"
              >
                <button
                  onClick={() => setShowTutorial(true)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                  aria-label="Tutorial"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </button>
              </HelpSystem>
            </div>
          </div>
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
      
      {/* Tutorial Modal */}
      <Tutorial
        isOpen={showTutorial}
        onClose={handleTutorialComplete}
        steps={defaultTutorialSteps}
      />
      
      {/* FAQ Modal */}
      <FAQ
        isOpen={showFAQ}
        onClose={() => setShowFAQ(false)}
      />
    </Layout>
  )
}

export default Dashboard