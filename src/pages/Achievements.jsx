import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useAchievements } from '../hooks/useAchievements'
import Layout from '../components/Layout/Layout'
import AchievementCard from '../components/AchievementCard'
import AchievementProgress from '../components/AchievementProgress'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import { motion } from 'framer-motion'

const Achievements = () => {
  const { profile } = useAuth()
  const { 
    achievements, 
    userAchievements, 
    stats, 
    loading, 
    error,
    getAchievementsByCategory,
    simulateAchievementUnlock
  } = useAchievements()

  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedFilter, setSelectedFilter] = useState('all') // all, completed, in-progress, locked
  const [sortBy, setSortBy] = useState('category') // category, progress, date

  const categories = [
    { id: 'all', name: 'Todas', icon: '🏆', count: achievements.length },
    { id: 'bronze', name: 'Bronze', icon: '🥉', count: achievements.filter(a => a.category === 'bronze').length },
    { id: 'silver', name: 'Prata', icon: '🥈', count: achievements.filter(a => a.category === 'silver').length },
    { id: 'gold', name: 'Ouro', icon: '🥇', count: achievements.filter(a => a.category === 'gold').length },
    { id: 'platinum', name: 'Platina', icon: '💎', count: achievements.filter(a => a.category === 'platinum').length },
    { id: 'secret', name: 'Secretas', icon: '🔮', count: achievements.filter(a => a.category === 'secret').length }
  ]

  const filters = [
    { id: 'all', name: 'Todas', icon: '📋' },
    { id: 'completed', name: 'Completadas', icon: '✅' },
    { id: 'in-progress', name: 'Em Progresso', icon: '⏳' },
    { id: 'locked', name: 'Bloqueadas', icon: '🔒' }
  ]

  const sortOptions = [
    { id: 'category', name: 'Por Categoria' },
    { id: 'progress', name: 'Por Progresso' },
    { id: 'date', name: 'Por Data' }
  ]

  // Get filtered and sorted achievements
  const getFilteredAchievements = () => {
    let filteredAchievements = selectedCategory === 'all' 
      ? achievements 
      : achievements.filter(a => a.category === selectedCategory)

    // Apply filter
    if (selectedFilter !== 'all') {
      const userAchievementMap = userAchievements.reduce((map, ua) => {
        map[ua.achievement_id] = ua
        return map
      }, {})

      switch (selectedFilter) {
        case 'completed':
          filteredAchievements = filteredAchievements.filter(a => 
            userAchievementMap[a.id]?.is_completed
          )
          break
        case 'in-progress':
          filteredAchievements = filteredAchievements.filter(a => {
            const ua = userAchievementMap[a.id]
            return ua && !ua.is_completed && ua.progress > 0
          })
          break
        case 'locked':
          filteredAchievements = filteredAchievements.filter(a => 
            !userAchievementMap[a.id] || (userAchievementMap[a.id]?.progress || 0) === 0
          )
          break
      }
    }

    // Apply sorting
    const userAchievementMap = userAchievements.reduce((map, ua) => {
      map[ua.achievement_id] = ua
      return map
    }, {})

    switch (sortBy) {
      case 'progress':
        return filteredAchievements.sort((a, b) => {
          const progressA = userAchievementMap[a.id]?.progress || 0
          const progressB = userAchievementMap[b.id]?.progress || 0
          return progressB - progressA
        })
      case 'date':
        return filteredAchievements.sort((a, b) => {
          const dateA = userAchievementMap[a.id]?.unlocked_at || '0'
          const dateB = userAchievementMap[b.id]?.unlocked_at || '0'
          return new Date(dateB) - new Date(dateA)
        })
      case 'category':
      default:
        return filteredAchievements.sort((a, b) => {
          const categoryOrder = ['bronze', 'silver', 'gold', 'platinum', 'secret']
          const orderA = categoryOrder.indexOf(a.category)
          const orderB = categoryOrder.indexOf(b.category)
          if (orderA !== orderB) return orderA - orderB
          return a.condition_value - b.condition_value
        })
    }
  }

  const filteredAchievements = getFilteredAchievements()

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <LoadingSpinner 
              size="lg" 
              text="Carregando conquistas..." 
              type="dots"
            />
          </div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <EmptyState
            icon="❌"
            title="Erro ao Carregar Conquistas"
            description={error}
            actionText="Tentar Novamente"
            onAction={() => window.location.reload()}
          />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <span className="text-4xl">🏆</span>
                Conquistas
              </h1>
              <p className="text-gray-600 mt-1">
                Desbloqueie conquistas estudando e evoluindo seus conhecimentos
              </p>
            </div>
            
          </div>

          {/* Progress Overview */}
          <AchievementProgress stats={stats} className="mb-6" />
        </div>

        {/* Filters and Controls */}
        <div className="mb-6">
          {/* Categories */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Categorias</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 
                            flex items-center gap-2 ${
                    selectedCategory === category.id
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span>{category.icon}</span>
                  <span>{category.name}</span>
                  <span className="text-xs bg-black/10 px-1.5 py-0.5 rounded">
                    {category.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Filters and Sorting */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Filtro:</span>
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 
                         focus:ring-primary-500 focus:border-primary-500"
              >
                {filters.map(filter => (
                  <option key={filter.id} value={filter.id}>
                    {filter.icon} {filter.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Ordenar:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 
                         focus:ring-primary-500 focus:border-primary-500"
              >
                {sortOptions.map(option => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Results Count */}
            <div className="ml-auto text-sm text-gray-500">
              {filteredAchievements.length} conquistas
            </div>
          </div>
        </div>

        {/* Achievements Grid */}
        {filteredAchievements.length === 0 ? (
          <EmptyState
            icon="🏆"
            title="Nenhuma conquista encontrada"
            description="Tente ajustar os filtros ou continue estudando para desbloquear novas conquistas!"
            actionText="Ver Todas"
            onAction={() => {
              setSelectedCategory('all')
              setSelectedFilter('all')
            }}
          />
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {filteredAchievements.map((achievement, index) => {
              const userAchievement = userAchievements.find(ua => ua.achievement_id === achievement.id)
              
              return (
                <motion.div
                  key={achievement.id}
                  variants={itemVariants}
                  transition={{ delay: index * 0.05 }}
                >
                  <AchievementCard
                    achievement={achievement}
                    userAchievement={userAchievement}
                  />
                </motion.div>
              )
            })}
          </motion.div>
        )}

        {/* Quick Stats Footer */}
        {filteredAchievements.length > 0 && (
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-6 bg-gray-50 rounded-lg px-6 py-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {stats.completed}
                </div>
                <div className="text-xs text-gray-600">Completadas</div>
              </div>
              <div className="w-px h-8 bg-gray-300" />
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {stats.completionRate}%
                </div>
                <div className="text-xs text-gray-600">Progresso</div>
              </div>
              <div className="w-px h-8 bg-gray-300" />
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {stats.totalXpFromAchievements}
                </div>
                <div className="text-xs text-gray-600">XP Total</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Achievements