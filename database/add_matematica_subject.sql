-- =====================================================
-- CRAM - Adição da Matéria Matemática
-- =====================================================
-- Este script adiciona a matéria Matemática com suas seções
-- Execute no SQL Editor do Supabase Dashboard
-- =====================================================

-- Inserir a matéria Matemática
INSERT INTO subjects (id, name, description, color_code, icon, is_active) VALUES
(2, 'Matemática', 'Fundamentos e aplicações matemáticas', '#059669', 'calculator', true)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  color_code = EXCLUDED.color_code,
  icon = EXCLUDED.icon,
  is_active = EXCLUDED.is_active;

-- Inserir as seções da Matemática baseadas no JSON estruturado
INSERT INTO sections (id, subject_id, name, description, order_index, content_file, is_active) VALUES
(14, 2, 'Operações com Números Reais', 'Propriedades e operações básicas com números reais', 1, 'matematica_secao_1.json', true),
(15, 2, 'MMC e MDC', 'Mínimo múltiplo comum e máximo divisor comum', 2, 'matematica_secao_2.json', true),
(16, 2, 'Razão e Proporção', 'Conceitos de razão, proporção e divisão proporcional', 3, 'matematica_secao_3.json', true),
(17, 2, 'Porcentagem', 'Cálculos percentuais e aplicações comerciais', 4, 'matematica_secao_4.json', true),
(18, 2, 'Regra de Três', 'Regra de três simples e composta', 5, 'matematica_secao_5.json', true),
(19, 2, 'Média Aritmética', 'Média aritmética simples e ponderada', 6, 'matematica_secao_6.json', true),
(20, 2, 'Juros Simples', 'Conceitos e aplicações de juros simples', 7, 'matematica_secao_7.json', true),
(21, 2, 'Equações', 'Equações do 1º e 2º graus', 8, 'matematica_secao_8.json', true),
(22, 2, 'Sistemas de Equações', 'Sistemas de equações do 1º grau', 9, 'matematica_secao_9.json', true),
(23, 2, 'Tabelas e Gráficos', 'Interpretação de dados tabulares e gráficos', 10, 'matematica_secao_10.json', true),
(24, 2, 'Sistemas de Medidas', 'Unidades de medida e conversões', 11, 'matematica_secao_11.json', true),
(25, 2, 'Geometria', 'Figuras planas, espaciais e teorema de Pitágoras', 12, 'matematica_secao_12.json', true),
(26, 2, 'Situações-Problema', 'Resolução de problemas aplicados', 13, 'matematica_secao_13.json', true)
ON CONFLICT (id) DO UPDATE SET 
  subject_id = EXCLUDED.subject_id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  order_index = EXCLUDED.order_index,
  content_file = EXCLUDED.content_file,
  is_active = EXCLUDED.is_active;

-- Verificar os dados inseridos
SELECT s.name as materia, sec.name as secao, sec.description
FROM subjects s
JOIN sections sec ON s.id = sec.subject_id
WHERE s.id = 2
ORDER BY sec.order_index;