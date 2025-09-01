import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/Layout/Layout'
import LoadingSpinner from '../components/LoadingSpinner'
import { motion } from 'framer-motion'

const Shop = () => {
  const { profile, fetchProfile } = useAuth()
  const [shopItems, setShopItems] = useState([])
  const [userInventory, setUserInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [purchasing, setPurchasing] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const categories = [
    { id: 'all', name: 'Todos', icon: '🛍️' },
    { id: 'weapon', name: 'Armas', icon: '⚔️' },
    { id: 'armor', name: 'Armaduras', icon: '🛡️' },
    { id: 'accessory', name: 'Acessórios', icon: '💍' },
    { id: 'pet', name: 'Pets', icon: '🐾' }
  ]

  useEffect(() => {
    loadShopData()
  }, [profile])

  const loadShopData = async () => {
    try {
      setLoading(true)
      
      // Carregar items da loja
      const { data: items, error: itemsError } = await supabase
        .from('shop_items')
        .select('*')
        .order('price', { ascending: true })

      if (itemsError) throw itemsError

      // Carregar inventário do usuário
      let inventory = []
      if (profile) {
        const { data: userItems, error: inventoryError } = await supabase
          .from('user_inventory')
          .select('item_id, equipped, purchased_at')
          .eq('user_id', profile.id)

        if (inventoryError) throw inventoryError
        inventory = userItems || []
      }

      setShopItems(items || [])
      setUserInventory(inventory)
    } catch (err) {
      console.error('Error loading shop data:', err)
      setError('Erro ao carregar dados da loja')
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async (item) => {
    if (!profile) return
    
    // Verificar se já possui o item
    const alreadyOwned = userInventory.some(inv => inv.item_id === item.id)
    if (alreadyOwned) {
      setError('Você já possui este item!')
      return
    }

    // Verificar se tem gold suficiente
    if (profile.gold < item.price) {
      setError('Gold insuficiente!')
      return
    }

    // Verificar level mínimo
    if (profile.level < item.min_level) {
      setError(`Level mínimo necessário: ${item.min_level}`)
      return
    }

    try {
      setPurchasing(item.id)
      setError('')

      // Deduzir gold do usuário
      const { error: goldError } = await supabase
        .from('user_profiles')
        .update({ gold: profile.gold - item.price })
        .eq('id', profile.id)

      if (goldError) throw goldError

      // Adicionar item ao inventário
      const { error: inventoryError } = await supabase
        .from('user_inventory')
        .insert({
          user_id: profile.id,
          item_id: item.id,
          equipped: false
        })

      if (inventoryError) throw inventoryError

      // Atualizar dados locais
      await fetchProfile(profile.id)
      await loadShopData()
      
      setSuccess(`${item.name} comprado com sucesso!`)
      setTimeout(() => setSuccess(''), 3000)

    } catch (err) {
      console.error('Error purchasing item:', err)
      setError('Erro ao comprar item. Tente novamente.')
    } finally {
      setPurchasing(null)
    }
  }

  const filteredItems = selectedCategory === 'all' 
    ? shopItems 
    : shopItems.filter(item => item.category === selectedCategory)

  const isOwned = (itemId) => {
    return userInventory.some(inv => inv.item_id === itemId)
  }

  const canAfford = (price) => {
    return profile && profile.gold >= price
  }

  const meetsLevelReq = (minLevel) => {
    return profile && profile.level >= minLevel
  }

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <LoadingSpinner 
              size="lg" 
              text="Carregando loja..." 
              type="spinner"
            />
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🏪 Loja Mágica
          </h1>
          <p className="text-gray-600">
            Equipamentos especiais para turbinar seus estudos
          </p>
          
          {/* User Stats */}
          {profile && (
            <div className="flex justify-center items-center gap-6 mt-4 p-4 bg-gray-50 rounded-lg inline-block">
              <div className="flex items-center gap-2">
                <span className="text-yellow-500">🪙</span>
                <span className="font-semibold text-yellow-700">{profile.gold} Gold</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-purple-500">⭐</span>
                <span className="font-semibold text-purple-700">Level {profile.level}</span>
              </div>
            </div>
          )}
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-center">
            {success}
          </div>
        )}

        {/* Category Filter */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg border p-2 flex gap-2 flex-wrap">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  selectedCategory === category.id
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span className="mr-1">{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Shop Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item, index) => {
            const owned = isOwned(item.id)
            const affordable = canAfford(item.price)
            const levelReq = meetsLevelReq(item.min_level)
            const canPurchase = !owned && affordable && levelReq

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`card p-6 transition-all duration-200 ${
                  owned 
                    ? 'bg-green-50 border-green-200' 
                    : canPurchase 
                      ? 'hover:shadow-lg hover:scale-105' 
                      : 'opacity-60'
                }`}
              >
                {/* Item Header */}
                <div className="text-center mb-4">
                  <div className="text-3xl mb-2">
                    {item.category === 'weapon' ? '⚔️' : 
                     item.category === 'armor' ? '🛡️' : 
                     item.category === 'accessory' ? '💍' : '🐾'}
                  </div>
                  <h3 className="font-semibold text-gray-900">{item.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                </div>

                {/* Item Stats */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Preço:</span>
                    <span className={`font-semibold ${affordable ? 'text-yellow-600' : 'text-red-600'}`}>
                      {item.price} 🪙
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Level mín:</span>
                    <span className={`font-semibold ${levelReq ? 'text-green-600' : 'text-red-600'}`}>
                      {item.min_level}
                    </span>
                  </div>
                  {item.bonus_type && (
                    <div className="text-xs bg-primary-50 p-2 rounded text-center">
                      <span className="text-primary-700 font-medium">
                        +{Math.round(item.bonus_value * 100)}% {
                          item.bonus_type === 'xp_boost' ? 'XP' :
                          item.bonus_type === 'gold_boost' ? 'Gold' :
                          item.bonus_type === 'hint_chance' ? 'Dicas' : 'Crítico'
                        }
                      </span>
                    </div>
                  )}
                </div>

                {/* Purchase Button */}
                <button
                  onClick={() => handlePurchase(item)}
                  disabled={!canPurchase || purchasing === item.id}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-all ${
                    owned
                      ? 'bg-green-600 text-white cursor-default'
                      : canPurchase
                        ? 'bg-primary-600 hover:bg-primary-700 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {purchasing === item.id ? (
                    <div className="flex items-center justify-center">
                      <LoadingSpinner 
                        size="sm" 
                        color="white" 
                        showText={false}
                        type="spinner"
                      />
                      <span className="ml-2">Comprando...</span>
                    </div>
                  ) : owned ? (
                    '✅ Possuído'
                  ) : !levelReq ? (
                    `Level ${item.min_level} necessário`
                  ) : !affordable ? (
                    'Gold insuficiente'
                  ) : (
                    'Comprar'
                  )}
                </button>
              </motion.div>
            )
          })}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold mb-2">Nenhum item encontrado</h3>
            <p className="text-gray-600">Tente selecionar outra categoria</p>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Shop