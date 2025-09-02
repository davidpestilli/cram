import axios from 'axios'

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'
const API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY

if (!API_KEY) {
  console.warn('⚠️ DeepSeek API key not found in VITE_DEEPSEEK_API_KEY. Questions will use mock data.')
  console.log('💡 Para usar a API do DeepSeek, configure VITE_DEEPSEEK_API_KEY no arquivo .env')
}

const deepseekClient = axios.create({
  baseURL: DEEPSEEK_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
  },
  timeout: 30000 // 30 segundos
})

export const generateQuestions = async (sectionContent, count = 1) => {
  console.log(`🚀 Iniciando geração de ${count} questão(s) para seção: ${sectionContent?.titulo || 'N/A'}`)
  
  try {
    if (!API_KEY) {
      console.log('📝 Usando questões mock (API key não configurada)')
      return generateMockQuestions(sectionContent, count)
    }
    
    console.log('🔑 API key encontrada, tentando usar DeepSeek API...')

    // Adicionar timestamp para forçar questões diferentes
    const timestamp = Date.now()
    const randomSeed = Math.floor(Math.random() * 10000)
    const prompt = createPrompt(sectionContent, count, timestamp, randomSeed)
    
    console.log(`📤 Enviando requisição para DeepSeek API... [timestamp: ${timestamp}, seed: ${randomSeed}]`)
    const response = await deepseekClient.post('', {
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: "Você é um especialista em Direito Penal brasileiro. Sua tarefa é criar questões educativas ÚNICAS e VARIADAS no formato verdadeiro/falso baseadas em textos jurídicos fornecidos. NUNCA repita questões anteriores."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7, // Aumentar criatividade para máxima variação
      top_p: 0.9, // Nucleus sampling para mais diversidade
      frequency_penalty: 0.8, // Penalizar repetições
      presence_penalty: 0.6, // Encorajar novos tópicos
      max_tokens: 1500,
      stream: false
    })

    console.log('✅ Resposta recebida da DeepSeek API')
    const aiResponse = response.data.choices[0].message.content
    console.log(`📝 Conteúdo da resposta: ${aiResponse.substring(0, 200)}...`)
    return parseAIResponse(aiResponse, sectionContent)

  } catch (error) {
    console.error('❌ Erro ao gerar questões com DeepSeek:', error.message)
    
    if (error.response) {
      console.error('🔴 Resposta da API:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      })
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.error('🔌 Falha na conexão com a API DeepSeek')
    } else if (error.code === 'ENOTFOUND') {
      console.error('🌐 DNS não conseguiu resolver api.deepseek.com')
    }
    
    console.log('🔄 Usando questões mock como fallback')
    return generateMockQuestions(sectionContent, count)
  }
}

const getVariationApproach = (seedMod, artigo, conteudo) => {
  const approaches = [
    `FOQUE NA PENA: Teste especificamente os valores e modalidades da pena (${conteudo.pena || 'reclusão de 2 a 8 anos'}). Crie erro sutil em anos, modalidade ou multa.`,
    `FOQUE NOS OBJETOS: Teste um objeto específico da lista (${conteudo.objetos?.[0] || 'selo tributário'}). Altere detalhes técnicos ou jurisdição.`,
    `FOQUE NA TIPIFICAÇÃO: Teste as modalidades de conduta (${conteudo.tipificacao || 'falsificar, fabricar ou alterar'}). Troque verbos ou adicione condutas inexistentes.`,
    `FOQUE NO SUJEITO: Teste quem pode cometer o crime. Adicione/remova requisitos de funcionário público ou qualificações especiais.`,
    `FOQUE NA CONSUMAÇÃO: Teste quando o crime se consuma. Crie questão sobre tentativa, iter criminis ou momento consumativo.`,
    `FOQUE EM QUALIFICADORAS: Teste circunstâncias agravantes, atenuantes ou qualificadoras específicas do tipo penal.`,
    `FOQUE EM CONCURSO: Teste relação com outros crimes - concurso formal, material, ou tipos penais relacionados.`,
    `FOQUE EM ELEMENTOS OBJETIVOS: Teste aspectos técnicos específicos - local, tempo, modo de execução, instrumentos utilizados.`
  ]
  return approaches[seedMod] || approaches[0]
}

const createPrompt = (sectionContent, count, timestamp = Date.now(), randomSeed = Math.floor(Math.random() * 10000)) => {
  const artigo = sectionContent.artigo || 'Artigo não especificado'
  const titulo = sectionContent.titulo || 'Seção sem título'
  const conteudo = sectionContent.conteudo || {}
  
  return `
Você é um especialista em Direito Penal brasileiro criando questões para concursos públicos estilo CESPE/CEBRASPE.

CONTEÚDO PARA ANÁLISE:
📖 ARTIGO: ${artigo}
📝 TEMA: ${titulo}
📋 CONTEÚDO COMPLETO:
${JSON.stringify(conteudo, null, 2)}

CRIAR APENAS ${count} QUESTÃO VERDADEIRO/FALSO de alta qualidade e ÚNICA seguindo estes padrões:

⚡ VARIAÇÃO OBRIGATÓRIA: Seed ${randomSeed} | Time ${timestamp} 
🎲 Use uma abordagem COMPLETAMENTE DIFERENTE desta vez - varie:
- Elemento focal (pena vs objeto vs conduta vs sujeito)
- Tipo de erro (alteração vs fabricação vs valores vs modalidades)
- Perspectiva (positiva/negativa, específica/geral)
- Complexidade (simples/composta)

🎯 TIPOS DE QUESTÕES A CRIAR:
1. ELEMENTOS DO TIPO: Testar components específicos do crime
2. PENAS E SANÇÕES: Valores exatos, modalidades (reclusão/detenção)  
3. CONDUTAS TÍPICAS: Verbos nucleares e suas variações
4. SUJEITOS: Ativo, passivo, funcionário público
5. OBJETOS JURÍDICOS: Bens protegidos específicos
6. QUALIFICADORAS/AGRAVANTES: Circunstâncias especiais
7. CONSUMAÇÃO/TENTATIVA: Momento consumativo
8. CONCURSO DE CRIMES: Relação com outros tipos penais

🔧 TÉCNICAS PARA QUESTÕES FALSAS (varie sempre):
- Alterar valores de pena (trocar anos, modalidade reclusão/detenção)
- Modificar elementos objetivos (verbos, objetos, circunstâncias)
- Trocar sujeitos ativos (qualquer pessoa vs funcionário público)
- Alterar circunstâncias qualificadoras ou agravantes  
- Modificar requisitos específicos do tipo penal
- Alterar modalidades de conduta (fabricar vs alterar)
- Trocar objetos materiais específicos
- Modificar elementos temporais ou espaciais

💯 QUALIDADE ESPERADA:
- Precisão jurídica absoluta
- Linguagem técnica apropriada
- Testes de conhecimento específico (não genérico)
- Explicações didáticas com fundamento legal
- Citação do texto original como fonte

EXEMPLOS DE QUESTÕES DE QUALIDADE:

✅ VERDADEIRA:
"A falsificação de selo destinado a controle tributário, mediante fabricação ou alteração, é punida com reclusão de dois a oito anos e multa, conforme o art. 293 do Código Penal."

❌ FALSA (modificação sutil):
"A falsificação de selo destinado a controle tributário é punida com detenção de dois a oito anos e multa."
ERRO: Pena é RECLUSÃO, não detenção.

FORMATO DE RESPOSTA (JSON válido):
{
  "questions": [
    {
      "id": 1,
      "question_text": "Questão específica baseada no conteúdo real",
      "correct_answer": true,
      "explanation": "Explicação técnica detalhada citando o artigo e fundamento",
      "source_text": "Trecho específico do texto legal que fundamenta a resposta",
      "modified_parts": [], // para questões verdadeiras 
      "difficulty": 3
    }
  ]
}

🎯 ABORDAGEM ESPECÍFICA PARA SEED ${randomSeed % 8}:
${getVariationApproach(randomSeed % 8, artigo, conteudo)}

IMPORTANTE: 
- Responda APENAS com JSON válido, sem texto adicional
- Para ${count} questão: alterne entre verdadeira e falsa conforme necessário
- Cada questão deve testar conhecimento específico do ${artigo}
- Use terminologia técnica correta do Direito Penal
- NUNCA repita questões anteriores - seja criativo!`
}

const parseAIResponse = (aiResponse, sectionContent) => {
  try {
    // Remove possível texto extra e extrai apenas o JSON
    let jsonStr = aiResponse.trim()
    
    // Procura pelo início do JSON
    const jsonStart = jsonStr.indexOf('{')
    const jsonEnd = jsonStr.lastIndexOf('}')
    
    if (jsonStart !== -1 && jsonEnd !== -1) {
      jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1)
    }

    const parsed = JSON.parse(jsonStr)
    
    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error('Invalid response format')
    }

    // Processar e validar qualidade das questões
    const processedQuestions = parsed.questions.map((q, index) => ({
      id: q.id || index + 1,
      question_text: q.question_text || `Questão ${index + 1}`,
      correct_answer: Boolean(q.correct_answer),
      explanation: q.explanation || 'Explicação não disponível',
      source_text: q.source_text || sectionContent.conteudo?.tipificacao || '',
      modified_parts: q.modified_parts || [],
      difficulty: q.difficulty || calculateDifficulty(q.question_text),
      created_by_ai: 'deepseek'
    }))

    // Validar qualidade das questões
    const validatedQuestions = processedQuestions.filter(q => validateQuestionQuality(q, sectionContent))
    
    if (validatedQuestions.length < processedQuestions.length * 0.7) {
      console.warn('Many questions failed quality validation, falling back to mock')
      return generateHighQualityMockQuestions(sectionContent, 1)
    }

    console.log(`${validatedQuestions.length}/${processedQuestions.length} questions passed quality validation`)
    return validatedQuestions

  } catch (error) {
    console.error('Error parsing AI response:', error)
    return generateHighQualityMockQuestions(sectionContent, 10)
  }
}

const validateQuestionQuality = (question, sectionContent) => {
  const text = question.question_text.toLowerCase()
  
  // Critérios de qualidade
  const qualityCriteria = {
    // Não deve ser genérica demais
    notGeneric: !text.includes('este crime está corretamente definido'),
    
    // Deve ter tamanho adequado (não muito curta nem muito longa)
    adequateLength: text.length >= 20 && text.length <= 500,
    
    // Deve conter terminologia jurídica específica
    hasLegalTerminology: /\b(art|artigo|reclusão|detenção|multa|pena|crime|código|penal|falsificar|selo|tribut)\b/i.test(text),
    
    // Deve ter explicação substancial
    hasGoodExplanation: question.explanation.length >= 30,
    
    // Não deve repetir exatamente o texto base
    notExactCopy: question.source_text !== question.question_text,
    
    // Deve ter contexto específico da seção
    hasSpecificContext: sectionContent.artigo ? text.includes(sectionContent.artigo.toLowerCase().replace('art. ', '')) : true
  }

  const passedCriteria = Object.values(qualityCriteria).filter(Boolean).length
  const totalCriteria = Object.keys(qualityCriteria).length
  
  const qualityScore = passedCriteria / totalCriteria
  
  // Log para debug
  if (qualityScore < 0.7) {
    console.warn('Question failed quality check:', {
      question: question.question_text.substring(0, 100),
      score: qualityScore,
      criteria: qualityCriteria
    })
  }
  
  return qualityScore >= 0.7
}

const calculateDifficulty = (questionText) => {
  // Algoritmo simples para calcular dificuldade baseado na complexidade da questão
  const complexity = questionText.length + 
                    (questionText.match(/§|artigo|inciso/gi)?.length || 0) * 20 +
                    (questionText.match(/reclusão|detenção|multa/gi)?.length || 0) * 10
  
  if (complexity < 50) return 1
  if (complexity < 100) return 2
  if (complexity < 150) return 3
  if (complexity < 200) return 4
  return 5
}

const generateMockQuestions = (sectionContent, count) => {
  // Questões de exemplo para desenvolvimento/fallback
  const mockQuestions = []
  const baseContent = sectionContent?.conteudo || {}
  
  for (let i = 1; i <= count; i++) {
    const isTrue = i % 2 === 1
    
    if (isTrue) {
      mockQuestions.push({
        id: i,
        question_text: `${baseContent.tipificacao || 'Este crime'} está corretamente definido no código penal.`,
        correct_answer: true,
        explanation: `Correto. A definição apresentada está de acordo com o texto legal.`,
        source_text: baseContent.tipificacao || 'Texto base não disponível',
        modified_parts: [],
        difficulty: 2,
        created_by_ai: 'mock'
      })
    } else {
      mockQuestions.push({
        id: i,
        question_text: `${baseContent.tipificacao || 'Este crime'} tem pena de prisão perpétua.`,
        correct_answer: false,
        explanation: `Falso. A Constituição brasileira proíbe prisão perpétua. A pena correta é: ${baseContent.pena || 'conforme legislação específica'}.`,
        source_text: baseContent.pena || 'Pena não especificada',
        modified_parts: ['prisão perpétua'],
        difficulty: 1,
        created_by_ai: 'mock'
      })
    }
  }
  
  return mockQuestions
}

const generateHighQualityMockQuestions = (sectionContent, count) => {
  const questions = []
  const artigo = sectionContent?.artigo || 'Art. 293'
  const titulo = sectionContent?.titulo || 'Seção de Direito Penal'
  const conteudo = sectionContent?.conteudo || {}
  
  // Base de templates de alta qualidade baseados no PDF fornecido
  const templates = {
    pena: {
      true: `A pena prevista no ${artigo} é de ${conteudo.pena || 'reclusão, de dois a oito anos, e multa'}.`,
      false: `A pena prevista no ${artigo} é de detenção, de dois a oito anos, e multa.`,
      explanation_true: `Correto. De acordo com o ${artigo} do Código Penal, a pena é exatamente ${conteudo.pena || 'reclusão, de dois a oito anos, e multa'}.`,
      explanation_false: `Falso. A pena correta é ${conteudo.pena || 'reclusão, de dois a oito anos, e multa'}. A modalidade é reclusão, não detenção.`
    },
    tipificacao: {
      true: `O ${artigo} tipifica a conduta de ${conteudo.tipificacao || 'falsificar documentos públicos'}.`,
      false: `O ${artigo} tipifica exclusivamente a conduta de usar documentos falsificados.`,
      explanation_true: `Correto. O ${artigo} efetivamente tipifica: ${conteudo.tipificacao || 'a falsificação de documentos públicos'}.`,
      explanation_false: `Falso. O ${artigo} tipifica ${conteudo.tipificacao || 'falsificar, não apenas usar'}. O uso pode estar em outro dispositivo ou parágrafo.`
    },
    elementos: {
      true: `Para configuração do crime do ${artigo}, é necessário que a conduta seja praticada mediante ${conteudo.tipificacao?.includes('fabricando') ? 'fabricação ou alteração' : 'dolo específico'}.`,
      false: `O crime do ${artigo} pode ser praticado na modalidade culposa.`,
      explanation_true: `Correto. O tipo penal exige dolo específico e as modalidades ${conteudo.tipificacao?.includes('fabricando') ? 'de fabricação ou alteração' : 'previstas no caput'}.`,
      explanation_false: `Falso. Trata-se de crime doloso. Não existe modalidade culposa para este tipo penal.`
    }
  }
  
  const templateKeys = Object.keys(templates)
  
  for (let i = 0; i < count; i++) {
    const templateType = templateKeys[i % templateKeys.length]
    const template = templates[templateType]
    const isTrue = i % 2 === 0
    
    questions.push({
      id: i + 1,
      question_text: isTrue ? template.true : template.false,
      correct_answer: isTrue,
      explanation: isTrue ? template.explanation_true : template.explanation_false,
      source_text: `${artigo} - ${conteudo.tipificacao || 'Texto legal específico'}`,
      modified_parts: isTrue ? [] : ['elemento modificado para criar questão falsa'],
      difficulty: Math.ceil((i % 4) + 1),
      created_by_ai: 'high_quality_mock'
    })
  }
  
  console.log(`Generated ${count} high-quality mock questions for ${titulo}`)
  return questions
}

// Função para verificar se a API está disponível
export const checkAPIHealth = async () => {
  console.log('🔍 Testando conectividade com DeepSeek API...')
  
  try {
    if (!API_KEY) {
      console.log('❌ API key não encontrada')
      return { 
        status: 'missing_key', 
        message: 'API key não configurada - usando dados mock',
        recommendation: 'Configure VITE_DEEPSEEK_API_KEY no arquivo .env'
      }
    }

    console.log('🔑 API key encontrada, testando conexão...')
    
    // Teste simples da API com timeout menor para diagnóstico rápido
    const response = await deepseekClient.post('', {
      model: "deepseek-chat",
      messages: [
        {
          role: "user",
          content: "Responda apenas 'ok' se você pode me ajudar."
        }
      ],
      max_tokens: 10,
      temperature: 0
    })

    console.log('✅ DeepSeek API respondeu com sucesso')
    return { 
      status: 'healthy', 
      message: 'DeepSeek API está funcionando normalmente',
      model: 'deepseek-chat',
      response_preview: response.data.choices[0].message.content
    }
  } catch (error) {
    console.error('❌ Erro no teste da API:', error.message)
    
    let errorDetails = {
      status: 'error',
      message: error.message,
      fallback: 'Usando questões mock como alternativa'
    }
    
    if (error.response) {
      errorDetails.api_error = {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      }
      
      if (error.response.status === 401) {
        errorDetails.recommendation = 'Verifique se a API key está correta no arquivo .env'
      } else if (error.response.status === 429) {
        errorDetails.recommendation = 'Limite de requisições excedido - tente novamente mais tarde'
      }
    } else if (error.code === 'ECONNREFUSED') {
      errorDetails.recommendation = 'Verifique sua conexão com a internet'
    } else if (error.code === 'ENOTFOUND') {
      errorDetails.recommendation = 'Não foi possível resolver api.deepseek.com - verifique DNS'
    }
    
    console.error('🔴 Detalhes do erro:', errorDetails)
    return errorDetails
  }
}

// Nova função para testar a API mais detalhadamente
export const testAPIConnection = async () => {
  console.log('🧪 Executando teste detalhado da API DeepSeek...')
  
  const results = {
    timestamp: new Date().toISOString(),
    tests: {}
  }
  
  // Teste 1: Verificar API key
  results.tests.api_key = {
    name: 'Verificação da API Key',
    status: API_KEY ? 'pass' : 'fail',
    message: API_KEY ? 'API key está configurada' : 'API key não encontrada',
    value: API_KEY ? `${API_KEY.substring(0, 10)}...` : null
  }
  
  // Teste 2: Conectividade básica
  try {
    const healthCheck = await checkAPIHealth()
    results.tests.connectivity = {
      name: 'Conectividade com API',
      status: healthCheck.status === 'healthy' ? 'pass' : 'fail',
      message: healthCheck.message,
      details: healthCheck
    }
  } catch (error) {
    results.tests.connectivity = {
      name: 'Conectividade com API',
      status: 'fail',
      message: error.message
    }
  }
  
  console.log('📊 Resultados do teste:', results)
  return results
}

export default {
  generateQuestions,
  checkAPIHealth,
  testAPIConnection
}