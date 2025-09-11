-- =====================================================
-- MIGRAÇÃO PARA SISTEMA DE SUBSEÇÕES
-- =====================================================
-- 
-- Este arquivo cria a estrutura necessária para implementar
-- o sistema de distribuição equilibrada de questões por subseções
--
-- Data: Janeiro 2025
-- =====================================================

-- 1. TABELA DE SUBSEÇÕES DE CONTEÚDO
CREATE TABLE content_subsections (
    id TEXT NOT NULL,                    -- Ex: "tipificacao", "objeto_vale_postal"
    section_id INTEGER NOT NULL,         -- Referência à seção (1, 2, 3, etc.)
    titulo TEXT NOT NULL,                -- "Vale Postal", "Tipificação do Crime"
    conteudo TEXT NOT NULL,              -- Texto específico da subseção
    tipo TEXT NOT NULL,                  -- "conceito_base", "objeto_crime", "consequencia", etc.
    peso INTEGER DEFAULT 1,              -- Peso para distribuição (1-3)
    ordem INTEGER NOT NULL,              -- Ordem de apresentação
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Chave primária composta
    PRIMARY KEY (section_id, id),
    
    -- Foreign key para seções existentes
    FOREIGN KEY (section_id) REFERENCES sections(id),
    
    -- Índices para performance
    CONSTRAINT valid_peso CHECK (peso BETWEEN 1 AND 3),
    CONSTRAINT valid_tipo CHECK (tipo IN (
        'conceito_base', 'objeto_crime', 'consequencia', 
        'conduta_equiparada', 'conduta_especifica', 
        'crime_preparatorio', 'agravante'
    ))
);

-- 2. ESTATÍSTICAS DE QUESTÕES POR SUBSEÇÃO
CREATE TABLE subsection_question_stats (
    section_id INTEGER NOT NULL,
    subsection_id TEXT NOT NULL,
    question_count INTEGER DEFAULT 0,
    target_count INTEGER DEFAULT 0,      -- Quantidade ideal baseada no peso
    last_generated_at TIMESTAMP,
    last_updated TIMESTAMP DEFAULT NOW(),
    
    -- Chave primária composta
    PRIMARY KEY (section_id, subsection_id),
    
    -- Foreign key para content_subsections
    FOREIGN KEY (section_id, subsection_id) 
        REFERENCES content_subsections(section_id, id) 
        ON DELETE CASCADE,
        
    -- Validações
    CONSTRAINT positive_counts CHECK (
        question_count >= 0 AND target_count >= 0
    )
);

-- 3. ADICIONAR COLUNA NA TABELA QUESTIONS EXISTENTE
ALTER TABLE questions 
ADD COLUMN subsection_id TEXT;

-- Criar índice para performance nas consultas por subseção
CREATE INDEX idx_questions_subsection ON questions(section_id, subsection_id);
CREATE INDEX idx_questions_section_subsection_created ON questions(section_id, subsection_id, created_at);

-- 4. TRIGGER PARA ATUALIZAR ESTATÍSTICAS AUTOMATICAMENTE
CREATE OR REPLACE FUNCTION update_subsection_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Quando uma questão é inserida
    IF TG_OP = 'INSERT' AND NEW.subsection_id IS NOT NULL THEN
        INSERT INTO subsection_question_stats (section_id, subsection_id, question_count, last_updated)
        VALUES (NEW.section_id, NEW.subsection_id, 1, NOW())
        ON CONFLICT (section_id, subsection_id) 
        DO UPDATE SET 
            question_count = subsection_question_stats.question_count + 1,
            last_updated = NOW();
    
    -- Quando uma questão é deletada
    ELSIF TG_OP = 'DELETE' AND OLD.subsection_id IS NOT NULL THEN
        UPDATE subsection_question_stats 
        SET 
            question_count = GREATEST(0, question_count - 1),
            last_updated = NOW()
        WHERE section_id = OLD.section_id 
        AND subsection_id = OLD.subsection_id;
    
    -- Quando subsection_id é atualizada
    ELSIF TG_OP = 'UPDATE' THEN
        -- Remove da subseção antiga
        IF OLD.subsection_id IS NOT NULL AND OLD.subsection_id != NEW.subsection_id THEN
            UPDATE subsection_question_stats 
            SET 
                question_count = GREATEST(0, question_count - 1),
                last_updated = NOW()
            WHERE section_id = OLD.section_id 
            AND subsection_id = OLD.subsection_id;
        END IF;
        
        -- Adiciona na subseção nova
        IF NEW.subsection_id IS NOT NULL AND OLD.subsection_id != NEW.subsection_id THEN
            INSERT INTO subsection_question_stats (section_id, subsection_id, question_count, last_updated)
            VALUES (NEW.section_id, NEW.subsection_id, 1, NOW())
            ON CONFLICT (section_id, subsection_id) 
            DO UPDATE SET 
                question_count = subsection_question_stats.question_count + 1,
                last_updated = NOW();
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger na tabela questions
CREATE TRIGGER questions_subsection_stats_trigger
    AFTER INSERT OR UPDATE OR DELETE ON questions
    FOR EACH ROW EXECUTE FUNCTION update_subsection_stats();

-- 5. FUNÇÃO PARA CALCULAR TARGETS BASEADOS NO PESO
CREATE OR REPLACE FUNCTION calculate_subsection_targets(
    p_section_id INTEGER,
    p_total_questions INTEGER DEFAULT 10
)
RETURNS TABLE (
    subsection_id TEXT,
    titulo TEXT,
    peso INTEGER,
    target_count INTEGER,
    current_count INTEGER,
    deficit INTEGER
) AS $$
DECLARE
    total_weight INTEGER;
BEGIN
    -- Calcular peso total da seção
    SELECT SUM(cs.peso) INTO total_weight
    FROM content_subsections cs
    WHERE cs.section_id = p_section_id AND cs.is_active = TRUE;
    
    -- Se não há peso definido, retorna vazio
    IF total_weight IS NULL OR total_weight = 0 THEN
        RETURN;
    END IF;
    
    -- Retornar distribuição calculada
    RETURN QUERY
    SELECT 
        cs.id,
        cs.titulo,
        cs.peso,
        CEIL((cs.peso::DECIMAL / total_weight) * p_total_questions)::INTEGER as target,
        COALESCE(stats.question_count, 0) as current,
        GREATEST(0, CEIL((cs.peso::DECIMAL / total_weight) * p_total_questions)::INTEGER - COALESCE(stats.question_count, 0)) as deficit
    FROM content_subsections cs
    LEFT JOIN subsection_question_stats stats 
        ON cs.section_id = stats.section_id 
        AND cs.id = stats.subsection_id
    WHERE cs.section_id = p_section_id 
    AND cs.is_active = TRUE
    ORDER BY cs.ordem;
END;
$$ LANGUAGE plpgsql;

-- 6. FUNÇÃO PARA ATUALIZAR TARGETS EM MASSA
CREATE OR REPLACE FUNCTION update_all_targets(p_target_per_section INTEGER DEFAULT 10)
RETURNS VOID AS $$
DECLARE
    section_record RECORD;
    subsection_record RECORD;
BEGIN
    -- Para cada seção ativa
    FOR section_record IN 
        SELECT DISTINCT section_id 
        FROM content_subsections 
        WHERE is_active = TRUE
    LOOP
        -- Calcular e atualizar targets para cada subseção
        FOR subsection_record IN 
            SELECT * FROM calculate_subsection_targets(section_record.section_id, p_target_per_section)
        LOOP
            INSERT INTO subsection_question_stats (section_id, subsection_id, target_count, last_updated)
            VALUES (section_record.section_id, subsection_record.subsection_id, subsection_record.target_count, NOW())
            ON CONFLICT (section_id, subsection_id)
            DO UPDATE SET 
                target_count = subsection_record.target_count,
                last_updated = NOW();
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 7. ÍNDICES ADICIONAIS PARA PERFORMANCE
CREATE INDEX idx_content_subsections_section_ordem ON content_subsections(section_id, ordem);
CREATE INDEX idx_content_subsections_tipo ON content_subsections(tipo);
CREATE INDEX idx_subsection_stats_deficit ON subsection_question_stats((target_count - question_count));

-- 8. RLS (Row Level Security) para as novas tabelas
ALTER TABLE content_subsections ENABLE ROW LEVEL SECURITY;
ALTER TABLE subsection_question_stats ENABLE ROW LEVEL SECURITY;

-- Políticas para visualização pública das subseções
CREATE POLICY "Subsections are viewable by everyone" ON content_subsections
    FOR SELECT USING (true);

CREATE POLICY "Subsection stats are viewable by everyone" ON subsection_question_stats
    FOR SELECT USING (true);

-- Políticas para permitir inserção e atualização das estatísticas
CREATE POLICY "Allow insert subsection stats" ON subsection_question_stats
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update subsection stats" ON subsection_question_stats
    FOR UPDATE USING (true);

-- =====================================================
-- VERIFICAÇÕES E VALIDAÇÕES
-- =====================================================

-- Query para verificar se tudo foi criado corretamente
/*
-- Verificar tabelas criadas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('content_subsections', 'subsection_question_stats')
ORDER BY table_name;

-- Verificar se coluna foi adicionada
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'questions' 
AND column_name = 'subsection_id';

-- Verificar triggers criados
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers 
WHERE trigger_name = 'questions_subsection_stats_trigger';

-- Verificar funções criadas
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('update_subsection_stats', 'calculate_subsection_targets', 'update_all_targets');
*/

-- =====================================================
-- FIM DA MIGRAÇÃO
-- =====================================================