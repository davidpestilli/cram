import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Layout from '../components/Layout/Layout'
import LoadingSpinner from '../components/LoadingSpinner'
import contentManagementService from '../services/contentManagementService'

const AdminContentManager = () => {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState(null)
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [importData, setImportData] = useState('')

  // Load dashboard data
  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const data = await contentManagementService.getDashboardData()
      setDashboardData(data)
    } catch (error) {
      console.error('Error loading dashboard:', error)
    }
    setLoading(false)
  }

  const handleCreateSubject = async (subjectData) => {
    try {
      const result = await contentManagementService.createSubject(subjectData)
      if (result.success) {
        alert('Matéria criada com sucesso!')
        setShowCreateModal(false)
        loadDashboardData()
      } else {
        alert('Erro ao criar matéria: ' + result.message)
      }
    } catch (error) {
      alert('Erro ao criar matéria: ' + error.message)
    }
  }

  const handleImportJSON = async () => {
    try {
      const jsonData = JSON.parse(importData)
      const result = await contentManagementService.importContentFromJSON(jsonData)
      
      if (result.success) {
        alert('Conteúdo importado com sucesso!')
        setImportData('')
        loadDashboardData()
      } else {
        alert('Erro na importação: ' + result.message)
      }
    } catch (error) {
      alert('JSON inválido: ' + error.message)
    }
  }

  const handleExportSubject = async (subjectId) => {
    try {
      const result = await contentManagementService.exportSubjectToJSON(subjectId)
      
      if (result.success) {
        // Create download link
        const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = result.filename
        a.click()
        URL.revokeObjectURL(url)
      } else {
        alert('Erro ao exportar: ' + result.message)
      }
    } catch (error) {
      alert('Erro ao exportar: ' + error.message)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" text="Carregando gerenciador de conteúdo..." />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gerenciador de Conteúdo</h1>
          <p className="text-gray-600 mt-2">
            Administre matérias, seções e versionamento de conteúdo
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'dashboard', name: 'Dashboard', icon: '📊' },
              { id: 'subjects', name: 'Matérias', icon: '📚' },
              { id: 'import', name: 'Importar', icon: '⬆️' },
              { id: 'templates', name: 'Templates', icon: '📄' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && (
              <DashboardTab data={dashboardData} />
            )}

            {activeTab === 'subjects' && (
              <SubjectsTab 
                subjects={dashboardData?.subjects || []}
                onCreateSubject={() => setShowCreateModal(true)}
                onExportSubject={handleExportSubject}
                onRefresh={loadDashboardData}
              />
            )}

            {activeTab === 'import' && (
              <ImportTab 
                importData={importData}
                setImportData={setImportData}
                onImport={handleImportJSON}
              />
            )}

            {activeTab === 'templates' && (
              <TemplatesTab />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Create Subject Modal */}
        {showCreateModal && (
          <CreateSubjectModal 
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreateSubject}
          />
        )}
      </div>
    </Layout>
  )
}

// Dashboard Tab Component
const DashboardTab = ({ data }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {/* Stats Cards */}
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">Total de Matérias</h3>
      <p className="text-3xl font-bold text-blue-600">{data?.totalSubjects || 0}</p>
    </div>
    
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">Matérias Ativas</h3>
      <p className="text-3xl font-bold text-green-600">{data?.activeSubjects || 0}</p>
    </div>
    
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">Últimas Atualizações</h3>
      <p className="text-3xl font-bold text-purple-600">{data?.versionHistory?.length || 0}</p>
    </div>

    {/* Recent Version History */}
    <div className="md:col-span-3 bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Histórico de Versões Recente</h3>
      <div className="space-y-3">
        {data?.versionHistory?.slice(0, 5).map(version => (
          <div key={version.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <div>
              <p className="font-medium">{version.subjects?.name}</p>
              <p className="text-sm text-gray-600">{version.description}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">{version.old_version} → {version.new_version}</p>
              <p className="text-xs text-gray-500">
                {new Date(version.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        )) || <p className="text-gray-500">Nenhum histórico encontrado</p>}
      </div>
    </div>
  </div>
)

// Subjects Tab Component  
const SubjectsTab = ({ subjects, onCreateSubject, onExportSubject, onRefresh }) => (
  <div>
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-semibold">Matérias Cadastradas</h2>
      <div className="space-x-2">
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
        >
          🔄 Atualizar
        </button>
        <button
          onClick={onCreateSubject}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          ➕ Nova Matéria
        </button>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {subjects.map(subject => (
        <div key={subject.id} className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{subject.icon}</span>
              <h3 className="font-semibold">{subject.name}</h3>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              subject.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
            }`}>
              {subject.is_active ? 'Ativo' : 'Inativo'}
            </span>
          </div>
          
          <p className="text-gray-600 text-sm mb-3">{subject.description}</p>
          
          <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
            <span>Versão: {subject.version}</span>
            <span>{subject.sections?.length || 0} seções</span>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => onExportSubject(subject.id)}
              className="flex-1 px-3 py-2 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200 transition-colors"
            >
              ⬇️ Exportar
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
)

// Import Tab Component
const ImportTab = ({ importData, setImportData, onImport }) => (
  <div className="bg-white p-6 rounded-lg shadow">
    <h2 className="text-xl font-semibold mb-4">Importar Conteúdo JSON</h2>
    
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cole o JSON do conteúdo:
        </label>
        <textarea
          value={importData}
          onChange={(e) => setImportData(e.target.value)}
          className="w-full h-64 p-3 border border-gray-300 rounded-md font-mono text-sm"
          placeholder="Cole aqui o JSON da matéria..."
        />
      </div>
      
      <div className="flex space-x-2">
        <button
          onClick={onImport}
          disabled={!importData.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          📥 Importar Conteúdo
        </button>
        
        <button
          onClick={() => setImportData('')}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
        >
          🗑️ Limpar
        </button>
      </div>
    </div>
  </div>
)

// Templates Tab Component
const TemplatesTab = () => {
  const [selectedTemplate, setSelectedTemplate] = useState('law')
  
  const templates = {
    law: contentManagementService.generateSubjectTemplate('law'),
    general: contentManagementService.generateSubjectTemplate('general')
  }
  
  const copyTemplate = () => {
    navigator.clipboard.writeText(JSON.stringify(templates[selectedTemplate], null, 2))
    alert('Template copiado para a área de transferência!')
  }
  
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Templates de Matérias</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Template:
          </label>
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="w-full md:w-64 p-2 border border-gray-300 rounded-md"
          >
            <option value="law">Matéria Jurídica</option>
            <option value="general">Matéria Geral</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Template JSON:
          </label>
          <pre className="w-full h-64 p-3 border border-gray-300 rounded-md bg-gray-50 overflow-auto text-sm font-mono">
            {JSON.stringify(templates[selectedTemplate], null, 2)}
          </pre>
        </div>
        
        <button
          onClick={copyTemplate}
          className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
        >
          📋 Copiar Template
        </button>
      </div>
    </div>
  )
}

// Create Subject Modal Component
const CreateSubjectModal = ({ onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '📚',
    color: 'blue',
    difficulty: 'medium',
    sections: [{ name: '', description: '' }]
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onCreate(formData)
  }

  const addSection = () => {
    setFormData(prev => ({
      ...prev,
      sections: [...prev.sections, { name: '', description: '' }]
    }))
  }

  const updateSection = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) => 
        i === index ? { ...section, [field]: value } : section
      )
    }))
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Criar Nova Matéria</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Ícone</label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Descrição</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-2 border rounded-md h-20"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Cor</label>
                <select
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="blue">Azul</option>
                  <option value="red">Vermelho</option>
                  <option value="green">Verde</option>
                  <option value="yellow">Amarelo</option>
                  <option value="purple">Roxo</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Dificuldade</label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="easy">Fácil</option>
                  <option value="medium">Médio</option>
                  <option value="hard">Difícil</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium">Seções</label>
                <button
                  type="button"
                  onClick={addSection}
                  className="text-blue-500 text-sm hover:text-blue-700"
                >
                  + Adicionar Seção
                </button>
              </div>
              
              {formData.sections.map((section, index) => (
                <div key={index} className="border p-3 rounded-md mb-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Nome da seção"
                      value={section.name}
                      onChange={(e) => updateSection(index, 'name', e.target.value)}
                      className="p-2 border rounded-md"
                    />
                    <input
                      type="text"
                      placeholder="Descrição"
                      value={section.description}
                      onChange={(e) => updateSection(index, 'description', e.target.value)}
                      className="p-2 border rounded-md"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
              >
                Criar Matéria
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AdminContentManager