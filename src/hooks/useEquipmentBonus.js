import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export const useEquipmentBonus = () => {
  const { profile } = useAuth()
  const [bonuses, setBonuses] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile) {
      loadEquipmentBonuses()
    }
  }, [profile])

  const loadEquipmentBonuses = async () => {
    try {
      setLoading(true)

      // Buscar items equipados do usuário
      const { data: equippedItems, error } = await supabase
        .from('user_inventory')
        .select(`
          equipped,
          shop_items (
            id,
            name,
            category,
            bonus_type,
            bonus_value,
            bonus_condition
          )
        `)
        .eq('user_id', profile.id)
        .eq('equipped', true)

      if (error) throw error

      // Calcular bônus totais
      const totalBonuses = (equippedItems || []).reduce((acc, item) => {
        const { shop_items } = item
        if (shop_items.bonus_type && shop_items.bonus_value) {
          acc[shop_items.bonus_type] = (acc[shop_items.bonus_type] || 0) + shop_items.bonus_value
          
          // Armazenar detalhes do item para referência
          if (!acc.items) acc.items = []
          acc.items.push({
            name: shop_items.name,
            category: shop_items.category,
            bonus_type: shop_items.bonus_type,
            bonus_value: shop_items.bonus_value,
            bonus_condition: shop_items.bonus_condition
          })
        }
        return acc
      }, {})

      setBonuses(totalBonuses)
    } catch (err) {
      console.error('Error loading equipment bonuses:', err)
      setBonuses({})
    } finally {
      setLoading(false)
    }
  }

  // Aplicar bônus de XP
  const applyXpBonus = (baseXp, context = {}) => {
    let multiplier = 1

    // XP Boost geral
    if (bonuses.xp_boost) {
      multiplier += bonuses.xp_boost
    }

    // Bônus condicionais
    if (bonuses.items) {
      bonuses.items.forEach(item => {
        if (item.bonus_type === 'xp_boost' && item.bonus_condition !== 'always') {
          // Aplicar bônus condicionais baseados no contexto
          if (shouldApplyConditionalBonus(item.bonus_condition, context)) {
            multiplier += item.bonus_value
          }
        }
      })
    }

    return Math.round(baseXp * multiplier)
  }

  // Aplicar bônus de Gold
  const applyGoldBonus = (baseGold, context = {}) => {
    let multiplier = 1

    // Gold Boost geral
    if (bonuses.gold_boost) {
      multiplier += bonuses.gold_boost
    }

    // Bônus condicionais
    if (bonuses.items) {
      bonuses.items.forEach(item => {
        if (item.bonus_type === 'gold_boost' && item.bonus_condition !== 'always') {
          if (shouldApplyConditionalBonus(item.bonus_condition, context)) {
            multiplier += item.bonus_value
          }
        }
      })
    }

    return Math.round(baseGold * multiplier)
  }

  // Verificar se deve aplicar bônus condicional
  const shouldApplyConditionalBonus = (condition, context) => {
    switch (condition) {
      case 'first_attempt':
        return context.firstAttempt === true
      case 'nighttime':
        const hour = new Date().getHours()
        return hour >= 22 || hour <= 6
      case 'hard_questions':
        return context.difficulty >= 4
      case 'after_error':
        return context.afterError === true
      case 'crimes_justice':
        return context.sectionType === 'crimes_justice'
      case 'crimes_funcionais':
        return context.sectionType === 'crimes_funcionais'
      case 'daily_login':
        return context.dailyLogin === true
      case 'review_mode':
        return context.reviewMode === true
      default:
        return false
    }
  }

  // Obter chance de dica
  const getHintChance = () => {
    return bonuses.hint_chance || 0
  }

  // Obter chance de crítico
  const getCriticalChance = () => {
    return bonuses.critical_chance || 0
  }

  // Verificar se deve mostrar dica
  const shouldShowHint = () => {
    const chance = getHintChance()
    return Math.random() < chance
  }

  // Verificar se é um acerto crítico
  const isCriticalHit = () => {
    const chance = getCriticalChance()
    return Math.random() < chance
  }

  // Obter resumo dos bônus ativos
  const getActiveBonuses = () => {
    const active = []
    
    if (bonuses.xp_boost) {
      active.push({
        type: 'XP Boost',
        value: `+${Math.round(bonuses.xp_boost * 100)}%`,
        icon: '✨'
      })
    }
    
    if (bonuses.gold_boost) {
      active.push({
        type: 'Gold Boost',
        value: `+${Math.round(bonuses.gold_boost * 100)}%`,
        icon: '🪙'
      })
    }
    
    if (bonuses.hint_chance) {
      active.push({
        type: 'Chance de Dica',
        value: `+${Math.round(bonuses.hint_chance * 100)}%`,
        icon: '💡'
      })
    }
    
    if (bonuses.critical_chance) {
      active.push({
        type: 'Chance Crítica',
        value: `+${Math.round(bonuses.critical_chance * 100)}%`,
        icon: '⚡'
      })
    }

    return active
  }

  return {
    bonuses,
    loading,
    applyXpBonus,
    applyGoldBonus,
    getHintChance,
    getCriticalChance,
    shouldShowHint,
    isCriticalHit,
    getActiveBonuses,
    reload: loadEquipmentBonuses
  }
}

export default useEquipmentBonus