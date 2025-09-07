import axios from 'axios'

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'
const API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY

const deepseekClient = axios.create({
  baseURL: DEEPSEEK_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
  },
  timeout: 60000 // 60 segundos para testes
})

// Função para gerar uma única questão com resposta específica (3F+2V)
const generateSingleQuestion = async (sectionContent, questionNumber) => {
  const questionConfig = getQuestionConfig(questionNumber)
  const prompt = createSingleQuestionPrompt(sectionContent, questionNumber, questionConfig)
  
  const requestData = {
    model: "deepseek-chat",
    messages: [
      {
        role: "system",
        content: `Você é um especialista em Direito Penal brasileiro. 
Crie UMA questão educativa verdadeiro/falso com resposta ${questionConfig.expected ? 'VERDADEIRA' : 'FALSA'}.
IMPORTANTE: A resposta correct_answer DEVE SER ${questionConfig.expected ? 'true' : 'false'}.
RESPONDA APENAS COM JSON VÁLIDO:
{
  "id": ${questionNumber},
  "question_text": "sua questão aqui",
  "correct_answer": ${questionConfig.expected},
  "explanation": "sua explicação aqui",
  "source_text": "trecho da lei",
  "modified_parts": [],
  "difficulty": 3,
  "created_by_ai": "deepseek"
}`
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.4,
    max_tokens: 500,
    stream: false
  }

  const response = await deepseekClient.post('', requestData)
  const aiResponse = response.data.choices[0].message.content.trim()
  
  // Parse direto e simples para uma questão
  let jsonStr = aiResponse
  if (jsonStr.includes('```')) {
    jsonStr = jsonStr.replace(/```json\s*/, '').replace(/```\s*$/, '')
  }
  
  const question = JSON.parse(jsonStr)
  question.id = questionNumber // Garantir ID correto
  
  return question
}

// Função para gerar questões progressivamente
export const generateQuestionsProgressively = async (sectionContent, count = 5, onProgress = null) => {
  console.log(`🚀 [PROGRESSIVO] Gerando ${count} questões para: ${sectionContent?.titulo || 'N/A'}`)
  
  if (!API_KEY) {
    throw new Error('❌ API Key não configurada. Configure VITE_DEEPSEEK_API_KEY no arquivo .env')
  }

  const questions = []
  const errors = []

  // Gerar questões uma por vez
  for (let i = 1; i <= count; i++) {
    try {
      console.log(`📝 Gerando questão ${i}/${count}...`)
      
      const question = await generateSingleQuestion(sectionContent, i)
      questions.push(question)
      
      console.log(`✅ Questão ${i} gerada com sucesso`)
      
      // Callback de progresso
      if (onProgress) {
        onProgress({
          current: i,
          total: count,
          question: question,
          questions: [...questions]
        })
      }
      
      // Pequeno delay para não sobrecarregar a API
      if (i < count) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
    } catch (error) {
      console.error(`❌ Erro ao gerar questão ${i}:`, error.message)
      errors.push({ questionNumber: i, error: error.message })
      
      if (onProgress) {
        onProgress({
          current: i,
          total: count,
          error: error.message,
          questions: [...questions]
        })
      }
    }
  }

  console.log(`🎯 Processo concluído: ${questions.length}/${count} questões geradas`)
  if (errors.length > 0) {
    console.warn(`⚠️ Erros encontrados:`, errors)
  }

  return {
    questions,
    errors,
    successCount: questions.length,
    totalRequested: count
  }
}

// Manter a função original como fallback
export const generateQuestionsDirectly = async (sectionContent, count = 5) => {
  console.log(`🚀 [DIRETO] Gerando ${count} questões para: ${sectionContent?.titulo || 'N/A'}`)
  
  if (!API_KEY) {
    throw new Error('❌ API Key não configurada. Configure VITE_DEEPSEEK_API_KEY no arquivo .env')
  }

  // Usar o método progressivo internamente
  const result = await generateQuestionsProgressively(sectionContent, count)
  
  if (result.questions.length === 0) {
    throw new Error('❌ Nenhuma questão pôde ser gerada')
  }
  
  return result.questions
}

const createSingleQuestionPrompt = (sectionContent, questionNumber, questionConfig) => {
  const artigo = sectionContent.artigo || 'Artigo não especificado'
  const titulo = sectionContent.titulo || 'Seção sem título'
  const conteudo = sectionContent.conteudo || {}
  
  const expectedAnswer = questionConfig.expected ? 'VERDADEIRA' : 'FALSA'
  const answerInstructions = questionConfig.expected 
    ? 'Crie uma afirmação CORRETA sobre o conteúdo legal.'
    : 'Crie uma afirmação INCORRETA, introduzindo um erro sutil mas claro (valor errado, modalidade incorreta, etc.).'
  
  return `Crie UMA questão verdadeiro/falso sobre ${artigo} - ${titulo}.
RESPOSTA OBRIGATÓRIA: ${expectedAnswer}

CONTEÚDO LEGAL:
${conteudo.tipificacao || 'Não especificado'}
Pena: ${conteudo.pena || 'Não especificado'}

QUESTÃO #${questionNumber} - ${questionConfig.focus}
${answerInstructions}

INSTRUÇÕES:
- Se a resposta deve ser FALSA, introduza um erro específico (ex: pena errada, modalidade incorreta, objeto não protegido)
- Se a resposta deve ser VERDADEIRA, use informações exatas da lei
- Na explicação, sempre explique por que a resposta é ${expectedAnswer}

RESPONDA APENAS JSON VÁLIDO:
{
  "id": ${questionNumber},
  "question_text": "sua questão aqui",
  "correct_answer": ${questionConfig.expected},
  "explanation": "explicação detalhada do por que é ${expectedAnswer}",
  "source_text": "trecho da lei",
  "modified_parts": [],
  "difficulty": 3,
  "created_by_ai": "deepseek"
}`
}

// Distribuição 3F+2V: questões 1, 3, 5 = false | questões 2, 4 = true
const getQuestionConfig = (questionNumber) => {
  const configs = [
    { 
      id: 1, 
      expected: false, 
      focus: "Foque na PENA - introduza erro na modalidade ou valor (ex: detenção em vez de reclusão)" 
    },
    { 
      id: 2, 
      expected: true, 
      focus: "Foque na TIPIFICAÇÃO - use condutas corretas da lei (falsificar, fabricar, alterar)" 
    }, 
    { 
      id: 3, 
      expected: false, 
      focus: "Foque nos OBJETOS - mencione documento NÃO protegido ou descrição incorreta" 
    },
    { 
      id: 4, 
      expected: true, 
      focus: "Foque no SUJEITO - definição correta de quem pode cometer o crime" 
    },
    { 
      id: 5, 
      expected: false, 
      focus: "Foque na CONSUMAÇÃO - momento errado ou circunstância incorreta" 
    }
  ]
  return configs[questionNumber - 1] || configs[0]
}

const getQuestionFocus = (questionNumber) => {
  const config = getQuestionConfig(questionNumber)
  return config.focus
}

const createDirectPrompt = (sectionContent, count) => {
  const artigo = sectionContent.artigo || 'Artigo não especificado'
  const titulo = sectionContent.titulo || 'Seção sem título'
  const conteudo = sectionContent.conteudo || {}
  
  return `Crie ${count} questões verdadeiro/falso sobre ${artigo} - ${titulo}.

CONTEÚDO:
Tipificação: ${conteudo.tipificacao || 'Não especificado'}
Pena: ${conteudo.pena || 'Não especificado'}

FORMATO OBRIGATÓRIO (COPIE EXATAMENTE):
{
  "questions": [
    {
      "id": 1,
      "question_text": "Sua questão aqui",
      "correct_answer": true,
      "explanation": "Sua explicação aqui",
      "source_text": "Trecho da lei",
      "modified_parts": [],
      "difficulty": 3,
      "created_by_ai": "deepseek"
    }
  ]
}

REGRAS:
1. Responda APENAS JSON válido
2. Use aspas duplas em tudo
3. Não quebre linhas em strings
4. Vírgula após cada propriedade (menos a última)
5. Faça ${count} questões no array

IMPORTANTE: COPIE O FORMATO EXATO ACIMA.`
}

const parseDirectResponse = (aiResponse, sectionContent) => {
  try {
    console.log('🔍 Parseando resposta da IA...')
    console.log('📝 Resposta bruta completa:', aiResponse)
    
    // Limpar resposta
    let jsonStr = aiResponse.trim()
    
    // Remover possível texto explicativo antes e depois do JSON
    // Procurar por diferentes marcadores de JSON
    const jsonMarkers = [
      { start: '```json', end: '```' },
      { start: '```', end: '```' },
      { start: '{', end: '}' }
    ]
    
    let extractedJson = null
    
    for (const marker of jsonMarkers) {
      if (marker.start === '{') {
        // Para JSON sem marcadores
        const jsonStart = jsonStr.indexOf('{')
        const jsonEnd = jsonStr.lastIndexOf('}')
        
        if (jsonStart !== -1 && jsonEnd !== -1) {
          extractedJson = jsonStr.substring(jsonStart, jsonEnd + 1)
          break
        }
      } else {
        // Para JSON com marcadores
        const startIndex = jsonStr.indexOf(marker.start)
        if (startIndex !== -1) {
          const contentStart = startIndex + marker.start.length
          const endIndex = jsonStr.indexOf(marker.end, contentStart)
          
          if (endIndex !== -1) {
            extractedJson = jsonStr.substring(contentStart, endIndex).trim()
            break
          }
        }
      }
    }
    
    if (!extractedJson) {
      throw new Error('JSON não encontrado na resposta')
    }
    
    console.log('📝 JSON extraído:', extractedJson)
    
    // Tentar corrigir JSON malformado
    extractedJson = fixMalformedJSON(extractedJson)
    
    const parsed = JSON.parse(extractedJson)
    
    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error('Formato de resposta inválido: questões não encontradas')
    }
    
    console.log(`✅ ${parsed.questions.length} questões parseadas com sucesso`)
    
    // Processar questões
    const processedQuestions = parsed.questions.map((q, index) => ({
      id: q.id || index + 1,
      question_text: q.question_text || `Questão ${index + 1}`,
      correct_answer: Boolean(q.correct_answer),
      explanation: q.explanation || 'Explicação não disponível',
      source_text: q.source_text || sectionContent.conteudo?.tipificacao || '',
      modified_parts: q.modified_parts || [],
      difficulty: q.difficulty || 3,
      created_by_ai: 'deepseek_direct'
    }))
    
    console.log('🎯 Questões processadas:', processedQuestions.map(q => ({
      id: q.id,
      correct_answer: q.correct_answer,
      text_preview: q.question_text.substring(0, 50) + '...'
    })))
    
    return processedQuestions
    
  } catch (error) {
    console.error('❌ Erro no parse da resposta:', error.message)
    console.error('📝 Resposta original:', aiResponse)
    console.error('🔍 Tentativas de extração de JSON falharam')
    
    // Criar um relatório detalhado do erro
    const errorReport = {
      originalError: error.message,
      responseLength: aiResponse.length,
      responsePreview: aiResponse.substring(0, 500),
      hasJsonMarkers: aiResponse.includes('{') && aiResponse.includes('}'),
      possibleIssues: []
    }
    
    if (aiResponse.includes('```')) {
      errorReport.possibleIssues.push('Resposta contém markdown code blocks')
    }
    if (aiResponse.includes('\n')) {
      errorReport.possibleIssues.push('Resposta contém quebras de linha')
    }
    if (aiResponse.includes("'")) {
      errorReport.possibleIssues.push('Resposta contém aspas simples em vez de duplas')
    }
    
    console.error('📊 Relatório de erro:', errorReport)
    
    throw new Error(`Erro ao processar resposta da IA: ${error.message}. Verifique o console para detalhes completos.`)
  }
}

// Função para testar conexão
export const testDirectConnection = async () => {
  console.log('🧪 Testando conexão direta com DeepSeek...')
  
  if (!API_KEY) {
    return {
      status: 'error',
      message: 'API Key não configurada'
    }
  }
  
  try {
    const response = await deepseekClient.post('', {
      model: "deepseek-chat",
      messages: [
        {
          role: "user",
          content: "Responda apenas 'CONECTADO' se você pode me ajudar."
        }
      ],
      max_tokens: 10,
      temperature: 0
    })
    
    return {
      status: 'success',
      message: 'Conexão estabelecida com sucesso',
      response: response.data.choices[0].message.content
    }
  } catch (error) {
    return {
      status: 'error',
      message: error.message,
      details: error.response?.data
    }
  }
}

// Função para tentar corrigir JSON severamente malformado
const fixMalformedJSON = (jsonStr) => {
  try {
    console.log('🔧 Tentando corrigir JSON severamente malformado...')
    
    // Se o JSON está muito quebrado, vamos tentar extrair todas as questões válidas
    console.log('🔧 Tentando extrair questões válidas individuais...')
    
    // Padrão para encontrar questões válidas
    const questionPattern = /{[^}]*"id":\s*\d+[^}]*"created_by_ai":\s*"deepseek"[^}]*}/g
    const validQuestions = []
    let match
    
    while ((match = questionPattern.exec(jsonStr)) !== null) {
      try {
        const questionStr = match[0]
        console.log(`🔧 Tentando parsear questão: ${questionStr.substring(0, 100)}...`)
        
        // Limpar a questão individual
        let cleanQuestion = questionStr
        
        // Remove propriedades com underscore que são comentários
        cleanQuestion = cleanQuestion.replace(/"_[^"]*":\s*"[^"]*",?\s*/g, '')
        cleanQuestion = cleanQuestion.replace(/,\s*}/g, '}')
        
        const parsedQuestion = JSON.parse(cleanQuestion)
        validQuestions.push(parsedQuestion)
        console.log(`✅ Questão ${parsedQuestion.id} extraída com sucesso`)
      } catch (error) {
        console.warn(`⚠️ Erro ao parsear questão individual: ${error.message}`)
      }
    }
    
    if (validQuestions.length > 0) {
      console.log(`🔧 Extraídas ${validQuestions.length} questões válidas`)
      const reconstructedJson = {
        questions: validQuestions
      }
      
      console.log('🔧 JSON reconstruído:', JSON.stringify(reconstructedJson, null, 2))
      return JSON.stringify(reconstructedJson)
    }
    
    // Se não conseguir extrair nem a primeira questão, tenta correções básicas
    let fixed = jsonStr
    
    // Correções mais agressivas
    // 1. Remove espaços extras ao redor de :
    fixed = fixed.replace(/\s*:\s*/g, ':')
    
    // 2. Aspas simples para duplas
    fixed = fixed.replace(/'/g, '"')
    
    // 3. Adiciona aspas em propriedades sem aspas (mais preciso)
    fixed = fixed.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
    
    // 4. Adiciona aspas em valores string sem aspas
    fixed = fixed.replace(/:([^",{\[\]}\s][^,}\]]*)/g, ':"$1"')
    
    // 5. Corrige valores boolean e números
    fixed = fixed.replace(/:"(true|false|null|\d+)"/g, ':$1')
    
    // 6. Remove vírgulas extras
    fixed = fixed.replace(/,(\s*[}\]])/g, '$1')
    
    // 7. Remove caracteres de controle e quebras de linha problemáticas
    fixed = fixed.replace(/[\x00-\x1F]/g, ' ')
    fixed = fixed.replace(/\s+/g, ' ')
    
    console.log('🔧 JSON após correções agressivas:', fixed.substring(0, 500) + '...')
    
    return fixed
  } catch (error) {
    console.warn('⚠️ Erro ao corrigir JSON:', error)
    return jsonStr
  }
}

export { generateSingleQuestion }

export default {
  generateQuestionsDirectly,
  generateQuestionsProgressively,
  testDirectConnection,
  generateSingleQuestion
}