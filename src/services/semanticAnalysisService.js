import embeddingsService from './embeddingsService'
import { supabase } from '../lib/supabase'

class SemanticAnalysisService {
  constructor() {
    this.clusterThreshold = 0.7  // Reduzido de 0.8 para 0.7 (muito alto estava impedindo clusters)
    this.diversityThreshold = 0.6
  }

  async analyzeExistingQuestions(subjectId, sectionId = null) {
    try {
      console.log(`🔍 Analisando espaço semântico para subject ${subjectId}${sectionId ? `, section ${sectionId}` : ''}...`)

      // Buscar todas as questões existentes (não apenas da seção atual)
      let query = supabase
        .from('questions')
        .select('id, question_text, explanation, embedding, content_categories, section_id')
        .eq('subject_id', subjectId)
        .not('embedding', 'is', null)

      // Se especificou seção, focar mais nela mas incluir outras também
      if (sectionId) {
        // Buscar todas do subject, priorizando a seção atual
        query = query.order('section_id', { ascending: sectionId })
      }

      const { data: questions, error } = await query.limit(500)

      if (error) {
        throw error
      }

      if (!questions || questions.length === 0) {
        console.log('📊 Nenhuma questão existente encontrada')
        return {
          totalQuestions: 0,
          clusters: [],
          gaps: [],
          overexploredAreas: [],
          suggestions: ['Explorar conceitos básicos', 'Abordar aspectos práticos', 'Incluir casos específicos']
        }
      }

      console.log(`📊 Analisando ${questions.length} questões existentes...`)

      // Analisar clusters semânticos
      const clusters = await this.identifySemanticClusters(questions)
      
      // Identificar áreas superexploradas
      const overexploredAreas = this.identifyOverexploredAreas(clusters)
      
      // Identificar lacunas
      const gaps = await this.identifySemanticGaps(questions, clusters)
      
      // Gerar sugestões para diversificação
      const suggestions = this.generateDiversificationSuggestions(clusters, gaps, overexploredAreas)

      return {
        totalQuestions: questions.length,
        clusters,
        gaps,
        overexploredAreas,
        suggestions,
        analysis: {
          diversity: this.calculateDiversityScore(clusters),
          coverage: this.calculateCoverageScore(clusters)
        }
      }

    } catch (error) {
      console.error('❌ Erro na análise semântica:', error)
      return {
        totalQuestions: 0,
        clusters: [],
        gaps: [],
        overexploredAreas: [],
        suggestions: ['Gerar questões variadas']
      }
    }
  }

  async identifySemanticClusters(questions) {
    const clusters = []
    const processed = new Set()
    let maxSimilarity = 0
    let similarityCount = 0
    let validEmbeddings = 0

    // Verificar se há embeddings válidos
    const questionsWithEmbeddings = questions.filter(q => {
      const hasValidEmbedding = q.embedding && Array.isArray(q.embedding) && q.embedding.length > 0
      if (hasValidEmbedding) validEmbeddings++
      return hasValidEmbedding
    })

    console.log(`📊 Debug clustering: ${questions.length} questões total, ${validEmbeddings} com embeddings válidos`)

    if (validEmbeddings < 2) {
      console.log(`⚠️ Poucos embeddings válidos (${validEmbeddings}) - não é possível formar clusters`)
      return clusters
    }

    for (let i = 0; i < questionsWithEmbeddings.length; i++) {
      if (processed.has(i)) continue

      const question = questionsWithEmbeddings[i]
      const cluster = {
        centroid: question,
        members: [question],
        topics: this.extractTopicsFromCategories(question.content_categories),
        avgSimilarity: 0
      }

      // Encontrar questões similares
      for (let j = i + 1; j < questionsWithEmbeddings.length; j++) {
        if (processed.has(j)) continue

        const similarity = embeddingsService.calculateSimilarity(
          question.embedding,
          questionsWithEmbeddings[j].embedding
        )

        similarityCount++
        maxSimilarity = Math.max(maxSimilarity, similarity)

        if (similarity > this.clusterThreshold) {
          cluster.members.push(questionsWithEmbeddings[j])
          processed.add(j)
        }
      }

      if (cluster.members.length > 1) {
        cluster.avgSimilarity = this.calculateClusterSimilarity(cluster.members)
        clusters.push(cluster)
        console.log(`✅ Cluster criado: ${cluster.members.length} membros, similaridade média: ${cluster.avgSimilarity.toFixed(3)}`)
      }

      processed.add(i)
    }

    // Ordenar por tamanho (clusters maiores primeiro)
    clusters.sort((a, b) => b.members.length - a.members.length)

    console.log(`🎯 Identificados ${clusters.length} clusters semânticos`)
    console.log(`📊 Debug: ${similarityCount} comparações, similaridade máxima: ${maxSimilarity.toFixed(3)}, threshold: ${this.clusterThreshold}`)
    
    if (clusters.length === 0 && maxSimilarity < this.clusterThreshold) {
      console.log(`💡 Sugestão: Threshold muito alto (${this.clusterThreshold}), máxima similaridade encontrada: ${maxSimilarity.toFixed(3)}`)
    }
    
    return clusters
  }

  identifyOverexploredAreas(clusters) {
    // Áreas com muitas questões similares (mais de 3 questões muito parecidas)
    return clusters
      .filter(cluster => cluster.members.length >= 3 && cluster.avgSimilarity > 0.85)
      .map(cluster => ({
        topic: cluster.topics.join(', '),
        questionCount: cluster.members.length,
        similarity: cluster.avgSimilarity,
        examples: cluster.members.slice(0, 2).map(q => q.question_text.substring(0, 100) + '...'),
        suggestion: `Evitar questões sobre: ${cluster.topics.join(', ')}`
      }))
  }

  async identifySemanticGaps(questions, clusters) {
    // Identificar áreas pouco exploradas comparando com categorias disponíveis
    const coveredTopics = new Set()
    
    clusters.forEach(cluster => {
      cluster.topics.forEach(topic => coveredTopics.add(topic))
    })

    // Topics comuns em direito penal que podem estar faltando
    const commonTopics = [
      'elementos_subjetivos', 'dolo', 'culpa', 'tentativa', 'consumacao',
      'sujeito_ativo', 'sujeito_passivo', 'bem_juridico', 'tipicidade',
      'antijuridicidade', 'culpabilidade', 'penas', 'circunstancias',
      'concurso_crimes', 'prescricao'
    ]

    const gaps = commonTopics
      .filter(topic => !coveredTopics.has(topic))
      .map(topic => ({
        topic,
        suggestion: `Explorar aspectos de: ${topic.replace(/_/g, ' ')}`
      }))

    return gaps.slice(0, 5) // Limitar a 5 gaps principais
  }

  generateDiversificationSuggestions(clusters, gaps, overexploredAreas) {
    const suggestions = []

    // Sugestões baseadas em gaps
    gaps.forEach(gap => {
      suggestions.push(`FOQUE EM: ${gap.suggestion}`)
    })

    // Sugestões para evitar superexploração
    overexploredAreas.forEach(area => {
      suggestions.push(`EVITE: ${area.suggestion}`)
    })

    // Sugestões gerais de diversificação
    if (clusters.length < 3) {
      suggestions.push('DIVERSIFIQUE: Aborde diferentes aspectos do tema')
    }

    // Sugestões específicas de formato
    suggestions.push('VARIE: Alterne entre questões conceituais e práticas')
    suggestions.push('EXPLORE: Diferentes níveis de dificuldade')

    return suggestions.slice(0, 6) // Máximo 6 sugestões
  }

  calculateClusterSimilarity(members) {
    if (members.length < 2) return 0

    let totalSimilarity = 0
    let comparisons = 0

    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        totalSimilarity += embeddingsService.calculateSimilarity(
          members[i].embedding,
          members[j].embedding
        )
        comparisons++
      }
    }

    return comparisons > 0 ? totalSimilarity / comparisons : 0
  }

  calculateDiversityScore(clusters) {
    if (clusters.length === 0) return 0
    
    // Diversidade é maior quando há muitos clusters pequenos
    const avgClusterSize = clusters.reduce((sum, c) => sum + c.members.length, 0) / clusters.length
    return Math.max(0, 1 - (avgClusterSize / 10)) // Normalizado
  }

  calculateCoverageScore(clusters) {
    // Cobertura baseada no número de tópicos únicos cobertos
    const uniqueTopics = new Set()
    clusters.forEach(cluster => {
      cluster.topics.forEach(topic => uniqueTopics.add(topic))
    })
    
    return Math.min(1, uniqueTopics.size / 10) // Normalizado para 10 tópicos esperados
  }

  extractTopicsFromCategories(categories) {
    if (!categories || !Array.isArray(categories)) return ['geral']
    
    return categories.filter(cat => cat && cat.trim().length > 0)
  }

  async generateGuidedPrompt(basePrompt, sectionContent, analysis) {
    let guidedPrompt = basePrompt

    if (analysis.suggestions.length > 0) {
      guidedPrompt += '\n\nINSTRUÇÕES ESPECÍFICAS DE DIVERSIFICAÇÃO:'
      analysis.suggestions.forEach(suggestion => {
        guidedPrompt += `\n• ${suggestion}`
      })
    }

    if (analysis.overexploredAreas.length > 0) {
      guidedPrompt += '\n\nEVITE criar questões muito similares a estas já existentes:'
      analysis.overexploredAreas.forEach(area => {
        guidedPrompt += `\n• ${area.examples[0]}`
      })
    }

    guidedPrompt += '\n\nCRIE questões ORIGINAIS e DIVERSAS que complementem o conhecimento existente.'

    return guidedPrompt
  }
}

export default new SemanticAnalysisService()