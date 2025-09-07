import { useState } from 'react'
import { generateQuestionsDirectly, generateQuestionsProgressively, testDirectConnection } from '../services/directAIService'
import embeddingsService from '../services/embeddingsService'
import questionDeduplicationService from '../services/questionDeduplicationService'
import { QuestionsService } from '../services/questionsService'

const AITestPage = () => {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [sectionData, setSectionData] = useState({
    id: 1,
    titulo: "Falsificação de Papéis Públicos - Conceitos Básicos",
    artigo: "Art. 293",
    conteudo: {
      tipificacao: "Falsificar, fabricando-os ou alterando-os:",
      objetos: [
        "selo destinado a controle tributário, papel selado ou qualquer papel de emissão legal destinado à arrecadação de tributo",
        "papel de crédito público que não seja moeda de curso legal",
        "vale postal",
        "cautela de penhor, caderneta de depósito de caixa econômica",
        "talão, recibo, guia, alvará ou qualquer outro documento relativo a arrecadação de rendas públicas",
        "bilhete, passe ou conhecimento de empresa de transporte administrada pela União, por Estado ou por Município"
      ],
      pena: "reclusão, de dois a oito anos, e multa",
      pontos_chave: [
        "Crime de falsificação documental específico para papéis públicos",
        "Duas modalidades: fabricação (criar do nada) e alteração (modificar existente)",
        "Objetos protegidos são específicos e taxativos",
        "Pena mais grave que falsificação de documento particular"
      ]
    }
  })

  const testAI = async () => {
    setLoading(true)
    setError(null)
    setResults({
      success: false,
      questionsCount: 0,
      questions: [],
      timestamp: new Date().toISOString(),
      mode: 'progressive',
      progress: { current: 0, total: 5 }
    })

    try {
      console.log('🧪 Iniciando teste PROGRESSIVO da IA...')
      console.log('📋 Dados da seção:', sectionData)
      
      const result = await generateQuestionsProgressively(sectionData, 5, (progress) => {
        console.log('📊 Progresso:', progress)
        
        setResults(prev => ({
          ...prev,
          questionsCount: progress.questions.length,
          questions: progress.questions,
          progress: {
            current: progress.current,
            total: progress.total
          },
          currentQuestion: progress.question,
          lastError: progress.error
        }))
      })
      
      console.log('✅ Processo concluído:', result)
      setResults(prev => ({
        ...prev,
        success: true,
        questionsCount: result.questions.length,
        questions: result.questions,
        errors: result.errors,
        finalResult: result
      }))
    } catch (err) {
      console.error('❌ Erro no teste PROGRESSIVO:', err)
      setError({
        message: err.message,
        details: err.response?.data || err.stack,
        type: 'progressive_ai_error'
      })
    } finally {
      setLoading(false)
    }
  }

  const testConnection = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await testDirectConnection()
      setResults({
        success: result.status === 'success',
        connectionTest: result,
        timestamp: new Date().toISOString(),
        mode: 'connection_test'
      })
    } catch (err) {
      setError({
        message: 'Erro no teste de conexão: ' + err.message,
        type: 'connection_error'
      })
    } finally {
      setLoading(false)
    }
  }

  const testEmbeddingsSystem = async () => {
    setLoading(true)
    setError(null)
    setResults({
      success: false,
      timestamp: new Date().toISOString(),
      mode: 'embeddings_test',
      steps: []
    })

    try {
      console.log('🧪 Testando sistema completo de embeddings...')
      const steps = []

      // Etapa 1: Testar conexão OpenAI
      steps.push({ name: 'OpenAI Connection', status: 'testing', message: 'Testando conexão OpenAI...' })
      setResults(prev => ({ ...prev, steps: [...steps] }))

      const openaiTest = await embeddingsService.testConnection()
      steps[0].status = openaiTest.status === 'success' ? 'success' : 'error'
      steps[0].message = openaiTest.message
      steps[0].details = openaiTest
      setResults(prev => ({ ...prev, steps: [...steps] }))

      // Etapa 2: Gerar questões com 3F+2V
      steps.push({ name: '3F+2V Generation', status: 'testing', message: 'Gerando 5 questões com distribuição 3F+2V...' })
      setResults(prev => ({ ...prev, steps: [...steps] }))

      const generationResult = await generateQuestionsProgressively(sectionData, 5, (progress) => {
        steps[1].message = `Gerando questão ${progress.current}/5...`
        setResults(prev => ({ ...prev, steps: [...steps] }))
      })

      if (generationResult.questions.length === 5) {
        const trueCount = generationResult.questions.filter(q => q.correct_answer === true).length
        const falseCount = generationResult.questions.filter(q => q.correct_answer === false).length
        
        steps[1].status = (falseCount === 3 && trueCount === 2) ? 'success' : 'warning'
        steps[1].message = `Geradas 5 questões: ${falseCount}F + ${trueCount}V ${(falseCount === 3 && trueCount === 2) ? '✅' : '⚠️'}`
        steps[1].details = { distribution: { false: falseCount, true: trueCount }, questions: generationResult.questions }
      } else {
        steps[1].status = 'error'
        steps[1].message = `Apenas ${generationResult.questions.length}/5 questões geradas`
      }
      setResults(prev => ({ ...prev, steps: [...steps] }))

      // Etapa 3: Processar embeddings
      steps.push({ name: 'Embeddings Processing', status: 'testing', message: 'Processando embeddings para as questões...' })
      setResults(prev => ({ ...prev, steps: [...steps] }))

      const embeddingsResults = []
      for (const question of generationResult.questions) {
        const processedQuestion = await embeddingsService.processQuestionForEmbedding(question, sectionData)
        embeddingsResults.push(processedQuestion)
      }

      const withEmbeddings = embeddingsResults.filter(q => q.embedding).length
      steps[2].status = withEmbeddings > 0 ? 'success' : 'error'
      steps[2].message = `${withEmbeddings}/${embeddingsResults.length} questões processadas com embeddings`
      steps[2].details = { processedQuestions: embeddingsResults }
      setResults(prev => ({ ...prev, steps: [...steps] }))

      // Etapa 4: Testar sistema anti-repetição
      steps.push({ name: 'Anti-Repetition Test', status: 'testing', message: 'Testando detecção de questões similares...' })
      setResults(prev => ({ ...prev, steps: [...steps] }))

      // Criar uma questão similar à primeira para testar
      const testQuestion = {
        question_text: generationResult.questions[0].question_text + " (versão ligeiramente modificada)",
        correct_answer: generationResult.questions[0].correct_answer,
        explanation: "Teste de similaridade"
      }

      const similarityResult = await embeddingsService.checkForSimilarQuestions(
        testQuestion,
        embeddingsResults,
        sectionData
      )

      steps[3].status = similarityResult.hasSimilar ? 'success' : 'warning'
      steps[3].message = similarityResult.hasSimilar 
        ? `Similaridade detectada: ${(similarityResult.mostSimilar?.similarity * 100).toFixed(1)}%`
        : 'Nenhuma similaridade detectada (pode indicar problema no sistema)'
      steps[3].details = similarityResult
      setResults(prev => ({ ...prev, steps: [...steps] }))

      // Etapa 5: Teste completo com QuestionsService
      steps.push({ name: 'Full Integration Test', status: 'testing', message: 'Testando integração completa (sem salvar no banco)...' })
      setResults(prev => ({ ...prev, steps: [...steps] }))

      const deduplicationTest = await questionDeduplicationService.processQuestionsWithAntiRepetition(
        generationResult.questions,
        1, // subjectId fictício
        1, // sectionId fictício
        sectionData
      )

      steps[4].status = 'success'
      steps[4].message = `Sistema completo funcionando: ${deduplicationTest.stats.totalProcessed} questões processadas`
      steps[4].details = deduplicationTest
      setResults(prev => ({ ...prev, steps: [...steps] }))

      // Resultado final
      setResults(prev => ({
        ...prev,
        success: true,
        summary: {
          openaiEnabled: openaiTest.status === 'success',
          questionsGenerated: generationResult.questions.length,
          embeddingsProcessed: withEmbeddings,
          distributionCorrect: steps[1].status === 'success',
          antiRepetitionWorking: similarityResult.hasSimilar,
          fullIntegrationWorking: true
        }
      }))

    } catch (err) {
      console.error('❌ Erro no teste de embeddings:', err)
      setError({
        message: err.message,
        details: err.stack,
        type: 'embeddings_test_error'
      })
    } finally {
      setLoading(false)
    }
  }

  const testFullIntegrationWithDatabase = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('🔗 Testando integração completa com banco de dados...')
      
      const result = await QuestionsService.generateNewQuestions(1, 1, {
        count: 5,
        onProgress: (progress) => {
          setResults(prev => ({
            ...prev,
            progress: progress,
            currentStep: `Gerando questão ${progress.current}/5...`
          }))
        }
      })

      setResults({
        success: true,
        timestamp: new Date().toISOString(),
        mode: 'full_integration_test',
        result: result,
        summary: {
          questionsCreated: result.questions.length,
          distribution: result.distribution,
          deduplicationStats: result.deduplicationStats,
          generationStats: result.generationStats
        }
      })

    } catch (err) {
      console.error('❌ Erro no teste de integração:', err)
      setError({
        message: err.message,
        details: err.stack,
        type: 'full_integration_error'
      })
    } finally {
      setLoading(false)
    }
  }

  const updateSectionData = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setSectionData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }))
    } else {
      setSectionData(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🧪 Teste de Geração de Questões IA
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Painel de Configuração */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">📝 Configuração da Seção</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título da Seção
                </label>
                <input
                  type="text"
                  value={sectionData.titulo}
                  onChange={(e) => updateSectionData('titulo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Artigo
                </label>
                <input
                  type="text"
                  value={sectionData.artigo}
                  onChange={(e) => updateSectionData('artigo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipificação
                </label>
                <textarea
                  value={sectionData.conteudo.tipificacao}
                  onChange={(e) => updateSectionData('conteudo.tipificacao', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pena
                </label>
                <input
                  type="text"
                  value={sectionData.conteudo.pena}
                  onChange={(e) => updateSectionData('conteudo.pena', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={testConnection}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-md transition-colors"
              >
                {loading ? 'Testando...' : '🔍 Testar Conexão com IA'}
              </button>

              <button
                onClick={testAI}
                disabled={loading}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-md transition-colors"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Gerando questões DIRETAMENTE...
                  </div>
                ) : (
                  '🚀 Gerar 5 Questões PROGRESSIVAMENTE (1 por vez)'
                )}
              </button>

              <button
                onClick={testEmbeddingsSystem}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-md transition-colors"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Testando sistema embeddings...
                  </div>
                ) : (
                  '🧠 Testar Sistema Completo de Embeddings (3F+2V + Anti-repetição)'
                )}
              </button>

              <button
                onClick={testFullIntegrationWithDatabase}
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-md transition-colors"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Testando integração com banco...
                  </div>
                ) : (
                  '🔗 Testar Integração Completa com Banco (SALVA NO BANCO!)'
                )}
              </button>
            </div>
          </div>

          {/* Painel de Resultados */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">📊 Resultados</h2>
            
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Processando solicitação...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <h3 className="text-red-800 font-semibold mb-2">❌ Erro</h3>
                <p className="text-red-700 mb-2">{error.message}</p>
                {error.details && (
                  <details className="text-sm">
                    <summary className="cursor-pointer text-red-600">Detalhes técnicos</summary>
                    <pre className="mt-2 bg-red-100 p-2 rounded text-xs overflow-auto">
                      {JSON.stringify(error.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {results && results.mode === 'connection_test' && (
              <div className={`border rounded-md p-4 ${
                results.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <h3 className={`font-semibold ${
                  results.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {results.success ? '✅ Conexão OK!' : '❌ Falha na Conexão'}
                </h3>
                <p className={results.success ? 'text-green-700' : 'text-red-700'}>
                  {results.connectionTest.message}
                </p>
                {results.connectionTest.response && (
                  <p className="text-sm text-gray-600 mt-2">
                    Resposta: "{results.connectionTest.response}"
                  </p>
                )}
              </div>
            )}

            {results && results.mode === 'progressive' && (
              <div className="space-y-4">
                {/* Barra de Progresso */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-blue-800 font-semibold">
                      {loading ? '🔄 Gerando questões...' : '✅ Processo concluído!'}
                    </h3>
                    <span className="text-blue-600 text-sm">
                      {results.progress?.current || 0}/{results.progress?.total || 5}
                    </span>
                  </div>
                  
                  <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${((results.progress?.current || 0) / (results.progress?.total || 5)) * 100}%`
                      }}
                    ></div>
                  </div>
                  
                  <p className="text-blue-700 text-sm">
                    {results.questionsCount} questões geradas • {new Date(results.timestamp).toLocaleString()}
                  </p>
                  
                  {results.lastError && (
                    <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                      ⚠️ Último erro: {results.lastError}
                    </div>
                  )}
                </div>

                {/* Status Final */}
                {results.finalResult && (
                  <div className={`border rounded-md p-4 ${
                    results.success 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-yellow-50 border-yellow-200'
                  }`}>
                    <h3 className={`font-semibold ${
                      results.success ? 'text-green-800' : 'text-yellow-800'
                    }`}>
                      📊 Resultado Final
                    </h3>
                    <p className={results.success ? 'text-green-700' : 'text-yellow-700'}>
                      {results.finalResult.successCount}/{results.finalResult.totalRequested} questões geradas com sucesso
                    </p>
                    {results.finalResult.errors && results.finalResult.errors.length > 0 && (
                      <details className="mt-2 text-sm">
                        <summary className="cursor-pointer text-red-600">
                          {results.finalResult.errors.length} erro(s) encontrado(s)
                        </summary>
                        <div className="mt-2 space-y-1">
                          {results.finalResult.errors.map((err, idx) => (
                            <div key={idx} className="bg-red-50 p-2 rounded text-red-700">
                              Questão {err.questionNumber}: {err.error}
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                )}

                <div className="max-h-96 overflow-y-auto space-y-4">
                  {results.questions.map((question, index) => (
                    <div key={index} className="border border-gray-200 rounded-md p-4">
                      <div className="mb-2">
                        <span className={`inline-block px-2 py-1 rounded text-sm font-semibold ${
                          question.correct_answer 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {question.correct_answer ? 'VERDADEIRO' : 'FALSO'}
                        </span>
                        <span className="ml-2 text-sm text-gray-500">
                          Questão #{index + 1}
                        </span>
                      </div>
                      
                      <p className="font-medium text-gray-900 mb-3">
                        {question.question_text}
                      </p>
                      
                      <div className="text-sm text-gray-700">
                        <strong>Explicação:</strong> {question.explanation}
                      </div>
                      
                      {question.source_text && (
                        <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          <strong>Fonte:</strong> {question.source_text}
                        </div>
                      )}

                      {question.modified_parts && question.modified_parts.length > 0 && (
                        <div className="mt-2 text-sm text-red-600">
                          <strong>Partes modificadas:</strong> {question.modified_parts.join(', ')}
                        </div>
                      )}

                      <div className="mt-2 flex items-center text-xs text-gray-500">
                        <span>Dificuldade: {question.difficulty}/5</span>
                        <span className="ml-4">Criado por: {question.created_by_ai}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resultados do Teste de Embeddings */}
            {results && results.mode === 'embeddings_test' && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <h3 className="text-green-800 font-semibold mb-3">
                    🧠 Teste do Sistema de Embeddings
                  </h3>
                  
                  {results.steps && (
                    <div className="space-y-3">
                      {results.steps.map((step, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white rounded border">
                          <div className="flex items-center">
                            <span className={`mr-3 ${
                              step.status === 'success' ? 'text-green-600' : 
                              step.status === 'error' ? 'text-red-600' : 
                              step.status === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                            }`}>
                              {step.status === 'success' ? '✅' : 
                               step.status === 'error' ? '❌' : 
                               step.status === 'warning' ? '⚠️' : '🔄'}
                            </span>
                            <div>
                              <div className="font-medium">{step.name}</div>
                              <div className="text-sm text-gray-600">{step.message}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {results.summary && (
                    <div className="mt-4 p-3 bg-white rounded border">
                      <h4 className="font-semibold mb-2">📊 Resumo Final:</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>OpenAI: {results.summary.openaiEnabled ? '✅' : '❌'}</div>
                        <div>Questões: {results.summary.questionsGenerated}/5</div>
                        <div>Embeddings: {results.summary.embeddingsProcessed}/5</div>
                        <div>Distribuição: {results.summary.distributionCorrect ? '✅ 3F+2V' : '❌'}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Resultados da Integração Completa */}
            {results && results.mode === 'full_integration_test' && (
              <div className="space-y-4">
                <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
                  <h3 className="text-purple-800 font-semibold mb-3">
                    🔗 Teste de Integração Completa com Banco
                  </h3>
                  
                  {results.summary && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-3 rounded border">
                        <h4 className="font-semibold text-sm">📝 Geração</h4>
                        <div className="text-sm space-y-1">
                          <div>Questões criadas: {results.summary.questionsCreated}</div>
                          <div>Taxa de sucesso: {results.summary.generationStats?.successRate}</div>
                        </div>
                      </div>
                      
                      <div className="bg-white p-3 rounded border">
                        <h4 className="font-semibold text-sm">🔄 Distribuição</h4>
                        <div className="text-sm space-y-1">
                          <div>Verdadeiras: {results.summary.distribution?.true_answers}</div>
                          <div>Falsas: {results.summary.distribution?.false_answers}</div>
                          <div>Padrão OK: {results.summary.distribution?.matches_expected ? '✅' : '❌'}</div>
                        </div>
                      </div>
                      
                      <div className="bg-white p-3 rounded border">
                        <h4 className="font-semibold text-sm">🚫 Anti-repetição</h4>
                        <div className="text-sm space-y-1">
                          <div>Processadas: {results.summary.deduplicationStats?.totalProcessed}</div>
                          <div>Regeneradas: {results.summary.deduplicationStats?.regenerated}</div>
                          <div>Falhas: {results.summary.deduplicationStats?.failures}</div>
                        </div>
                      </div>
                      
                      <div className="bg-white p-3 rounded border">
                        <h4 className="font-semibold text-sm">💾 Banco de Dados</h4>
                        <div className="text-sm space-y-1">
                          <div>Status: {results.success ? '✅ Salvo' : '❌ Erro'}</div>
                          <div>Timestamp: {new Date(results.timestamp).toLocaleTimeString()}</div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {results.result && results.result.questions && (
                    <div className="mt-4">
                      <h4 className="font-semibold mb-2">🔍 Questões Salvas no Banco:</h4>
                      <div className="text-sm text-gray-600 mb-2">
                        {results.result.questions.length} questões foram salvas na tabela questions
                      </div>
                      <div className="max-h-40 overflow-y-auto space-y-2">
                        {results.result.questions.slice(0, 3).map((q, idx) => (
                          <div key={idx} className="bg-white p-2 rounded border text-xs">
                            <div className="font-medium">ID: {q.id} | Resposta: {q.correct_answer ? 'V' : 'F'}</div>
                            <div className="text-gray-600 truncate">{q.question_text}</div>
                          </div>
                        ))}
                        {results.result.questions.length > 3 && (
                          <div className="text-xs text-gray-500 text-center">
                            ... e mais {results.result.questions.length - 3} questões
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!loading && !error && !results && (
              <div className="text-center py-12 text-gray-500">
                <p>👆 Clique no botão acima para testar a geração de questões</p>
              </div>
            )}
          </div>
        </div>

        {/* Debug Info */}
        <div className="mt-8 bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">🔧 Informações de Debug</h3>
          <div className="text-xs text-gray-600 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <strong>DeepSeek API:</strong> {import.meta.env.VITE_DEEPSEEK_API_KEY ? '✅ Configurada' : '❌ Não encontrada'}
            </div>
            <div>
              <strong>OpenAI API:</strong> {import.meta.env.VITE_OPENAI_API_KEY ? '✅ Configurada' : '❌ Não encontrada'}
            </div>
            <div>
              <strong>Embeddings:</strong> {embeddingsService.isEnabled() ? '✅ Habilitado' : '❌ Desabilitado'}
            </div>
            <div>
              <strong>Ambiente:</strong> {import.meta.env.MODE}
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-500 text-center">
            Sistema completo: 3F+2V Distribution + OpenAI Embeddings + Anti-Repetition + Supabase Vector Search
          </div>
        </div>
      </div>
    </div>
  )
}

export default AITestPage