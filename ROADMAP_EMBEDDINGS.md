# 🚀 **ROADMAP: Sistema de Embeddings para Anti-Repetição de Questões**

## 📊 **ESTRUTURA ATUAL IDENTIFICADA:**

### **Tabelas Existentes:**
- `subjects` - Matérias (Direito Penal, etc.)
- `sections` - Seções das matérias  
- `questions` - Questões geradas pela IA
- `user_answers` - Respostas dos usuários
- `user_section_stats` - Estatísticas por seção

### **Campos da tabela `questions`:**
- `subject_id`, `section_id`
- `question_text`, `correct_answer`, `explanation`
- `difficulty`, `source_text`, `modified_parts`
- `created_by_ai`, `created_at`

---

## 🏗️ **FASE 1: INFRAESTRUTURA DE EMBEDDINGS**

### **1.1 Alterações no Supabase:**
```sql
-- Adicionar campos de embeddings na tabela questions
ALTER TABLE questions ADD COLUMN embedding vector(1536);
ALTER TABLE questions ADD COLUMN semantic_hash TEXT;
ALTER TABLE questions ADD COLUMN content_categories TEXT[];

-- Criar índice para busca por similaridade
CREATE INDEX questions_embedding_idx ON questions 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Função RPC para busca por similaridade
CREATE OR REPLACE FUNCTION find_similar_questions(
  query_embedding vector(1536),
  similarity_threshold float DEFAULT 0.85,
  match_count int DEFAULT 10,
  exclude_question_id int DEFAULT NULL
)
RETURNS TABLE (
  id int,
  question_text text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    q.id,
    q.question_text,
    1 - (q.embedding <=> query_embedding) as similarity
  FROM questions q
  WHERE 
    q.embedding IS NOT NULL
    AND q.id != COALESCE(exclude_question_id, -1)
    AND 1 - (q.embedding <=> query_embedding) > similarity_threshold
  ORDER BY q.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

### **1.2 Serviço OpenAI Embeddings:**
```javascript
// src/services/embeddingsService.js
class EmbeddingsService {
  - generateEmbedding(text)
  - generateSemanticHash(questionData)
  - extractContentCategories(questionText)
  - calculateSimilarity(embedding1, embedding2)
}
```

---

## 🔧 **FASE 2: INTEGRAÇÃO COM SISTEMA EXISTENTE**

### **2.1 Atualizar QuestionsService:**
```javascript
// Modificar saveQuestions() para incluir embeddings
static async saveQuestions(questions, subjectId, sectionId) {
  // Para cada questão:
  // 1. Gerar embedding via OpenAI
  // 2. Gerar semantic_hash 
  // 3. Verificar similaridade antes de salvar
  // 4. Se similar > 85%, regenerar questão
  // 5. Salvar com todos os campos novos
}
```

### **2.2 Sistema de Verificação Anti-Repetição:**
```javascript
// src/services/questionDeduplicationService.js
class QuestionDeduplicationService {
  - async checkForSimilarQuestions(questionText, subjectId, sectionId)
  - async findDuplicates(embedding, threshold = 0.85)
  - async regenerateIfSimilar(questionData, attemptCount = 0)
}
```

---

## 🔄 **FASE 3: ATUALIZAR SISTEMA PROGRESSIVO**

### **3.1 Modificar directAIService.js:**
```javascript
// Integrar distribuição 3F + 2V
const generateSingleQuestion = async (sectionContent, questionNumber) => {
  const expectedAnswer = [false, true, false, true, false][questionNumber - 1]
  
  // 1. Gerar questão com resposta específica
  // 2. Gerar embedding da questão
  // 3. Verificar similaridade com existentes
  // 4. Se similar > threshold, regenerar com prompt modificado
  // 5. Máximo 3 tentativas por questão
}

// Atualizar generateQuestionsProgressively para incluir verificação
```

### **3.2 Distribuição Verdadeiro/Falso:**
```javascript
const getQuestionConfig = (questionNumber) => {
  const configs = [
    { id: 1, expected: false, focus: "PENA - erro na modalidade" },
    { id: 2, expected: true, focus: "TIPIFICAÇÃO - conduta correta" }, 
    { id: 3, expected: false, focus: "OBJETOS - documento incorreto" },
    { id: 4, expected: true, focus: "SUJEITO - definição correta" },
    { id: 5, expected: false, focus: "CONSUMAÇÃO - momento errado" }
  ]
  return configs[questionNumber - 1]
}
```

---

## 🛠️ **FASE 4: MIGRAÇÃO E RETROCOMPATIBILIDADE**

### **4.1 Script de Migração:**
```javascript
// scripts/migrateExistingQuestions.js
// Gerar embeddings para questões existentes no banco
// Processar em lotes de 50 questões por vez
// Calcular semantic_hash para questões antigas
```

### **4.2 Fallback Gracioso:**
```javascript
// Se OpenAI API falhar:
// 1. Usar hash semântico simples (Fase B do plano original)
// 2. Log de erro, mas não bloquear geração
// 3. Continuar com verificação por palavras-chave
```

---

## 🎯 **FASE 5: REFINAMENTOS**

### **5.1 Sistema de Categorização:**
```javascript
// Categorizar questões automaticamente:
// - Tipo: pena, tipificação, objeto, sujeito, consumação
// - Artigo: 293, 294, etc.
// - Resposta: true/false
// - Complexidade: 1-5
```

### **5.2 Métricas e Monitoramento:**
```javascript
// Dashboard para acompanhar:
// - Taxa de questões similares detectadas
// - Eficácia do sistema anti-repetição  
// - Custo das embeddings OpenAI
// - Performance da busca vetorial
```

---

## 💰 **CUSTOS ESTIMADOS:**
- **OpenAI Embeddings:** ~$0.0001 por questão
- **5 questões/geração:** ~$0.0005 por processo
- **100 processos/dia:** ~$0.05/dia
- **Mensal:** ~$1.50

---

## ⚙️ **VARIÁVEIS DE AMBIENTE NECESSÁRIAS:**
```env
VITE_OPENAI_API_KEY=sk-...
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
SIMILARITY_THRESHOLD=0.85
MAX_REGENERATION_ATTEMPTS=3
```

---

## 📋 **ORDEM DE IMPLEMENTAÇÃO RECOMENDADA:**

1. **Fase 1.2** - Criar EmbeddingsService  
2. **Fase 1.1** - Alterações no Supabase
3. **Fase 3.1** - Atualizar sistema progressivo com 3F+2V
4. **Fase 2** - Integrar anti-repetição 
5. **Fase 4** - Migração e fallbacks
6. **Fase 5** - Refinamentos

---

## 🎯 **OBJETIVOS DO SISTEMA:**

### **Problema Atual:**
- Questões podem se repetir semanticamente
- Não há controle sobre distribuição verdadeiro/falso
- IA pode gerar conteúdo similar com palavras diferentes

### **Solução Proposta:**
- **85% de similaridade máxima** entre questões
- **Distribuição fixa:** 3 falsas + 2 verdadeiras por lote
- **Regeneração automática** para questões muito similares
- **Categorização semântica** para melhor organização

### **Benefícios Esperados:**
- ✅ Maior diversidade de questões
- ✅ Melhor experiência do usuário
- ✅ Controle de qualidade automatizado
- ✅ Métricas detalhadas de performance

---

## 🚨 **DEPENDÊNCIAS CRÍTICAS:**

### **Supabase:**
- Extensão `pgvector` habilitada
- Suporte a funções RPC
- Índices vetoriais configurados

### **OpenAI:**
- API Key válida e com créditos
- Acesso ao modelo `text-embedding-3-small`
- Rate limits apropriados

### **Performance:**
- Índices otimizados para busca vetorial
- Cache de embeddings recentes
- Monitoramento de latência

---

**Status: AGUARDANDO APROVAÇÃO**  
**Próximo Passo: Aprovação para iniciar Fase 1.2**