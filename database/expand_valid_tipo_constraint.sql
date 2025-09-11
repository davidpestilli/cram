-- =====================================================
-- EXPANSÃO DA CONSTRAINT valid_tipo PARA TIPOS MAIS PRECISOS
-- =====================================================
-- 
-- Este script expande a constraint valid_tipo para incluir
-- tipos tecnicamente mais precisos e específicos
--
-- Execute ANTES de rodar o populate_subsections.sql atualizado
-- =====================================================

-- Remover constraint existente
ALTER TABLE content_subsections 
DROP CONSTRAINT valid_tipo;

-- Adicionar nova constraint expandida com tipos mais precisos
ALTER TABLE content_subsections 
ADD CONSTRAINT valid_tipo CHECK (tipo IN (
    -- Tipos originais (mantidos para compatibilidade)
    'conceito_base', 'objeto_crime', 'consequencia', 
    'conduta_equiparada', 'conduta_especifica', 
    'crime_preparatorio', 'agravante',
    
    -- Tipos mais precisos para melhor granularidade técnica
    'modalidade_especifica',      -- Modalidades específicas de crimes (peculato-furto, etc.)
    'modalidade_culposa',         -- Condutas culposas específicas
    'modalidade_privilegiada',    -- Formas privilegiadas com penas menores
    'extincao_punibilidade',      -- Casos que extinguem punibilidade (reparação, etc.)
    'crime_informatico',          -- Crimes específicos contra sistemas informatizados
    'crime_especifico',           -- Crimes específicos por categoria profissional ou situação
    'elemento_subjetivo',         -- Elementos subjetivos (dolo, culpa, finalidade específica)
    'conceito_diferencial',       -- Conceitos que diferenciam crimes similares
    'sujeito_ativo',             -- Definições sobre quem pode ser sujeito ativo
    'modificadoras',             -- Circunstâncias que modificam penas (não só agravantes)
    'objeto_equiparado'          -- Objetos equiparados por lei a outros
));

-- Verificar se a constraint foi aplicada corretamente
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'valid_tipo';

-- =====================================================
-- RESULTADO ESPERADO:
-- =====================================================
-- A constraint agora aceita 16 tipos diferentes, permitindo
-- classificação técnica mais precisa das subseções para:
-- - Melhor geração de questões pela IA
-- - Analytics mais detalhados
-- - Interface mais informativa
-- - Ensino mais direcionado por tipo de conceito
-- =====================================================