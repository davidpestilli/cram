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
  return `
Com base no seguinte texto de Direito Penal brasileiro, crie exatamente ${count} questões no formato VERDADEIRO/FALSO.

TEXTO BASE:
${JSON.stringify(sectionContent, null, 2)}

INSTRUÇÕES IMPORTANTES:
1. Crie questões inteligentes e educativas
2. Para questões FALSAS, modifique sutilmente o texto original (altere penas, elementos do tipo, condições, etc.)
3. Para questões VERDADEIRAS, use o texto original como base
4. Foque em detalhes importantes: penas, elementos objetivos, agravantes, atenuantes
5. Evite questões óbvias demais ou muito complexas
6. Cada questão deve testar conhecimento específico do texto

FORMATO DE RESPOSTA (JSON):
{
  "questions": [
    {
      "id": 1,
      "question_text": "Texto da questão aqui",
      "correct_answer": true,
      "explanation": "Explicação detalhada da resposta",
      "source_text": "Trecho específico do texto original",
      "modified_parts": ["parte1", "parte2"] // apenas para questões falsas
    }
  ]
}

IMPORTANTE: Responda APENAS com o JSON válido, sem texto adicional.`
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

    // Processar e validar questões
    return parsed.questions.map((q, index) => ({
      id: q.id || index + 1,
      question_text: q.question_text || `Questão ${index + 1}`,
      correct_answer: Boolean(q.correct_answer),
      explanation: q.explanation || 'Explicação não disponível',
      source_text: q.source_text || sectionContent.conteudo?.tipificacao || '',
      modified_parts: q.modified_parts || [],
      difficulty: calculateDifficulty(q.question_text),
      created_by_ai: 'deepseek'
    }))

  } catch (error) {
    console.error('Error parsing AI response:', error)
    return generateMockQuestions(sectionContent, 10)
  }
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