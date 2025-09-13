-- =====================================================
-- ADICIONAR TIPOS MATEMÁTICOS À CONSTRAINT valid_tipo
-- =====================================================
-- 
-- Este script adiciona os tipos específicos para matemática
-- à constraint existing da tabela content_subsections
-- Execute ANTES de rodar o populate_matematica_subsections.sql
-- =====================================================

-- Remover constraint existente
ALTER TABLE content_subsections 
DROP CONSTRAINT valid_tipo;

-- Adicionar nova constraint com tipos matemáticos incluídos
ALTER TABLE content_subsections 
ADD CONSTRAINT valid_tipo CHECK (tipo IN (
    -- Tipos originais (direito penal)
    'conceito_base', 'objeto_crime', 'consequencia', 
    'conduta_equiparada', 'conduta_especifica', 
    'crime_preparatorio', 'agravante',
    'modalidade_especifica', 'modalidade_culposa', 'modalidade_privilegiada',
    'extincao_punibilidade', 'crime_informatico', 'crime_especifico',
    'elemento_subjetivo', 'conceito_diferencial', 'sujeito_ativo',
    'modificadoras', 'objeto_equiparado',
    
    -- Tipos específicos para matemática
    'metodo_calculo',           -- Métodos e algoritmos de cálculo
    'aplicacao_pratica',        -- Aplicações práticas e problemas do cotidiano  
    'interpretacao_dados',      -- Interpretação de tabelas, gráficos e dados
    'metodo_resolucao'          -- Estratégias e métodos de resolução de problemas
));

-- Verificar se a constraint foi aplicada corretamente
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'valid_tipo';

-- =====================================================
-- RESULTADO ESPERADO:
-- =====================================================
-- A constraint agora aceita todos os tipos de conteúdo:
-- - Direito Penal: 18 tipos
-- - Matemática: 4 tipos adicionais
-- - Total: 22 tipos válidos
-- =====================================================