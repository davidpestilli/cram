import { useAuth } from '../../contexts/AuthContext'
import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import Avatar from '../Avatar'

const Header = () => {
  const { profile, signOut } = useAuth()
  const location = useLocation()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const getXpForNextLevel = (level) => {
    return level * 1000 // 1000 XP por level
  }

  const getXpProgress = () => {
    if (!profile) return 0
    const currentLevelXp = (profile.level - 1) * 1000
    const nextLevelXp = profile.level * 1000
    const progressXp = profile.xp - currentLevelXp
    const neededXp = nextLevelXp - currentLevelXp
    return (progressXp / neededXp) * 100
  }

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { path: '/subjects', label: 'Matérias', icon: '📚' },
    { path: '/achievements', label: 'Conquistas', icon: '🏆' },
    { path: '/shop', label: 'Loja', icon: '🏪' },
    { path: '/inventory', label: 'Inventário', icon: '🎒' },
    { path: '/profile', label: 'Perfil', icon: '👤' },
  ]

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-primary-600 font-pixel">
                CRAM
              </h1>
              <span className="text-sm text-gray-500">v1.0</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span className="mr-1">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* User Stats & Menu */}
          {profile && (
            <div className="flex items-center space-x-4">
              {/* Stats */}
              <div className="hidden sm:flex items-center space-x-4 text-sm">
                {/* Level */}
                <div className="flex items-center space-x-1">
                  <span className="text-purple-600 font-semibold">
                    Lv.{profile.level}
                  </span>
                </div>

                {/* XP Progress */}
                <div className="flex items-center space-x-2">
                  <span className="text-blue-600 font-semibold">
                    {profile.xp} XP
                  </span>
                  <div className="w-20 h-2 bg-gray-200 rounded-full">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-300"
                      style={{ width: `${getXpProgress()}%` }}
                    ></div>
                  </div>
                </div>

                {/* Gold */}
                <div className="flex items-center space-x-1">
                  <span className="text-yellow-600 font-semibold">
                    {profile.gold}
                  </span>
                  <span className="text-yellow-500">🪙</span>
                </div>

                {/* Streak */}
                {profile.current_streak > 0 && (
                  <div className="flex items-center space-x-1">
                    <span className="text-orange-600 font-semibold">
                      {profile.current_streak}
                    </span>
                    <span className="text-orange-500">🔥</span>
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Avatar 
                    profile={profile} 
                    size="sm" 
                    showAnimation={false}
                  />
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-900">
                      {profile.username}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {profile.avatar_class}
                    </p>
                  </div>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${
                      showUserMenu ? 'transform rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowUserMenu(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-20">
                      <div className="py-1">
                        <Link
                          to="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Ver Perfil
                        </Link>
                        <Link
                          to="/settings"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Configurações
                        </Link>
                        <div className="border-t border-gray-200"></div>
                        <button
                          onClick={handleSignOut}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          Sair
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button 
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
            >
              <svg 
                className={`w-5 h-5 transform transition-transform ${showMobileMenu ? 'rotate-90' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                {showMobileMenu ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setShowMobileMenu(false)}
          />
          <div className="absolute top-16 left-0 right-0 bg-white shadow-lg border-b z-50 md:hidden animate-slide-up">
            <div className="px-4 py-2 space-y-1">
              {/* User Info Mobile */}
              {profile && (
                <div className="flex items-center space-x-3 p-3 border-b border-gray-200">
                  <Avatar 
                    profile={profile} 
                    size="sm" 
                    showAnimation={false}
                  />
                  <div>
                    <p className="font-medium text-gray-900">{profile.username}</p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>Lv.{profile.level}</span>
                      <span>•</span>
                      <span>{profile.xp} XP</span>
                      <span>•</span>
                      <span>{profile.gold} 🪙</span>
                      {profile.current_streak > 0 && (
                        <>
                          <span>•</span>
                          <span>{profile.current_streak} 🔥</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Items Mobile */}
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setShowMobileMenu(false)}
                  className={`flex items-center space-x-3 px-3 py-3 rounded-lg text-base font-medium transition-colors ${
                    location.pathname === item.path
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-700 hover:text-primary-600 hover:bg-primary-50'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}

              {/* Mobile Actions */}
              <div className="border-t border-gray-200 pt-2">
                <button
                  onClick={() => {
                    handleSignOut()
                    setShowMobileMenu(false)
                  }}
                  className="flex items-center space-x-3 w-full px-3 py-3 rounded-lg text-base font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Sair</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  )
}

export default Header