import axios from 'axios'
import semanticAnalysisService from './semanticAnalysisService'
import embeddingsService from './embeddingsService'

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
  
  // Log do prompt para debugging
  console.log(`\n🔍 [PROMPT ENVIADO] Questão ${questionNumber} (${questionConfig.type.toUpperCase()})`)
  if (questionConfig.type === 'pratica') {
    console.log(`🎭 [VERIFICAÇÃO] Instruções de narrativa incluídas no prompt:`)
    const includesNarrativeInstructions = prompt.includes('NARRATIVA COM PERSONAGENS')
    const includesExampleFormat = prompt.includes('FORMATO OBRIGATÓRIO')
    const includesPersonNames = prompt.includes('Nome de pessoa (João, Maria')
    console.log(`   📋 Instruções de narrativa: ${includesNarrativeInstructions ? '✅' : '❌'}`)
    console.log(`   📝 Formato obrigatório: ${includesExampleFormat ? '✅' : '❌'}`)
    console.log(`   👤 Nomes de exemplo: ${includesPersonNames ? '✅' : '❌'}`)
  }
  
  const requestData = {
    model: "deepseek-chat",
    messages: [
      {
        role: "system",
        content: `Você é um especialista em Direito Penal brasileiro que cria questões educativas.

TIPOS DE QUESTÕES:
1. TEÓRICAS: Falam diretamente sobre a lei ("A pena do Art. 293 é...", "O crime se consuma quando...")
2. PRÁTICAS: Contam histórias com pessoas reais ("João falsificou seu diploma...", "Maria alterou sua certidão...")

🎯 QUESTÃO ATUAL: ${questionConfig.type?.toUpperCase() || 'NÃO ESPECIFICADO'}

${questionConfig.type === 'pratica' ? 
`🔴 ATENÇÃO - QUESTÃO PRÁTICA:
CRIE UMA HISTÓRIA com pessoa, ação e documento/objeto.
EXEMPLO: "Carlos alterou sua carteira de habitação para mudar a categoria sem fazer o exame. Cometeu falsificação de documento público."
NÃO faça questão teórica!` : 
`🔵 QUESTÃO TEÓRICA:
Fale diretamente sobre a lei, penas, conceitos juridicos.
EXEMPLO: "A pena para falsificação de documento público é reclusão de 2 a 6 anos."`
}

Resposta OBRIGATÓRIA: ${questionConfig.expected ? 'VERDADEIRA' : 'FALSA'}
correct_answer DEVE SER: ${questionConfig.expected ? 'true' : 'false'}

RESPONDA APENAS JSON:
{
  "id": ${questionNumber},
  "question_text": "sua questão aqui",
  "correct_answer": ${questionConfig.expected},
  "explanation": "explicação",
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
  
  // Log detalhado para análise de questões práticas vs teóricas
  const isTheoreticalQuestion = questionConfig.type === 'teorica'
  
  console.log(`\n🎯 [QUESTÃO CRIADA] ID: ${questionNumber}`)
  console.log(`📝 TIPO: ${questionConfig.type.toUpperCase()} (${questionConfig.expected ? 'VERDADEIRA' : 'FALSA'})`)
  console.log(`💭 TEXTO: "${question.question_text}"`)
  console.log(`✅ RESPOSTA: ${question.correct_answer}`)
  
  // Análise específica para questões práticas
  if (!isTheoreticalQuestion) {
    const hasPersonName = /\b(João|Maria|Ana|Carlos|Pedro|Marcos|José|Antônio|Francisca|Manoel|Sandra|Roberto|Paula|Ricardo|Fernanda|Eduardo|Luciana|Rafael|Juliana|Diego|Camila|Bruno|Patrícia|Gustavo|Aline|Felipe|Cristina|André|Márcia|Thiago|Renata|Leonardo|Vanessa|Rodrigo|Simone|Fábio|Tatiana|Vitor|Carla|Daniel|Silvia|Leandro|Rose)\b/i.test(question.question_text)
    const hasAction = /(alterou|criou|falsificou|imitou|destruiu|rasgou|encontrou|colou|fabricou|modificou|apagou|trocou|substituiu|copiou|reproduziu)/i.test(question.question_text)
    const hasDocument = /(certidão|diploma|carteira|RG|CPF|documento|papel|selo|vale|bilhete|cautela|talão|recibo|guia|alvará)/i.test(question.question_text)
    const hasContext = /(para conseguir|para obter|durante|em um|numa|por causa|devido|com o objetivo|a fim de)/i.test(question.question_text)
    
    console.log(`🎭 ANÁLISE NARRATIVA:`)
    console.log(`   👤 Tem nome de pessoa: ${hasPersonName ? '✅' : '❌'}`)
    console.log(`   🎬 Tem ação concreta: ${hasAction ? '✅' : '❌'}`)
    console.log(`   📄 Tem documento específico: ${hasDocument ? '✅' : '❌'}`)
    console.log(`   🌍 Tem contexto/motivação: ${hasContext ? '✅' : '❌'}`)
    
    const narrativeScore = [hasPersonName, hasAction, hasDocument, hasContext].filter(Boolean).length
    console.log(`🏆 PONTUAÇÃO NARRATIVA: ${narrativeScore}/4 ${narrativeScore >= 3 ? '✅ BOA NARRATIVA' : '⚠️ NARRATIVA FRACA'}`)
    
    if (narrativeScore < 3) {
      console.log(`⚠️ [ALERTA] Questão prática ${questionNumber} não atende aos critérios de narrativa!`)
    }
  } else {
    console.log(`📚 QUESTÃO TEÓRICA - Análise conceitual`)
    const hasLegalConcept = /(pena|reclusão|detenção|art\.|artigo|inciso|parágrafo|crime|tipificação)/i.test(question.question_text)
    console.log(`   ⚖️ Tem conceito legal: ${hasLegalConcept ? '✅' : '❌'}`)
  }
  
  console.log(`🔧 EXPLICAÇÃO: "${question.explanation}"`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
  
  return question
}

// Contador global para manter distribuição 3F+2V e 3P+2T ao longo de múltiplas subseções
let globalQuestionCounter = 0

// Função para gerar questões progressivamente com análise semântica
export const generateQuestionsProgressively = async (options) => {
  // Suporte tanto para chamada com objeto quanto parâmetros individuais
  let sectionContent, count, onProgress, subjectId, sectionId, customPrompt, startFromGlobalCounter
  
  if (typeof options === 'object' && options.sectionContent) {
    // Nova assinatura (objeto)
    ({ sectionContent, targetCount: count = 5, onProgress = null, subjectId = 1, sectionId = 1, customPrompt, startFromGlobalCounter = true } = options)
  } else {
    // Assinatura antiga (parâmetros individuais) para compatibilidade
    sectionContent = arguments[0]
    count = arguments[1] || 5
    onProgress = arguments[2] || null
    subjectId = arguments[3] || 1
    sectionId = arguments[4] || 1
    startFromGlobalCounter = false
  }
  
  console.log(`🚀 [PROGRESSIVO INTELIGENTE] Gerando ${count} questões para: ${sectionContent?.titulo || 'N/A'}`)
  
  if (!API_KEY) {
    throw new Error('❌ API Key não configurada. Configure VITE_DEEPSEEK_API_KEY no arquivo .env')
  }

  // Análise semântica prévia
  console.log('🧠 Realizando análise semântica do espaço existente...')
  const semanticAnalysis = await semanticAnalysisService.analyzeExistingQuestions(subjectId, sectionId)
  
  console.log(`📊 Análise concluída:`, {
    questionsExistentes: semanticAnalysis.totalQuestions,
    clusters: semanticAnalysis.clusters.length,
    areasSuper: semanticAnalysis.overexploredAreas.length,
    sugestoes: semanticAnalysis.suggestions.length
  })

  const questions = []
  const errors = []
  const generatedEmbeddings = [] // Para verificação em tempo real

  // Gerar questões uma por vez com orientação inteligente
  for (let i = 1; i <= count; i++) {
    try {
      // Usar contador global ou local dependendo da configuração
      const questionNumber = startFromGlobalCounter ? (++globalQuestionCounter) : i
      console.log(`📝 Gerando questão ${i}/${count} com orientação semântica... (Posição global: ${questionNumber})`)
      
      const question = await generateSingleQuestionIntelligent(
        sectionContent, 
        questionNumber, 
        semanticAnalysis, 
        generatedEmbeddings,
        customPrompt
      )
      
      // Verificação em tempo real
      if (embeddingsService.isEnabled()) {
        let quickEmbedding = await embeddingsService.generateEmbedding(question.question_text)
        if (quickEmbedding) {
          const similarity = await checkRealTimeSimilarity(quickEmbedding, generatedEmbeddings, semanticAnalysis)
          
          if (similarity > 0.9) {
            console.log(`⚠️ Questão ${i} muito similar (${similarity.toFixed(3)}), regenerando...`)
            try {
              // Tentar regenerar com mais diversificação (apenas 1 tentativa)
              const diversifiedQuestion = await regenerateWithDiversification(
                sectionContent, 
                i, 
                semanticAnalysis,
                question
              )
              // Substituir a questão inteira
              Object.assign(question, diversifiedQuestion)
              quickEmbedding = await embeddingsService.generateEmbedding(question.question_text)
              console.log(`✅ Questão ${i} regenerada com sucesso`)
            } catch (error) {
              console.log(`⚠️ Falha ao regenerar questão ${i}, usando original:`, error.message)
              // Usar questão original se regeneração falhar
            }
          }
          
          generatedEmbeddings.push(quickEmbedding)
        }
      }
      
      questions.push(question)
      
      console.log(`✅ Questão ${i} gerada com sucesso`)
      
      // Callback de progresso
      if (onProgress) {
        onProgress({
          current: i,
          total: count,
          question: question,
          questions: [...questions],
          semanticAnalysis: i === 1 ? semanticAnalysis : undefined
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
  
  // Log da distribuição de questões V/F
  if (startFromGlobalCounter && questions.length > 0) {
    const trueCount = questions.filter(q => q.correct_answer === true).length
    const falseCount = questions.filter(q => q.correct_answer === false).length
    console.log(`📊 Distribuição V/F desta batch: ${trueCount}V + ${falseCount}F | Contador global atual: ${globalQuestionCounter}`)
  }
  
  // Log da distribuição de tipos (prática vs teórica)
  if (questions.length > 0) {
    let teoricasCount = 0
    let praticasCount = 0
    let narrativasComBomScore = 0
    
    questions.forEach((q, index) => {
      const questionNumber = startFromGlobalCounter ? (globalQuestionCounter - questions.length + index + 1) : (index + 1)
      const questionConfig = getQuestionConfig(questionNumber)
      
      if (questionConfig.type === 'teorica') {
        teoricasCount++
      } else {
        praticasCount++
        
        // Verificar se a questão prática tem boa narrativa
        const hasPersonName = /\b(João|Maria|Ana|Carlos|Pedro|Marcos|José|Antônio|Francisca|Manoel|Sandra|Roberto|Paula|Ricardo|Fernanda|Eduardo|Luciana|Rafael|Juliana|Diego|Camila|Bruno|Patrícia|Gustavo|Aline|Felipe|Cristina|André|Márcia|Thiago|Renata|Leonardo|Vanessa|Rodrigo|Simone|Fábio|Tatiana|Vitor|Carla|Daniel|Silvia|Leandro|Rose)\b/i.test(q.question_text)
        const hasAction = /(alterou|criou|falsificou|imitou|destruiu|rasgou|encontrou|colou|fabricou|modificou|apagou|trocou|substituiu|copiou|reproduziu)/i.test(q.question_text)
        const hasDocument = /(certidão|diploma|carteira|RG|CPF|documento|papel|selo|vale|bilhete|cautela|talão|recibo|guia|alvará)/i.test(q.question_text)
        const hasContext = /(para conseguir|para obter|durante|em um|numa|por causa|devido|com o objetivo|a fim de)/i.test(q.question_text)
        
        const narrativeScore = [hasPersonName, hasAction, hasDocument, hasContext].filter(Boolean).length
        if (narrativeScore >= 3) {
          narrativasComBomScore++
        }
      }
    })
    
    console.log(`\n📋 [RESUMO DA GERAÇÃO]`)
    console.log(`📚 Questões teóricas: ${teoricasCount}/${questions.length}`)
    console.log(`🎭 Questões práticas: ${praticasCount}/${questions.length}`)
    console.log(`✅ Narrativas bem estruturadas: ${narrativasComBomScore}/${praticasCount} práticas`)
    console.log(`📈 Taxa de sucesso narrativo: ${praticasCount > 0 ? ((narrativasComBomScore/praticasCount)*100).toFixed(1) : 0}%`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  }
  
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

// Função para resetar o contador global de questões
export const resetGlobalQuestionCounter = () => {
  console.log(`🔄 Resetando contador global de questões (estava em ${globalQuestionCounter})`)
  globalQuestionCounter = 0
}

// Função para obter o contador atual (para debugging)
export const getGlobalQuestionCounter = () => globalQuestionCounter

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
  const isTheoreticalQuestion = questionConfig.type === 'teorica'
  
  const answerInstructions = questionConfig.expected 
    ? (isTheoreticalQuestion 
        ? 'Crie uma afirmação CORRETA sobre o conteúdo legal direto (definições, penas, elementos).'
        : 'Crie um CASO PRÁTICO CORRETO onde a situação se enquadra perfeitamente no crime.')
    : (isTheoreticalQuestion
        ? 'Crie uma afirmação INCORRETA sobre o conteúdo legal, introduzindo erro sutil mas claro.'
        : 'Crie um CASO PRÁTICO INCORRETO onde a situação NÃO caracteriza o crime ou se confunde com outro.')
  
  // Formatar conteúdo completo
  const fullLegalContent = formatCompleteLegalContent(conteudo)
  
  return `Crie UMA questão verdadeiro/falso sobre ${artigo} - ${titulo}.
RESPOSTA OBRIGATÓRIA: ${expectedAnswer}

CONTEÚDO LEGAL COMPLETO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${fullLegalContent}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

QUESTÃO #${questionNumber} - TIPO: ${questionConfig.type.toUpperCase()}
${questionConfig.focus}
${answerInstructions}

${isTheoreticalQuestion 
  ? `INSTRUÇÕES PARA QUESTÕES TEÓRICAS:
- Foque no TEXTO DA LEI: definições, penas, elementos, tipificação
- EXPLORE OS INCISOS: Use diferentes incisos (I, II, III, IV, V, VI) para questões específicas
- SEJA PRECISO: Cite valores exatos de penas, modalidades corretas (reclusão/detenção)
- Se FALSA: Introduza erros específicos (pena errada, modalidade incorreta, inciso trocado)
- Se VERDADEIRA: Use informações exatas dos artigos e incisos`
  : `INSTRUÇÕES PARA QUESTÕES PRÁTICAS - OBRIGATÓRIO SEGUIR:

🎭 CRIE UMA NARRATIVA COM PERSONAGENS:
Uma questão prática é uma HISTÓRIA REAL com personagens onde a legislação está sendo analisada.
Deve ser uma NARRAÇÃO com pessoas reais em situações concretas da vida.

🎨 FORMATO OBRIGATÓRIO: "[Nome da pessoa] [ação concreta] [objeto/documento] [finalidade/contexto]. [Conclusão jurídica]."

✅ EXEMPLOS DE NARRATIVAS PRÁTICAS CORRETAS:
- "Maria alterou os dados de sua certidão de nascimento para parecer mais jovem em um concurso público. Cometeu o crime do Art. X."
- "João criou um diploma universitário falso da USP para conseguir um emprego melhor. Praticou falsificação de documento público."
- "Ana rasgou a carteira de motorista do ex-marido durante uma discussão. Cometeu o crime de falsificação."
- "Pedro imitou a assinatura do pai em um cheque para sacar dinheiro. Caracteriza falsificação de documento."
- "Carlos encontrou um selo tributário no chão e o colou em um documento vencido. Sua conduta configura crime."

🚫 PROIBIDO em questões práticas:
- Citar artigos diretamente ("O Art. 293 prevê...")
- Explicar conceitos ("A falsificação consiste em...")
- Usar termos técnicos sem contexto prático
- Questões abstratas ou genéricas
- Frases sem personagens ou situação concreta

🎯 ELEMENTOS OBRIGATÓRIOS PARA A NARRATIVA:
- Nome de pessoa (João, Maria, Carlos, Ana, etc.)
- Ação concreta (alterou, criou, falsificou, imitou, destruiu, encontrou, colou)
- Documento/objeto específico (RG, diploma, certidão, carteira, selo, vale postal)
- Motivação/contexto (para conseguir emprego, enganar autoridade, obter vantagem, por raiva)
- Situação da vida real (concurso, trabalho, discussão, necessidade financeira)
- Conclusão jurídica simples sobre se configura ou não o crime

📚 LEMBRE-SE: Um exemplo prático envolve uma NARRAÇÃO com personagens em casos reais onde a legislação está sendo analisada. Não precisa ser longa, basta ser um caso real e situacional.`
}

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
// Distribuição por tipo: questões 1, 2 = teóricas | questões 3, 4, 5 = práticas
const getQuestionConfig = (questionNumber) => {
  // Normalizar para ciclo de 5 questões (1-5, 6-10, 11-15, etc.)
  const normalizedNumber = ((questionNumber - 1) % 5) + 1
  
  const configs = [
    { 
      id: 1, 
      expected: false,
      type: "teorica",
      focus: "QUESTÃO TEÓRICA: Foque na PENA - introduza erro na modalidade ou valor (ex: detenção em vez de reclusão, valores incorretos)" 
    },
    { 
      id: 2, 
      expected: true,
      type: "teorica",
      focus: "QUESTÃO TEÓRICA: Foque na TIPIFICAÇÃO - use definições e condutas corretas da lei (falsificar, fabricar, alterar)" 
    }, 
    { 
      id: 3, 
      expected: false,
      type: "pratica",
      focus: "QUESTÃO PRÁTICA FALSA: Crie uma história com pessoas reais onde a situação NÃO é crime (ex: João rasgou seu próprio certificado, Maria perdeu carteira de identidade)" 
    },
    { 
      id: 4, 
      expected: true,
      type: "pratica", 
      focus: "QUESTÃO PRÁTICA VERDADEIRA: Crie uma história com pessoas reais onde claramente OCORREU o crime (ex: Carlos falsificou diploma para conseguir emprego)" 
    },
    { 
      id: 5, 
      expected: false,
      type: "pratica",
      focus: "QUESTÃO PRÁTICA FALSA: Crie uma história que PARECE ser crime mas NÃO é (ex: Ana imitou assinatura da irmã com autorização, documento privado vs público)" 
    }
  ]
  return configs[normalizedNumber - 1] || configs[0]
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

// Funções auxiliares para geração inteligente

async function generateSingleQuestionIntelligent(sectionContent, questionNumber, semanticAnalysis, generatedEmbeddings, customPrompt = null) {
  let guidedPrompt
  
  if (customPrompt) {
    // Usar prompt personalizado quando fornecido
    guidedPrompt = customPrompt
  } else {
    // Criar prompt com orientação semântica padrão
    guidedPrompt = await semanticAnalysisService.generateGuidedPrompt(
      '',
      sectionContent,
      semanticAnalysis
    )
  }

  // Usar a função original com prompt guiado
  const questionConfig = getQuestionConfig(questionNumber)
  const prompt = createIntelligentQuestionPrompt(sectionContent, questionNumber, questionConfig, guidedPrompt)
  
  // Log do prompt para debugging
  console.log(`\n🔍 [PROMPT ENVIADO] Questão ${questionNumber} (${questionConfig.type.toUpperCase()})`)
  if (questionConfig.type === 'pratica') {
    console.log(`🎭 [VERIFICAÇÃO] Instruções de narrativa incluídas no prompt:`)
    const includesNarrativeInstructions = prompt.includes('NARRATIVA COM PERSONAGENS')
    const includesExampleFormat = prompt.includes('FORMATO OBRIGATÓRIO')
    const includesPersonNames = prompt.includes('Nome de pessoa (João, Maria')
    console.log(`   📋 Instruções de narrativa: ${includesNarrativeInstructions ? '✅' : '❌'}`)
    console.log(`   📝 Formato obrigatório: ${includesExampleFormat ? '✅' : '❌'}`)
    console.log(`   👤 Nomes de exemplo: ${includesPersonNames ? '✅' : '❌'}`)
    
    if (!includesNarrativeInstructions) {
      console.log(`⚠️ [PROBLEMA] Instruções de narrativa NÃO foram incluídas no prompt!`)
    }
  }
  
  return await generateSingleQuestionWithPrompt(sectionContent, questionNumber, prompt)
}

function createIntelligentQuestionPrompt(sectionContent, questionNumber, questionConfig, guidancePrompt) {
  const artigo = sectionContent.artigo || 'Artigo não especificado'
  const titulo = sectionContent.titulo || 'Seção sem título'
  const conteudo = sectionContent.conteudo || {}
  
  const expectedAnswer = questionConfig.expected ? 'VERDADEIRA' : 'FALSA'
  const isTheoreticalQuestion = questionConfig.type === 'teorica'
  
  const answerInstructions = questionConfig.expected 
    ? (isTheoreticalQuestion 
        ? 'Crie uma afirmação CORRETA sobre o conteúdo legal direto (definições, penas, elementos).'
        : 'Crie um CASO PRÁTICO CORRETO onde a situação se enquadra perfeitamente no crime.')
    : (isTheoreticalQuestion
        ? 'Crie uma afirmação INCORRETA sobre o conteúdo legal, introduzindo erro sutil mas claro.'
        : 'Crie um CASO PRÁTICO INCORRETO onde a situação NÃO caracteriza o crime ou se confunde com outro.')

  // Usar conteúdo completo formatado
  const fullLegalContent = formatCompleteLegalContent(conteudo)

  return `${guidancePrompt}

CONTEXTO LEGAL COMPLETO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${artigo} - ${titulo}

${fullLegalContent}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

QUESTÃO #${questionNumber} - TIPO: ${questionConfig.type.toUpperCase()}
RESPOSTA OBRIGATÓRIA: ${expectedAnswer}
${answerInstructions}

${isTheoreticalQuestion 
  ? `INSTRUÇÕES PARA QUESTÕES TEÓRICAS:
- Foque no TEXTO DA LEI: definições, penas, elementos, tipificação
- EXPLORE OS INCISOS: Use diferentes incisos (I, II, III, IV, V, VI) para questões específicas
- SEJA PRECISO: Cite valores exatos de penas, modalidades corretas (reclusão/detenção)
- Se FALSA: Introduza erros específicos (pena errada, modalidade incorreta, inciso trocado)
- Se VERDADEIRA: Use informações exatas dos artigos e incisos`
  : `INSTRUÇÕES PARA QUESTÕES PRÁTICAS - OBRIGATÓRIO SEGUIR:

🎭 CRIE UMA NARRATIVA COM PERSONAGENS:
Uma questão prática é uma HISTÓRIA REAL com personagens onde a legislação está sendo analisada.
Deve ser uma NARRAÇÃO com pessoas reais em situações concretas da vida.

🎨 FORMATO OBRIGATÓRIO: "[Nome da pessoa] [ação concreta] [objeto/documento] [finalidade/contexto]. [Conclusão jurídica]."

✅ EXEMPLOS DE NARRATIVAS PRÁTICAS CORRETAS:
- "Maria alterou os dados de sua certidão de nascimento para parecer mais jovem em um concurso público. Cometeu o crime do Art. X."
- "João criou um diploma universitário falso da USP para conseguir um emprego melhor. Praticou falsificação de documento público."
- "Ana rasgou a carteira de motorista do ex-marido durante uma discussão. Cometeu o crime de falsificação."
- "Pedro imitou a assinatura do pai em um cheque para sacar dinheiro. Caracteriza falsificação de documento."
- "Carlos encontrou um selo tributário no chão e o colou em um documento vencido. Sua conduta configura crime."

🚫 PROIBIDO em questões práticas:
- Citar artigos diretamente ("O Art. 293 prevê...")
- Explicar conceitos ("A falsificação consiste em...")
- Usar termos técnicos sem contexto prático
- Questões abstratas ou genéricas
- Frases sem personagens ou situação concreta

🎯 ELEMENTOS OBRIGATÓRIOS PARA A NARRATIVA:
- Nome de pessoa (João, Maria, Carlos, Ana, etc.)
- Ação concreta (alterou, criou, falsificou, imitou, destruiu, encontrou, colou)
- Documento/objeto específico (RG, diploma, certidão, carteira, selo, vale postal)
- Motivação/contexto (para conseguir emprego, enganar autoridade, obter vantagem, por raiva)
- Situação da vida real (concurso, trabalho, discussão, necessidade financeira)
- Conclusão jurídica simples sobre se configura ou não o crime

📚 LEMBRE-SE: Um exemplo prático envolve uma NARRAÇÃO com personagens em casos reais onde a legislação está sendo analisada. Não precisa ser longa, basta ser um caso real e situacional.`
}

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

async function regenerateWithDiversification(sectionContent, questionNumber, semanticAnalysis, originalQuestion) {
  const diversificationPrompt = `
IMPORTANTE: A questão anterior era muito similar a questões existentes:
"${originalQuestion.question_text}"

CRIE uma questão COMPLETAMENTE DIFERENTE sobre o mesmo tópico jurídico.
${semanticAnalysis.suggestions.map(s => `• ${s}`).join('\n')}

Seja CRIATIVO e aborde aspectos ÚNICOS do tema.
`
  
  const questionConfig = getQuestionConfig(questionNumber)
  const prompt = createIntelligentQuestionPrompt(sectionContent, questionNumber, questionConfig, diversificationPrompt)
  
  return await generateSingleQuestionWithPrompt(sectionContent, questionNumber, prompt)
}

async function checkRealTimeSimilarity(questionEmbedding, generatedEmbeddings, semanticAnalysis) {
  let maxSimilarity = 0

  // Comparar com questões já geradas nesta sessão
  for (const embedding of generatedEmbeddings) {
    const similarity = embeddingsService.calculateSimilarity(questionEmbedding, embedding)
    maxSimilarity = Math.max(maxSimilarity, similarity)
  }

  // Comparar com clusters existentes (amostragem)
  for (const cluster of semanticAnalysis.clusters.slice(0, 3)) {
    if (cluster.centroid?.embedding) {
      const similarity = embeddingsService.calculateSimilarity(
        questionEmbedding, 
        cluster.centroid.embedding
      )
      maxSimilarity = Math.max(maxSimilarity, similarity)
    }
  }

  return maxSimilarity
}

async function generateSingleQuestionWithPrompt(sectionContent, questionNumber, customPrompt) {
  try {
    const response = await deepseekClient.post('', {
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'Você é um especialista em Direito Penal brasileiro. Crie questões precisas e educativas.'
        },
        {
          role: 'user',
          content: customPrompt
        }
      ],
      max_tokens: 800,
      temperature: 0.8, // Maior criatividade
      response_format: { type: 'json_object' }
    })

    if (!response.data?.choices?.[0]?.message?.content) {
      throw new Error('Resposta vazia da API')
    }

    const content = response.data.choices[0].message.content
    const parsed = JSON.parse(content)
    
    const question = {
      id: questionNumber,
      question_text: parsed.question_text,
      correct_answer: Boolean(parsed.correct_answer),
      explanation: parsed.explanation,
      difficulty: parsed.difficulty || 3,
      source_text: parsed.source_text || sectionContent.artigo,
      modified_parts: parsed.modified_parts || []
    }
    
    // Log detalhado para análise de questões práticas vs teóricas
    const questionConfig = getQuestionConfig(questionNumber)
    const isTheoreticalQuestion = questionConfig.type === 'teorica'
    
    console.log(`\n🎯 [QUESTÃO CRIADA] ID: ${questionNumber}`)
    console.log(`📝 TIPO: ${questionConfig.type.toUpperCase()} (${questionConfig.expected ? 'VERDADEIRA' : 'FALSA'})`)
    console.log(`💭 TEXTO: "${question.question_text}"`)
    console.log(`✅ RESPOSTA: ${question.correct_answer}`)
    
    // Análise específica para questões práticas
    if (!isTheoreticalQuestion) {
      const hasPersonName = /\b(João|Maria|Ana|Carlos|Pedro|Marcos|José|Antônio|Francisca|Manoel|Sandra|Roberto|Paula|Ricardo|Fernanda|Eduardo|Luciana|Rafael|Juliana|Diego|Camila|Bruno|Patrícia|Gustavo|Aline|Felipe|Cristina|André|Márcia|Thiago|Renata|Leonardo|Vanessa|Rodrigo|Simone|Fábio|Tatiana|Vitor|Carla|Daniel|Silvia|Leandro|Rose)\b/i.test(question.question_text)
      const hasAction = /(alterou|criou|falsificou|imitou|destruiu|rasgou|encontrou|colou|fabricou|modificou|apagou|trocou|substituiu|copiou|reproduziu)/i.test(question.question_text)
      const hasDocument = /(certidão|diploma|carteira|RG|CPF|documento|papel|selo|vale|bilhete|cautela|talão|recibo|guia|alvará)/i.test(question.question_text)
      const hasContext = /(para conseguir|para obter|durante|em um|numa|por causa|devido|com o objetivo|a fim de)/i.test(question.question_text)
      
      console.log(`🎭 ANÁLISE NARRATIVA:`)
      console.log(`   👤 Tem nome de pessoa: ${hasPersonName ? '✅' : '❌'}`)
      console.log(`   🎬 Tem ação concreta: ${hasAction ? '✅' : '❌'}`)
      console.log(`   📄 Tem documento específico: ${hasDocument ? '✅' : '❌'}`)
      console.log(`   🌍 Tem contexto/motivação: ${hasContext ? '✅' : '❌'}`)
      
      const narrativeScore = [hasPersonName, hasAction, hasDocument, hasContext].filter(Boolean).length
      console.log(`🏆 PONTUAÇÃO NARRATIVA: ${narrativeScore}/4 ${narrativeScore >= 3 ? '✅ BOA NARRATIVA' : '⚠️ NARRATIVA FRACA'}`)
      
      if (narrativeScore < 3) {
        console.log(`⚠️ [ALERTA] Questão prática ${questionNumber} não atende aos critérios de narrativa!`)
      }
    } else {
      console.log(`📚 QUESTÃO TEÓRICA - Análise conceitual`)
      const hasLegalConcept = /(pena|reclusão|detenção|art\.|artigo|inciso|parágrafo|crime|tipificação)/i.test(question.question_text)
      console.log(`   ⚖️ Tem conceito legal: ${hasLegalConcept ? '✅' : '❌'}`)
    }
    
    console.log(`🔧 EXPLICAÇÃO: "${question.explanation}"`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
    
    return question

  } catch (error) {
    console.error(`❌ Erro ao gerar questão inteligente ${questionNumber}:`, error)
    // Fallback para método original
    return await generateSingleQuestion(sectionContent, questionNumber)
  }
}

// Função auxiliar para formatar conteúdo legal completo
function formatCompleteLegalContent(conteudo) {
  if (!conteudo) return 'Conteúdo não disponível'
  
  let formattedContent = ''
  
  // Tipificação
  if (conteudo.tipificacao) {
    formattedContent += `📋 TIPIFICAÇÃO:\n${conteudo.tipificacao}\n\n`
  }
  
  // Objetos/Incisos (mais comum)
  if (conteudo.objetos && Array.isArray(conteudo.objetos)) {
    formattedContent += `📜 OBJETOS PROTEGIDOS (INCISOS):\n`
    conteudo.objetos.forEach(objeto => {
      formattedContent += `${objeto}\n`
    })
    formattedContent += '\n'
  }
  
  // Elementos do crime
  if (conteudo.elementos && Array.isArray(conteudo.elementos)) {
    formattedContent += `⚖️ ELEMENTOS DO CRIME:\n`
    conteudo.elementos.forEach(elemento => {
      formattedContent += `• ${elemento}\n`
    })
    formattedContent += '\n'
  }
  
  // Objetos protegidos (diferente de objetos/incisos)
  if (conteudo.objetos_protegidos && Array.isArray(conteudo.objetos_protegidos)) {
    formattedContent += `🛡️ BENS JURÍDICOS PROTEGIDOS:\n`
    conteudo.objetos_protegidos.forEach(objeto => {
      formattedContent += `• ${objeto}\n`
    })
    formattedContent += '\n'
  }
  
  // Sujeitos
  if (conteudo.sujeito_ativo) {
    formattedContent += `👤 SUJEITO ATIVO: ${conteudo.sujeito_ativo}\n`
  }
  if (conteudo.sujeito_passivo) {
    formattedContent += `👥 SUJEITO PASSIVO: ${conteudo.sujeito_passivo}\n`
  }
  if (conteudo.sujeito_ativo || conteudo.sujeito_passivo) {
    formattedContent += '\n'
  }
  
  // Modalidades e aspectos objetivos/subjetivos
  if (conteudo.aspecto_objetivo) {
    formattedContent += `🎯 ASPECTO OBJETIVO: ${conteudo.aspecto_objetivo}\n`
  }
  if (conteudo.aspecto_subjetivo) {
    formattedContent += `🧠 ASPECTO SUBJETIVO: ${conteudo.aspecto_subjetivo}\n`
  }
  if (conteudo.aspecto_objetivo || conteudo.aspecto_subjetivo) {
    formattedContent += '\n'
  }
  
  // Modalidades (tentativa, consumação, etc.)
  if (conteudo.tentativa) {
    formattedContent += `⏰ TENTATIVA: ${conteudo.tentativa}\n`
  }
  if (conteudo.consumacao) {
    formattedContent += `✅ CONSUMAÇÃO: ${conteudo.consumacao}\n`
  }
  if (conteudo.tentativa || conteudo.consumacao) {
    formattedContent += '\n'
  }
  
  // Pena (sempre importante)
  if (conteudo.pena) {
    formattedContent += `⚖️ PENA: ${conteudo.pena}\n\n`
  }
  
  // Observações e notas
  if (conteudo.observacoes) {
    formattedContent += `📝 OBSERVAÇÕES IMPORTANTES:\n${conteudo.observacoes}\n\n`
  }
  
  if (conteudo.notas) {
    formattedContent += `💡 NOTAS ADICIONAIS:\n${conteudo.notas}\n\n`
  }
  
  // Classificações doutrinárias
  if (conteudo.classificacao) {
    formattedContent += `📚 CLASSIFICAÇÃO DOUTRINÁRIA:\n`
    if (Array.isArray(conteudo.classificacao)) {
      conteudo.classificacao.forEach(item => {
        formattedContent += `• ${item}\n`
      })
    } else {
      formattedContent += `${conteudo.classificacao}\n`
    }
    formattedContent += '\n'
  }
  
  return formattedContent.trim() || 'Informações não disponíveis'
}

export { generateSingleQuestion }

export default {
  generateQuestionsDirectly,
  generateQuestionsProgressively,
  testDirectConnection,
  generateSingleQuestion
}