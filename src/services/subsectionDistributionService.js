import { supabase } from '../lib/supabase'

/**
 * Serviço responsável pela distribuição equilibrada de questões por subseções
 * 
 * Principais funcionalidades:
 * - Calcular distribuição baseada em peso das subseções
 * - Identificar déficit de questões por subseção
 * - Fornecer dados para geração direcionada de questões
 * - Atualizar estatísticas automaticamente
 */
export class SubsectionDistributionService {
  
  /**
   * Buscar todas as subseções de uma seção específica
   * @param {number} sectionId - ID da seção
   * @returns {Promise<Array>} Lista de subseções com dados completos
   */
  static async getSubsections(sectionId) {
    try {
      const { data, error } = await supabase
        .from('content_subsections')
        .select('*')
        .eq('section_id', sectionId)
        .eq('is_active', true)
        .order('ordem')

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching subsections:', error)
      throw error
    }
  }

  /**
   * Buscar estatísticas atuais de questões por subseção
   * @param {number} sectionId - ID da seção
   * @returns {Promise<Object>} Objeto com estatísticas por subsection_id
   */
  static async getSubsectionStats(sectionId) {
    try {
      const { data, error } = await supabase
        .from('subsection_question_stats')
        .select('*')
        .eq('section_id', sectionId)

      if (error) throw error
      
      // Converter array em objeto para fácil acesso
      const statsMap = {}
      data?.forEach(stat => {
        statsMap[stat.subsection_id] = stat
      })
      
      return statsMap
    } catch (error) {
      console.error('Error fetching subsection stats:', error)
      return {}
    }
  }

  /**
   * Calcular distribuição ideal de questões baseada nos pesos
   * @param {number} sectionId - ID da seção
   * @param {number} totalQuestions - Total de questões desejadas
   * @returns {Promise<Array>} Array com distribuição calculada
   */
  static async calculateDistribution(sectionId, totalQuestions = 10) {
    try {
      // Buscar subseções e estatísticas
      const [subsections, statsMap] = await Promise.all([
        this.getSubsections(sectionId),
        this.getSubsectionStats(sectionId)
      ])

      if (subsections.length === 0) {
        throw new Error(`Nenhuma subseção encontrada para seção ${sectionId}`)
      }

      // Calcular peso total
      const totalWeight = subsections.reduce((sum, sub) => sum + sub.peso, 0)
      
      if (totalWeight === 0) {
        throw new Error(`Peso total é zero para seção ${sectionId}`)
      }

      // Calcular distribuição para cada subseção
      const distribution = subsections.map(subsection => {
        const currentStats = statsMap[subsection.id] || { question_count: 0, target_count: 0 }
        
        // Calcular target baseado no peso proporcional
        const targetCount = Math.ceil((subsection.peso / totalWeight) * totalQuestions)
        const currentCount = currentStats.question_count || 0
        const deficit = Math.max(0, targetCount - currentCount)

        return {
          subsectionId: subsection.id,
          titulo: subsection.titulo,
          conteudo: subsection.conteudo,
          tipo: subsection.tipo,
          peso: subsection.peso,
          ordem: subsection.ordem,
          targetCount,
          currentCount,
          deficit,
          percentual: Math.round((subsection.peso / totalWeight) * 100)
        }
      })

      return distribution
    } catch (error) {
      console.error('Error calculating distribution:', error)
      throw error
    }
  }

  /**
   * Obter subseções que precisam de mais questões (têm déficit)
   * @param {number} sectionId - ID da seção 
   * @param {number} maxQuestions - Máximo de questões a gerar
   * @returns {Promise<Array>} Subseções que precisam de questões
   */
  static async getSubsectionsNeedingQuestions(sectionId, maxQuestions = 10) {
    try {
      const distribution = await this.calculateDistribution(sectionId, maxQuestions)
      
      // Filtrar apenas subseções com déficit
      const needingQuestions = distribution
        .filter(item => item.deficit > 0)
        .sort((a, b) => {
          // Priorizar por déficit maior, depois por peso maior
          if (b.deficit !== a.deficit) return b.deficit - a.deficit
          return b.peso - a.peso
        })

      return needingQuestions
    } catch (error) {
      console.error('Error getting subsections needing questions:', error)
      throw error
    }
  }

  /**
   * Planejar geração de questões para equilibrar distribuição
   * @param {number} sectionId - ID da seção
   * @param {number} questionsToGenerate - Quantidade de questões a gerar
   * @param {boolean} allowContinuous - Permitir geração contínua mesmo se balanceado
   * @returns {Promise<Array>} Plano de geração por subseção
   */
  static async planQuestionGeneration(sectionId, questionsToGenerate = 10, allowContinuous = true) {
    try {
      const distribution = await this.calculateDistribution(sectionId)
      
      if (distribution.length === 0) {
        throw new Error(`Nenhuma subseção encontrada para seção ${sectionId}`)
      }

      // Verificar se há déficit real
      const needingQuestions = distribution.filter(item => item.deficit > 0)
      
      // Se não há déficit e continuous não é permitido, retornar vazio
      if (needingQuestions.length === 0 && !allowContinuous) {
        return []
      }

      const generationPlan = []
      let remainingQuestions = questionsToGenerate

      // FASE 1: Satisfazer déficits existentes primeiro
      if (needingQuestions.length > 0) {
        const sortedNeeds = needingQuestions.sort((a, b) => {
          // Priorizar por déficit maior, depois por peso maior
          if (b.deficit !== a.deficit) return b.deficit - a.deficit
          return b.peso - a.peso
        })

        for (const subsection of sortedNeeds) {
          if (remainingQuestions <= 0) break
          
          const questionsForThis = Math.min(subsection.deficit, remainingQuestions)
          
          if (questionsForThis > 0) {
            generationPlan.push({
              subsectionId: subsection.subsectionId,
              titulo: subsection.titulo,
              conteudo: subsection.conteudo,
              tipo: subsection.tipo,
              questionsToGenerate: questionsForThis,
              currentCount: subsection.currentCount,
              targetCount: subsection.targetCount,
              peso: subsection.peso,
              reason: 'deficit'
            })
            
            remainingQuestions -= questionsForThis
          }
        }
      }

      // FASE 2: Se ainda restam questões e continuous é permitido, distribuir proporcionalmente
      if (remainingQuestions > 0 && allowContinuous) {
        console.log(`📈 Distribuindo ${remainingQuestions} questões adicionais mantendo proporções`)
        
        // Calcular peso total para distribuição proporcional
        const totalWeight = distribution.reduce((sum, sub) => sum + sub.peso, 0)
        
        // Distribuir as questões restantes proporcionalmente ao peso
        const additionalDistribution = distribution.map(subsection => {
          const proportion = subsection.peso / totalWeight
          const additionalQuestions = Math.round(proportion * remainingQuestions)
          
          return {
            ...subsection,
            additionalQuestions: Math.max(0, additionalQuestions)
          }
        }).filter(item => item.additionalQuestions > 0)

        // Ajustar se a soma não bater exatamente com remainingQuestions
        let totalAdditional = additionalDistribution.reduce((sum, item) => sum + item.additionalQuestions, 0)
        
        // Se sobrou ou faltou, ajustar nas subseções de maior peso
        while (totalAdditional !== remainingQuestions && additionalDistribution.length > 0) {
          const highestWeight = additionalDistribution.reduce((max, item) => 
            item.peso > max.peso ? item : max
          )
          
          if (totalAdditional < remainingQuestions) {
            highestWeight.additionalQuestions++
            totalAdditional++
          } else {
            if (highestWeight.additionalQuestions > 0) {
              highestWeight.additionalQuestions--
              totalAdditional--
            } else {
              break
            }
          }
        }

        // Adicionar ao plano de geração
        for (const subsection of additionalDistribution) {
          if (subsection.additionalQuestions > 0) {
            const existingPlan = generationPlan.find(p => p.subsectionId === subsection.subsectionId)
            
            if (existingPlan) {
              existingPlan.questionsToGenerate += subsection.additionalQuestions
              existingPlan.reason = 'deficit+proportional'
            } else {
              generationPlan.push({
                subsectionId: subsection.subsectionId,
                titulo: subsection.titulo,
                conteudo: subsection.conteudo,
                tipo: subsection.tipo,
                questionsToGenerate: subsection.additionalQuestions,
                currentCount: subsection.currentCount,
                targetCount: subsection.targetCount,
                peso: subsection.peso,
                reason: 'proportional'
              })
            }
          }
        }

        remainingQuestions = 0
      }

      // Log do plano final
      if (generationPlan.length > 0) {
        console.log('📋 Plano de geração de questões:')
        generationPlan.forEach(plan => {
          console.log(`  • ${plan.titulo}: ${plan.questionsToGenerate} questões (${plan.reason})`)
        })
      }

      return generationPlan
    } catch (error) {
      console.error('Error planning question generation:', error)
      throw error
    }
  }

  /**
   * Obter resumo da distribuição atual de uma seção
   * @param {number} sectionId - ID da seção
   * @returns {Promise<Object>} Resumo com estatísticas gerais
   */
  static async getDistributionSummary(sectionId) {
    try {
      const distribution = await this.calculateDistribution(sectionId)
      
      const summary = {
        sectionId,
        totalSubsections: distribution.length,
        totalQuestions: distribution.reduce((sum, item) => sum + item.currentCount, 0),
        totalTarget: distribution.reduce((sum, item) => sum + item.targetCount, 0),
        totalDeficit: distribution.reduce((sum, item) => sum + item.deficit, 0),
        balancePercentage: 0,
        subsections: distribution,
        mostOverrepresented: null,
        mostUnderrepresented: null
      }

      // Calcular percentual de equilíbrio
      if (summary.totalTarget > 0) {
        summary.balancePercentage = Math.round(
          (Math.min(summary.totalQuestions, summary.totalTarget) / summary.totalTarget) * 100
        )
      }

      // Identificar subseções mais/menos representadas
      const withPercentages = distribution.map(item => ({
        ...item,
        actualPercentage: summary.totalQuestions > 0 
          ? Math.round((item.currentCount / summary.totalQuestions) * 100)
          : 0,
        deviationFromTarget: item.currentCount - item.targetCount
      }))

      summary.mostOverrepresented = withPercentages
        .filter(item => item.deviationFromTarget > 0)
        .sort((a, b) => b.deviationFromTarget - a.deviationFromTarget)[0] || null

      summary.mostUnderrepresented = withPercentages
        .filter(item => item.deviationFromTarget < 0)
        .sort((a, b) => a.deviationFromTarget - b.deviationFromTarget)[0] || null

      return summary
    } catch (error) {
      console.error('Error getting distribution summary:', error)
      throw error
    }
  }

  /**
   * Atualizar targets de todas as subseções para um novo total
   * @param {number} newTargetTotal - Nova meta total de questões por seção
   * @returns {Promise<void>}
   */
  static async updateAllTargets(newTargetTotal = 10) {
    try {
      const { error } = await supabase.rpc('update_all_targets', {
        p_target_per_section: newTargetTotal
      })

      if (error) throw error
      
      console.log(`Targets atualizados para ${newTargetTotal} questões por seção`)
    } catch (error) {
      console.error('Error updating targets:', error)
      throw error
    }
  }

  /**
   * Marcar questões existentes com subsection_id baseado no conteúdo
   * @param {number} sectionId - ID da seção
   * @returns {Promise<number>} Número de questões atualizadas
   */
  static async assignSubsectionsToExistingQuestions(sectionId) {
    try {
      // Buscar questões da seção sem subsection_id
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('id, question_text')
        .eq('section_id', sectionId)
        .is('subsection_id', null)

      if (questionsError) throw questionsError

      if (!questions || questions.length === 0) {
        return 0
      }

      // Buscar subseções da seção
      const subsections = await this.getSubsections(sectionId)
      
      let updatedCount = 0

      // Para cada questão, tentar identificar a subseção baseada no conteúdo
      for (const question of questions) {
        const bestMatch = this.findBestSubsectionMatch(question.question_text, subsections)
        
        if (bestMatch) {
          const { error: updateError } = await supabase
            .from('questions')
            .update({ subsection_id: bestMatch.id })
            .eq('id', question.id)

          if (updateError) {
            console.error(`Error updating question ${question.id}:`, updateError)
          } else {
            updatedCount++
          }
        }
      }

      console.log(`${updatedCount} questões atualizadas com subsection_id`)
      return updatedCount
    } catch (error) {
      console.error('Error assigning subsections to existing questions:', error)
      throw error
    }
  }

  /**
   * Encontrar a melhor subseção para uma questão baseado no conteúdo
   * @param {string} questionText - Texto da questão
   * @param {Array} subsections - Lista de subseções
   * @returns {Object|null} Melhor subseção ou null
   */
  static findBestSubsectionMatch(questionText, subsections) {
    if (!questionText || !subsections) return null

    const questionLower = questionText.toLowerCase()
    let bestMatch = null
    let bestScore = 0

    for (const subsection of subsections) {
      const contentLower = subsection.conteudo.toLowerCase()
      const titleLower = subsection.titulo.toLowerCase()
      
      let score = 0

      // Verificar correspondências no conteúdo
      const contentWords = contentLower.split(/\s+/)
      for (const word of contentWords) {
        if (word.length > 3 && questionLower.includes(word)) {
          score += 2
        }
      }

      // Verificar correspondências no título
      const titleWords = titleLower.split(/\s+/)
      for (const word of titleWords) {
        if (word.length > 3 && questionLower.includes(word)) {
          score += 1
        }
      }

      // Verificações genéricas baseadas no tipo de conteúdo
      if (subsection.tipo === 'consequencia' && (
        questionLower.includes('reclusão') || 
        questionLower.includes('detenção') || 
        questionLower.includes('multa') ||
        questionLower.includes('pena')
      )) {
        score += 3
      }

      if (subsection.tipo === 'conceito_base' && (
        questionLower.includes('falsificar') || 
        questionLower.includes('tipifica') ||
        questionLower.includes('crime') ||
        questionLower.includes('conduta')
      )) {
        score += 3
      }

      if (subsection.tipo === 'objeto_crime' && (
        questionLower.includes('objeto') ||
        questionLower.includes('documento') ||
        questionLower.includes('papel') ||
        questionLower.includes('selo')
      )) {
        score += 2
      }

      if (score > bestScore) {
        bestScore = score
        bestMatch = subsection
      }
    }

    return bestScore > 2 ? bestMatch : null // Apenas se tiver uma correspondência razoável
  }
}

export default SubsectionDistributionService