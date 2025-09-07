-- =============================================================================
-- MIGRATION: Sistema de Embeddings para Anti-Repetição de Questões
-- Versão: 1.0
-- Data: 2025-01-XX
-- =============================================================================

-- Verificar se a extensão pgvector está habilitada
-- IMPORTANTE: Execute este comando primeiro no painel SQL do Supabase:
-- CREATE EXTENSION IF NOT EXISTS vector;

-- =============================================================================
-- 1. ALTERAÇÕES NA TABELA QUESTIONS
-- =============================================================================

-- Adicionar campos de embeddings na tabela questions
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS embedding vector(1536),
ADD COLUMN IF NOT EXISTS semantic_hash TEXT,
ADD COLUMN IF NOT EXISTS content_categories TEXT[];

-- Adicionar comentários para documentação
COMMENT ON COLUMN questions.embedding IS 'Vector embedding da questão gerado pela OpenAI (dimensão 1536)';
COMMENT ON COLUMN questions.semantic_hash IS 'Hash semântico para identificação rápida de questões similares';
COMMENT ON COLUMN questions.content_categories IS 'Categorias do conteúdo da questão (ex: pena, tipificacao, objetos)';

-- =============================================================================
-- 2. ÍNDICES PARA PERFORMANCE
-- =============================================================================

-- Criar índice para busca por similaridade vetorial
-- NOTA: O parâmetro lists deve ser aproximadamente sqrt(número de linhas)
-- Para até 10.000 questões, lists=100 é adequado
CREATE INDEX IF NOT EXISTS questions_embedding_idx 
ON questions 
USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

-- Índice para busca rápida por hash semântico
CREATE INDEX IF NOT EXISTS questions_semantic_hash_idx 
ON questions (semantic_hash) 
WHERE semantic_hash IS NOT NULL;

-- Índice para busca por categorias
CREATE INDEX IF NOT EXISTS questions_content_categories_idx 
ON questions 
USING GIN (content_categories);

-- Índice composto para busca por seção + hash
CREATE INDEX IF NOT EXISTS questions_section_hash_idx 
ON questions (subject_id, section_id, semantic_hash) 
WHERE semantic_hash IS NOT NULL;

-- =============================================================================
-- 3. FUNÇÃO RPC PARA BUSCA POR SIMILARIDADE
-- =============================================================================

CREATE OR REPLACE FUNCTION find_similar_questions(
  query_embedding vector(1536),
  similarity_threshold float DEFAULT 0.85,
  match_count int DEFAULT 10,
  exclude_question_id int DEFAULT NULL,
  filter_subject_id int DEFAULT NULL,
  filter_section_id int DEFAULT NULL
)
RETURNS TABLE (
  id int,
  question_text text,
  correct_answer boolean,
  explanation text,
  semantic_hash text,
  content_categories text[],
  similarity float,
  subject_id int,
  section_id int
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    q.id,
    q.question_text,
    q.correct_answer,
    q.explanation,
    q.semantic_hash,
    q.content_categories,
    1 - (q.embedding <=> query_embedding) as similarity,
    q.subject_id,
    q.section_id
  FROM questions q
  WHERE 
    q.embedding IS NOT NULL
    AND q.id != COALESCE(exclude_question_id, -1)
    AND (filter_subject_id IS NULL OR q.subject_id = filter_subject_id)
    AND (filter_section_id IS NULL OR q.section_id = filter_section_id)
    AND 1 - (q.embedding <=> query_embedding) > similarity_threshold
  ORDER BY q.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Comentário da função
COMMENT ON FUNCTION find_similar_questions IS 'Busca questões similares usando embeddings vetoriais com filtros opcionais';

-- =============================================================================
-- 4. FUNÇÃO RPC PARA BUSCA POR HASH SEMÂNTICO
-- =============================================================================

CREATE OR REPLACE FUNCTION find_questions_by_hash(
  search_hash text,
  exclude_question_id int DEFAULT NULL,
  filter_subject_id int DEFAULT NULL,
  filter_section_id int DEFAULT NULL
)
RETURNS TABLE (
  id int,
  question_text text,
  correct_answer boolean,
  explanation text,
  semantic_hash text,
  subject_id int,
  section_id int
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    q.id,
    q.question_text,
    q.correct_answer,
    q.explanation,
    q.semantic_hash,
    q.subject_id,
    q.section_id
  FROM questions q
  WHERE 
    q.semantic_hash = search_hash
    AND q.id != COALESCE(exclude_question_id, -1)
    AND (filter_subject_id IS NULL OR q.subject_id = filter_subject_id)
    AND (filter_section_id IS NULL OR q.section_id = filter_section_id);
END;
$$;

-- Comentário da função
COMMENT ON FUNCTION find_questions_by_hash IS 'Busca questões por hash semântico com filtros opcionais';

-- =============================================================================
-- 5. FUNÇÃO RPC PARA ESTATÍSTICAS DE EMBEDDINGS
-- =============================================================================

CREATE OR REPLACE FUNCTION get_embeddings_stats()
RETURNS TABLE (
  total_questions bigint,
  questions_with_embeddings bigint,
  questions_with_hash bigint,
  coverage_percentage numeric,
  unique_categories_count bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_questions,
    COUNT(q.embedding) as questions_with_embeddings,
    COUNT(q.semantic_hash) as questions_with_hash,
    ROUND(
      (COUNT(q.embedding)::numeric / COUNT(*)::numeric) * 100, 2
    ) as coverage_percentage,
    (
      SELECT COUNT(DISTINCT unnest(content_categories)) 
      FROM questions 
      WHERE content_categories IS NOT NULL
    ) as unique_categories_count
  FROM questions q;
END;
$$;

-- Comentário da função
COMMENT ON FUNCTION get_embeddings_stats IS 'Retorna estatísticas sobre a cobertura de embeddings nas questões';

-- =============================================================================
-- 6. FUNÇÃO PARA LIMPEZA DE DADOS ÓRFÃOS
-- =============================================================================

CREATE OR REPLACE FUNCTION cleanup_orphaned_embeddings()
RETURNS int
LANGUAGE plpgsql
AS $$
DECLARE
  cleaned_count int := 0;
BEGIN
  -- Remove embeddings de questões que não existem mais (caso aconteça)
  -- Esta é uma função de manutenção
  
  UPDATE questions 
  SET 
    embedding = NULL,
    semantic_hash = NULL,
    content_categories = NULL
  WHERE 
    question_text IS NULL 
    OR question_text = ''
    OR question_text = 'Questão removida';
    
  GET DIAGNOSTICS cleaned_count = ROW_COUNT;
  
  RETURN cleaned_count;
END;
$$;

-- Comentário da função
COMMENT ON FUNCTION cleanup_orphaned_embeddings IS 'Remove embeddings de questões inválidas ou removidas';

-- =============================================================================
-- 7. VIEW PARA ANÁLISE DE QUALIDADE
-- =============================================================================

CREATE OR REPLACE VIEW questions_quality_analysis AS
SELECT 
  q.id,
  q.subject_id,
  q.section_id,
  q.question_text,
  q.correct_answer,
  q.difficulty,
  q.created_by_ai,
  q.created_at,
  CASE 
    WHEN q.embedding IS NOT NULL THEN 'com_embedding'
    WHEN q.semantic_hash IS NOT NULL THEN 'apenas_hash'
    ELSE 'sem_processamento'
  END as embedding_status,
  array_length(q.content_categories, 1) as categories_count,
  q.content_categories,
  -- Análise de qualidade do texto
  length(q.question_text) as text_length,
  CASE 
    WHEN length(q.question_text) < 50 THEN 'muito_curta'
    WHEN length(q.question_text) > 300 THEN 'muito_longa'
    ELSE 'adequada'
  END as text_quality
FROM questions q
ORDER BY q.created_at DESC;

-- Comentário da view
COMMENT ON VIEW questions_quality_analysis IS 'View para análise de qualidade e status dos embeddings das questões';

-- =============================================================================
-- 8. TRIGGERS PARA MANUTENÇÃO AUTOMÁTICA
-- =============================================================================

-- Função para limpar embeddings quando questão é atualizada
CREATE OR REPLACE FUNCTION invalidate_embedding_on_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Se o texto da questão mudou, invalidar embedding
  IF OLD.question_text != NEW.question_text OR OLD.explanation != NEW.explanation THEN
    NEW.embedding := NULL;
    NEW.semantic_hash := NULL;
    NEW.content_categories := NULL;
    
    -- Log da invalidação
    RAISE LOG 'Embedding invalidado para questão ID % devido à mudança no texto', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_invalidate_embedding_on_update ON questions;
CREATE TRIGGER trigger_invalidate_embedding_on_update
  BEFORE UPDATE ON questions
  FOR EACH ROW
  EXECUTE FUNCTION invalidate_embedding_on_update();

-- =============================================================================
-- 9. POLÍTICAS DE SEGURANÇA (RLS)
-- =============================================================================

-- As políticas RLS existentes para a tabela questions continuarão funcionando
-- Os novos campos embedding, semantic_hash e content_categories herdarão as mesmas políticas

-- =============================================================================
-- 10. VERIFICAÇÕES FINAIS
-- =============================================================================

-- Verificar se todas as alterações foram aplicadas corretamente
DO $$
DECLARE
  embedding_column_exists boolean;
  hash_column_exists boolean;
  categories_column_exists boolean;
  embedding_index_exists boolean;
BEGIN
  -- Verificar colunas
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'embedding'
  ) INTO embedding_column_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'semantic_hash'
  ) INTO hash_column_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'content_categories'
  ) INTO categories_column_exists;
  
  -- Verificar índice principal
  SELECT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'questions' AND indexname = 'questions_embedding_idx'
  ) INTO embedding_index_exists;
  
  -- Relatório final
  RAISE NOTICE '=== RELATÓRIO DE MIGRAÇÃO ===';
  RAISE NOTICE 'Coluna embedding: %', CASE WHEN embedding_column_exists THEN '✅ OK' ELSE '❌ ERRO' END;
  RAISE NOTICE 'Coluna semantic_hash: %', CASE WHEN hash_column_exists THEN '✅ OK' ELSE '❌ ERRO' END;
  RAISE NOTICE 'Coluna content_categories: %', CASE WHEN categories_column_exists THEN '✅ OK' ELSE '❌ ERRO' END;
  RAISE NOTICE 'Índice de embedding: %', CASE WHEN embedding_index_exists THEN '✅ OK' ELSE '❌ ERRO' END;
  RAISE NOTICE '=== FIM DO RELATÓRIO ===';
END
$$;

-- =============================================================================
-- INSTRUÇÕES DE USO APÓS A MIGRAÇÃO
-- =============================================================================

/*
APÓS EXECUTAR ESTA MIGRAÇÃO:

1. Configure as variáveis de ambiente no seu .env:
   VITE_OPENAI_API_KEY=sk-...
   OPENAI_EMBEDDING_MODEL=text-embedding-3-small
   SIMILARITY_THRESHOLD=0.85
   MAX_REGENERATION_ATTEMPTS=3

2. Execute o script de migração das questões existentes:
   node scripts/migrateExistingQuestions.js

3. Teste o sistema:
   - Use o EmbeddingsService.testConnection()
   - Gere algumas questões novas para verificar o sistema
   - Use get_embeddings_stats() para ver a cobertura

4. Monitore performance:
   - Se você tiver mais de 10.000 questões, ajuste o parâmetro lists do índice
   - Use EXPLAIN ANALYZE nas consultas RPC para verificar performance

EXEMPLO DE USO DAS FUNÇÕES RPC:

-- Buscar questões similares
SELECT * FROM find_similar_questions(
  '[0.1, 0.2, ...]'::vector(1536),  -- embedding da questão
  0.85,  -- threshold
  5,     -- limite de resultados
  123,   -- excluir questão ID 123
  1,     -- filtrar por subject_id = 1
  2      -- filtrar por section_id = 2
);

-- Buscar por hash semântico
SELECT * FROM find_questions_by_hash(
  'abc123def456',  -- hash
  123,            -- excluir questão ID 123
  1,              -- filtrar por subject_id = 1
  2               -- filtrar por section_id = 2
);

-- Ver estatísticas
SELECT * FROM get_embeddings_stats();
*/