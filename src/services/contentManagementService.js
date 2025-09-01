import { supabase } from '../lib/supabase'

// Content management system for adding new subjects and managing versions
class ContentManagementService {
  
  // Create a new subject with sections
  async createSubject(subjectData) {
    try {
      const {
        name,
        description,
        icon,
        color,
        difficulty,
        sections = [],
        isActive = false
      } = subjectData

      // Create the subject
      const { data: subject, error: subjectError } = await supabase
        .from('subjects')
        .insert([{
          name,
          description,
          icon,
          color,
          difficulty,
          is_active: isActive,
          created_at: new Date().toISOString(),
          version: '1.0.0'
        }])
        .select()

      if (subjectError) throw subjectError

      const subjectId = subject[0].id

      // Create sections for the subject
      if (sections.length > 0) {
        const sectionsToInsert = sections.map((section, index) => ({
          subject_id: subjectId,
          name: section.name,
          description: section.description || '',
          order_index: section.order || index + 1,
          content_json: section.content || {},
          is_active: section.isActive !== false,
          created_at: new Date().toISOString()
        }))

        const { error: sectionsError } = await supabase
          .from('sections')
          .insert(sectionsToInsert)

        if (sectionsError) throw sectionsError
      }

      return {
        success: true,
        subject: subject[0],
        message: `Matéria "${name}" criada com sucesso com ${sections.length} seções.`
      }

    } catch (error) {
      console.error('Error creating subject:', error)
      return {
        success: false,
        error: error.message,
        message: 'Erro ao criar matéria. Tente novamente.'
      }
    }
  }

  // Get subject template for creation
  getSubjectTemplate() {
    return {
      name: '',
      description: '',
      icon: '📚',
      color: 'blue',
      difficulty: 'medium',
      sections: [
        {
          name: 'Seção 1',
          description: 'Descrição da primeira seção',
          order: 1,
          content: {
            topics: [],
            examples: [],
            references: []
          },
          isActive: true
        }
      ],
      isActive: false
    }
  }

  // Update subject version
  async updateSubjectVersion(subjectId, versionData) {
    try {
      const currentVersion = await this.getSubjectVersion(subjectId)
      const newVersion = this.incrementVersion(currentVersion, versionData.type)

      const { data, error } = await supabase
        .from('subjects')
        .update({
          version: newVersion,
          updated_at: new Date().toISOString(),
          ...versionData.changes
        })
        .eq('id', subjectId)
        .select()

      if (error) throw error

      // Log version change
      await this.logVersionChange(subjectId, currentVersion, newVersion, versionData)

      return {
        success: true,
        version: newVersion,
        subject: data[0]
      }

    } catch (error) {
      console.error('Error updating subject version:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Get current subject version
  async getSubjectVersion(subjectId) {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('version')
        .eq('id', subjectId)
        .single()

      if (error) throw error
      return data.version || '1.0.0'
    } catch (error) {
      console.error('Error getting subject version:', error)
      return '1.0.0'
    }
  }

  // Increment version based on change type
  incrementVersion(currentVersion, changeType = 'patch') {
    const parts = currentVersion.split('.').map(Number)
    const [major, minor, patch] = parts

    switch (changeType) {
      case 'major':
        return `${major + 1}.0.0`
      case 'minor':
        return `${major}.${minor + 1}.0`
      case 'patch':
      default:
        return `${major}.${minor}.${patch + 1}`
    }
  }

  // Log version changes
  async logVersionChange(subjectId, oldVersion, newVersion, changeData) {
    try {
      await supabase
        .from('version_history')
        .insert([{
          subject_id: subjectId,
          old_version: oldVersion,
          new_version: newVersion,
          change_type: changeData.type || 'patch',
          changes: changeData.changes || {},
          description: changeData.description || 'Atualização de versão',
          created_at: new Date().toISOString()
        }])
    } catch (error) {
      console.error('Error logging version change:', error)
    }
  }

  // Import content from JSON
  async importContentFromJSON(jsonData, subjectId = null) {
    try {
      // Validate JSON structure
      const validationResult = this.validateContentJSON(jsonData)
      if (!validationResult.valid) {
        return {
          success: false,
          errors: validationResult.errors,
          message: 'JSON inválido. Verifique a estrutura.'
        }
      }

      // If no subjectId provided, create new subject
      if (!subjectId) {
        const createResult = await this.createSubject({
          name: jsonData.name || 'Nova Matéria',
          description: jsonData.description || '',
          icon: jsonData.icon || '📚',
          color: jsonData.color || 'blue',
          difficulty: jsonData.difficulty || 'medium',
          sections: jsonData.sections || [],
          isActive: false
        })

        return createResult
      }

      // Update existing subject
      const updateResult = await this.updateSubjectContent(subjectId, jsonData)
      return updateResult

    } catch (error) {
      console.error('Error importing content:', error)
      return {
        success: false,
        error: error.message,
        message: 'Erro ao importar conteúdo.'
      }
    }
  }

  // Validate content JSON structure
  validateContentJSON(jsonData) {
    const errors = []

    // Required fields
    if (!jsonData.name) errors.push('Nome da matéria é obrigatório')
    if (!jsonData.sections || !Array.isArray(jsonData.sections)) {
      errors.push('Seções são obrigatórias e devem ser um array')
    }

    // Validate sections
    if (jsonData.sections) {
      jsonData.sections.forEach((section, index) => {
        if (!section.name) {
          errors.push(`Seção ${index + 1}: Nome é obrigatório`)
        }
        if (section.content && typeof section.content !== 'object') {
          errors.push(`Seção ${index + 1}: Conteúdo deve ser um objeto`)
        }
      })
    }

    // Validate colors and icons
    const validColors = ['blue', 'red', 'green', 'yellow', 'purple', 'pink', 'gray']
    if (jsonData.color && !validColors.includes(jsonData.color)) {
      errors.push(`Cor deve ser uma das opções: ${validColors.join(', ')}`)
    }

    const validDifficulties = ['easy', 'medium', 'hard']
    if (jsonData.difficulty && !validDifficulties.includes(jsonData.difficulty)) {
      errors.push(`Dificuldade deve ser uma das opções: ${validDifficulties.join(', ')}`)
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  // Update subject content
  async updateSubjectContent(subjectId, contentData) {
    try {
      // Update subject metadata
      const subjectUpdates = {}
      if (contentData.description) subjectUpdates.description = contentData.description
      if (contentData.icon) subjectUpdates.icon = contentData.icon
      if (contentData.color) subjectUpdates.color = contentData.color
      if (contentData.difficulty) subjectUpdates.difficulty = contentData.difficulty

      if (Object.keys(subjectUpdates).length > 0) {
        await supabase
          .from('subjects')
          .update({
            ...subjectUpdates,
            updated_at: new Date().toISOString()
          })
          .eq('id', subjectId)
      }

      // Update or create sections
      if (contentData.sections) {
        // Get existing sections
        const { data: existingSections } = await supabase
          .from('sections')
          .select('*')
          .eq('subject_id', subjectId)

        const existingSectionIds = existingSections?.map(s => s.id) || []

        // Process new sections
        for (let i = 0; i < contentData.sections.length; i++) {
          const section = contentData.sections[i]
          
          if (section.id && existingSectionIds.includes(section.id)) {
            // Update existing section
            await supabase
              .from('sections')
              .update({
                name: section.name,
                description: section.description || '',
                content_json: section.content || {},
                order_index: section.order || i + 1,
                updated_at: new Date().toISOString()
              })
              .eq('id', section.id)
          } else {
            // Create new section
            await supabase
              .from('sections')
              .insert([{
                subject_id: subjectId,
                name: section.name,
                description: section.description || '',
                content_json: section.content || {},
                order_index: section.order || i + 1,
                is_active: section.isActive !== false,
                created_at: new Date().toISOString()
              }])
          }
        }
      }

      // Update version
      await this.updateSubjectVersion(subjectId, {
        type: 'minor',
        description: 'Conteúdo atualizado via importação',
        changes: { contentUpdated: true }
      })

      return {
        success: true,
        message: 'Conteúdo atualizado com sucesso.'
      }

    } catch (error) {
      console.error('Error updating subject content:', error)
      return {
        success: false,
        error: error.message,
        message: 'Erro ao atualizar conteúdo.'
      }
    }
  }

  // Export subject to JSON
  async exportSubjectToJSON(subjectId) {
    try {
      // Get subject data
      const { data: subject, error: subjectError } = await supabase
        .from('subjects')
        .select('*')
        .eq('id', subjectId)
        .single()

      if (subjectError) throw subjectError

      // Get sections data
      const { data: sections, error: sectionsError } = await supabase
        .from('sections')
        .select('*')
        .eq('subject_id', subjectId)
        .order('order_index')

      if (sectionsError) throw sectionsError

      // Format export data
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        subject: {
          name: subject.name,
          description: subject.description,
          icon: subject.icon,
          color: subject.color,
          difficulty: subject.difficulty,
          version: subject.version,
          sections: sections?.map(section => ({
            name: section.name,
            description: section.description,
            order: section.order_index,
            content: section.content_json,
            isActive: section.is_active
          })) || []
        }
      }

      return {
        success: true,
        data: exportData,
        filename: `${subject.name.replace(/\s+/g, '_')}_v${subject.version}.json`
      }

    } catch (error) {
      console.error('Error exporting subject:', error)
      return {
        success: false,
        error: error.message,
        message: 'Erro ao exportar matéria.'
      }
    }
  }

  // Get content management dashboard data
  async getDashboardData() {
    try {
      // Get subjects with stats
      const { data: subjects, error: subjectsError } = await supabase
        .from('subjects')
        .select(`
          *,
          sections(count)
        `)
        .order('created_at', { ascending: false })

      if (subjectsError) throw subjectsError

      // Get version history
      const { data: versionHistory, error: versionError } = await supabase
        .from('version_history')
        .select(`
          *,
          subjects(name)
        `)
        .order('created_at', { ascending: false })
        .limit(10)

      if (versionError) throw versionError

      // Get usage statistics
      const { data: usageStats, error: usageError } = await supabase
        .from('user_answers')
        .select(`
          created_at,
          questions!inner(
            sections!inner(
              subject_id,
              subjects!inner(name)
            )
          )
        `)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

      if (usageError) console.warn('Could not load usage stats:', usageError)

      return {
        subjects: subjects || [],
        versionHistory: versionHistory || [],
        usageStats: usageStats || [],
        totalSubjects: subjects?.length || 0,
        activeSubjects: subjects?.filter(s => s.is_active).length || 0
      }

    } catch (error) {
      console.error('Error getting dashboard data:', error)
      return {
        subjects: [],
        versionHistory: [],
        usageStats: [],
        totalSubjects: 0,
        activeSubjects: 0
      }
    }
  }

  // Template generators for different subjects
  generateSubjectTemplate(subjectType = 'law') {
    const templates = {
      law: {
        name: 'Nova Matéria Jurídica',
        description: 'Descrição da matéria jurídica',
        icon: '⚖️',
        color: 'blue',
        difficulty: 'medium',
        sections: [
          {
            name: 'Conceitos Fundamentais',
            description: 'Conceitos básicos e definições',
            order: 1,
            content: {
              topics: ['Definições', 'Princípios', 'Características'],
              examples: [],
              references: []
            }
          },
          {
            name: 'Aplicação Prática',
            description: 'Casos práticos e jurisprudência',
            order: 2,
            content: {
              topics: ['Casos Práticos', 'Jurisprudência', 'Doutrina'],
              examples: [],
              references: []
            }
          }
        ]
      },
      general: {
        name: 'Nova Matéria',
        description: 'Descrição da matéria',
        icon: '📚',
        color: 'green',
        difficulty: 'medium',
        sections: [
          {
            name: 'Introdução',
            description: 'Conceitos introdutórios',
            order: 1,
            content: {
              topics: [],
              examples: [],
              references: []
            }
          }
        ]
      }
    }

    return templates[subjectType] || templates.general
  }
}

export default new ContentManagementService()