import axios from 'axios'

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'
const API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY

if (!API_KEY) {
  console.warn('DeepSeek API key not found. Questions will use mock data.')
}

const deepseekClient = axios.create({
  baseURL: DEEPSEEK_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
  },
  timeout: 30000 // 30 segundos
})

export const generateQuestions = async (sectionContent, count = 10) => {
  try {
    if (!API_KEY) {
      // Retorna questões mock se não há API key
      return generateMockQuestions(sectionContent, count)
    }

    const prompt = createPrompt(sectionContent, count)
    
    const response = await deepseekClient.post('', {
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: "Você é um especialista em Direito Penal brasileiro. Sua tarefa é criar questões educativas no formato verdadeiro/falso baseadas em textos jurídicos fornecidos."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3, // Baixa criatividade para precisão jurídica
      max_tokens: 4000,
      stream: false
    })

    const aiResponse = response.data.choices[0].message.content
    return parseAIResponse(aiResponse, sectionContent)

  } catch (error) {
    console.error('Error generating questions with DeepSeek:', error)
    
    if (error.response) {
      console.error('API Response:', error.response.data)
    }
    
    // Fallback para questões mock em caso de erro
    return generateMockQuestions(sectionContent, count)
  }
}

const createPrompt = (sectionContent, count) => {
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

CRIAR ${count} QUESTÕES VERDADEIRO/FALSO de alta qualidade seguindo estes padrões:

🎯 TIPOS DE QUESTÕES A CRIAR:
1. ELEMENTOS DO TIPO: Testar components específicos do crime
2. PENAS E SANÇÕES: Valores exatos, modalidades (reclusão/detenção)  
3. CONDUTAS TÍPICAS: Verbos nucleares e suas variações
4. SUJEITOS: Ativo, passivo, funcionário público
5. OBJETOS JURÍDICOS: Bens protegidos específicos
6. QUALIFICADORAS/AGRAVANTES: Circunstâncias especiais
7. CONSUMAÇÃO/TENTATIVA: Momento consumativo
8. CONCURSO DE CRIMES: Relação com outros tipos penais

🔧 TÉCNICAS PARA QUESTÕES FALSAS:
- Alterar valores de pena (trocar anos, modalidade reclusão/detenção)
- Modificar elementos objetivos (verbos, objetos, circunstâncias)
- Trocar sujeitos ativos (qualquer pessoa vs funcionário público)
- Alterar circunstâncias qualificadoras ou agravantes  
- Modificar requisitos específicos do tipo penal

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

IMPORTANTE: 
- Responda APENAS com JSON válido, sem texto adicional
- Mantenha equilíbrio: ${Math.ceil(count/2)} verdadeiras, ${Math.floor(count/2)} falsas
- Cada questão deve testar conhecimento específico do ${artigo}
- Use terminologia técnica correta do Direito Penal`
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
      return generateHighQualityMockQuestions(sectionContent, 10)
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
  try {
    if (!API_KEY) {
      return { status: 'mock', message: 'Using mock data - API key not configured' }
    }

    // Teste simples da API
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

    return { 
      status: 'healthy', 
      message: 'DeepSeek API is responding',
      model: 'deepseek-chat'
    }
  } catch (error) {
    return { 
      status: 'error', 
      message: error.message,
      fallback: 'Will use mock questions'
    }
  }
}

export default {
  generateQuestions,
  checkAPIHealth
}