import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/Layout/Layout'
import Avatar from '../components/Avatar'
import LoadingSpinner from '../components/LoadingSpinner'
import { motion } from 'framer-motion'

const Inventory = () => {
  const { profile } = useAuth()
  const [inventory, setInventory] = useState([])
  const [shopItems, setShopItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [equipping, setEquipping] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('all')

  const categories = [
    { id: 'all', name: 'Todos', icon: '🎒' },
    { id: 'weapon', name: 'Armas', icon: '⚔️' },
    { id: 'armor', name: 'Armaduras', icon: '🛡️' },
    { id: 'accessory', name: 'Acessórios', icon: '💍' },
    { id: 'pet', name: 'Pets', icon: '🐾' }
  ]

  useEffect(() => {
    if (profile) {
      loadInventory()
    }
  }, [profile])

  const loadInventory = async () => {
    try {
      setLoading(true)

      // Carregar inventário do usuário com detalhes dos items
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('user_inventory')
        .select(`
          *,
          shop_items (*)
        `)
        .eq('user_id', profile.id)

      if (inventoryError) throw inventoryError

      // Carregar todos os items da shop para referência
      const { data: allItems, error: itemsError } = await supabase
        .from('shop_items')
        .select('*')

      if (itemsError) throw itemsError

      setInventory(inventoryData || [])
      setShopItems(allItems || [])
    } catch (err) {
      console.error('Error loading inventory:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEquipToggle = async (inventoryItem) => {
    try {
      setEquipping(inventoryItem.id)

      const newEquippedState = !inventoryItem.equipped

      // Se está equipando, desequipar outros items da mesma categoria primeiro
      if (newEquippedState) {
        const sameCategory = inventory.filter(
          item => item.shop_items.category === inventoryItem.shop_items.category && 
                  item.equipped && 
                  item.id !== inventoryItem.id
        )

        for (const item of sameCategory) {
          await supabase
            .from('user_inventory')
            .update({ equipped: false })
            .eq('id', item.id)
        }
      }

      // Atualizar o item atual
      const { error } = await supabase
        .from('user_inventory')
        .update({ equipped: newEquippedState })
        .eq('id', inventoryItem.id)

      if (error) throw error

      // Recarregar inventário
      await loadInventory()
    } catch (err) {
      console.error('Error toggling equipment:', err)
    } finally {
      setEquipping(null)
    }
  }

  const getEquippedItems = () => {
    return inventory.filter(item => item.equipped).reduce((acc, item) => {
      acc[item.shop_items.category] = item.shop_items
      return acc
    }, {})
  }

  const filteredInventory = selectedCategory === 'all' 
    ? inventory 
    : inventory.filter(item => item.shop_items.category === selectedCategory)

  const calculateTotalBonuses = () => {
    const equipped = inventory.filter(item => item.equipped)
    return equipped.reduce((totals, item) => {
      const { shop_items } = item
      if (shop_items.bonus_type && shop_items.bonus_value) {
        totals[shop_items.bonus_type] = (totals[shop_items.bonus_type] || 0) + shop_items.bonus_value
      }
      return totals
    }, {})
  }

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <LoadingSpinner 
              size="lg" 
              text="Carregando inventário..." 
              type="spinner"
            />
          </div>
        </div>
      </Layout>
    )
  }

  const equippedItems = getEquippedItems()
  const totalBonuses = calculateTotalBonuses()

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎒 Inventário
          </h1>
          <p className="text-gray-600">
            Gerencie seus equipamentos e veja seus bônus ativos
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Avatar Preview */}
          <div className="lg:col-span-1">
            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-4 text-center">Preview do Avatar</h2>
              
              <div className="flex justify-center mb-6">
                <Avatar 
                  profile={profile}
                  size="2xl"
                  showAnimation={true}
                  equippedItems={equippedItems}
                />
              </div>

              {/* Character Stats */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Classe:</span>
                  <span className="font-semibold capitalize">{profile?.avatar_class}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Level:</span>
                  <span className="font-semibold">{profile?.level}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Items Equipados:</span>
                  <span className="font-semibold">{inventory.filter(i => i.equipped).length}</span>
                </div>
              </div>

              {/* Active Bonuses */}
              {Object.keys(totalBonuses).length > 0 && (
                <div className="mt-6 pt-4 border-t">
                  <h3 className="font-semibold mb-3">🌟 Bônus Ativos</h3>
                  <div className="space-y-2">
                    {Object.entries(totalBonuses).map(([type, value]) => (
                      <div key={type} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {type === 'xp_boost' ? '✨ XP Boost' :
                           type === 'gold_boost' ? '🪙 Gold Boost' :
                           type === 'hint_chance' ? '💡 Chance de Dica' : '⚡ Crítico'}:
                        </span>
                        <span className="font-semibold text-primary-600">
                          +{Math.round(value * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Inventory Items */}
          <div className="lg:col-span-2">
            {/* Category Filter */}
            <div className="flex justify-center mb-6">
              <div className="bg-white rounded-lg border p-2 flex gap-2 flex-wrap">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
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

            {/* Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredInventory.map((inventoryItem, index) => {
                const item = inventoryItem.shop_items
                const isEquipped = inventoryItem.equipped

                return (
                  <motion.div
                    key={inventoryItem.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`card p-4 transition-all duration-200 ${
                      isEquipped ? 'bg-primary-50 border-primary-200 shadow-md' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      {/* Item Icon */}
                      <div className="text-3xl">
                        {item.category === 'weapon' ? '⚔️' : 
                         item.category === 'armor' ? '🛡️' : 
                         item.category === 'accessory' ? '💍' : '🐾'}
                      </div>

                      {/* Item Info */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{item.name}</h3>
                        <p className="text-sm text-gray-600 mb-1">{item.description}</p>
                        
                        {item.bonus_type && (
                          <div className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded inline-block">
                            +{Math.round(item.bonus_value * 100)}% {
                              item.bonus_type === 'xp_boost' ? 'XP' :
                              item.bonus_type === 'gold_boost' ? 'Gold' :
                              item.bonus_type === 'hint_chance' ? 'Dicas' : 'Crítico'
                            }
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">
                            Comprado em {new Date(inventoryItem.purchased_at).toLocaleDateString()}
                          </span>
                          
                          {isEquipped && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                              ✅ Equipado
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Equip/Unequip Button */}
                      <button
                        onClick={() => handleEquipToggle(inventoryItem)}
                        disabled={equipping === inventoryItem.id}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          isEquipped
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-primary-600 hover:bg-primary-700 text-white'
                        }`}
                      >
                        {equipping === inventoryItem.id ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                            ...
                          </div>
                        ) : isEquipped ? (
                          'Desequipar'
                        ) : (
                          'Equipar'
                        )}
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Empty State */}
            {filteredInventory.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎒</div>
                <h3 className="text-xl font-semibold mb-2">
                  {selectedCategory === 'all' ? 'Inventário vazio' : 'Nenhum item desta categoria'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {selectedCategory === 'all' 
                    ? 'Visite a loja para comprar seus primeiros equipamentos!' 
                    : 'Você não possui items desta categoria ainda.'
                  }
                </p>
                <a
                  href="/shop"
                  className="btn-primary inline-block"
                >
                  🏪 Ir para a Loja
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Inventory