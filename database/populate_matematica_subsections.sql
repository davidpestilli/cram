-- =====================================================
-- CRAM - Populate Matemática Subsections
-- =====================================================
-- Este script popula as subseções da matéria Matemática
-- baseado no arquivo matematica_subsections.json
-- Execute após add_matematica_subject.sql
-- =====================================================

-- Limpar content_subsections existentes da Matemática (se houver)
DELETE FROM content_subsections WHERE section_id BETWEEN 14 AND 26;

-- =====================================================
-- SEÇÃO 1: Operações com Números Reais (ID: 14)
-- =====================================================
INSERT INTO content_subsections (section_id, id, titulo, conteudo, tipo, peso, ordem) VALUES
(14, 'propriedades_basicas', 'Propriedades das Operações Básicas', 'Adição, subtração, multiplicação e divisão de números reais. Propriedades comutativa, associativa e distributiva.', 'conceito_base', 2, 1),
(14, 'numeros_racionais_irracionais', 'Números Racionais e Irracionais', 'Representação decimal, frações equivalentes, conversão entre formas de representação numérica.', 'conceito_base', 2, 2),
(14, 'operacoes_fracoes', 'Operações com Frações', 'Adição, subtração, multiplicação e divisão de frações. Simplificação e comparação de frações.', 'aplicacao_pratica', 3, 3);

-- =====================================================
-- SEÇÃO 2: MMC e MDC (ID: 15)
-- =====================================================
INSERT INTO content_subsections (section_id, id, titulo, conteudo, tipo, peso, ordem) VALUES
(15, 'conceitos_mmc_mdc', 'Conceitos de MMC e MDC', 'Definições de múltiplo, divisor, mínimo múltiplo comum e máximo divisor comum.', 'conceito_base', 2, 1),
(15, 'algoritmos_calculo', 'Algoritmos de Cálculo', 'Métodos para calcular MMC e MDC: decomposição em fatores primos, algoritmo de Euclides.', 'metodo_calculo', 3, 2),
(15, 'aplicacoes_praticas_mmc', 'Aplicações Práticas', 'Problemas envolvendo periodização, divisão em grupos, simplificação de frações.', 'aplicacao_pratica', 3, 3);

-- =====================================================
-- SEÇÃO 3: Razão e Proporção (ID: 16)
-- =====================================================
INSERT INTO content_subsections (section_id, id, titulo, conteudo, tipo, peso, ordem) VALUES
(16, 'conceito_razao', 'Conceito de Razão', 'Definição de razão entre duas grandezas, interpretação e representação de razões.', 'conceito_base', 2, 1),
(16, 'proporcoes_propriedades', 'Proporções e Propriedades', 'Proporção direta e inversa, propriedade fundamental das proporções, meios e extremos.', 'conceito_base', 2, 2),
(16, 'divisao_proporcional', 'Divisão Proporcional', 'Divisão em partes diretamente e inversamente proporcionais, regra da sociedade.', 'aplicacao_pratica', 3, 3);

-- =====================================================
-- SEÇÃO 4: Porcentagem (ID: 17)
-- =====================================================
INSERT INTO content_subsections (section_id, id, titulo, conteudo, tipo, peso, ordem) VALUES
(17, 'conceito_porcentagem', 'Conceito de Porcentagem', 'Definição de porcentagem, conversão entre porcentagem, decimal e fração.', 'conceito_base', 2, 1),
(17, 'calculos_porcentagem', 'Cálculos com Porcentagem', 'Cálculo de porcentagem de um valor, aumentos e descontos percentuais.', 'metodo_calculo', 3, 2),
(17, 'problemas_comerciais', 'Problemas Comerciais', 'Lucro, prejuízo, desconto, acréscimo, variações percentuais sucessivas.', 'aplicacao_pratica', 3, 3);

-- =====================================================
-- SEÇÃO 5: Regra de Três (ID: 18)
-- =====================================================
INSERT INTO content_subsections (section_id, id, titulo, conteudo, tipo, peso, ordem) VALUES
(18, 'regra_tres_simples', 'Regra de Três Simples', 'Grandezas diretamente e inversamente proporcionais, montagem e resolução de regra de três simples.', 'metodo_calculo', 3, 1),
(18, 'regra_tres_composta', 'Regra de Três Composta', 'Problemas envolvendo três ou mais grandezas proporcionais, análise de proporcionalidade.', 'metodo_calculo', 3, 2),
(18, 'aplicacoes_cotidianas', 'Aplicações em Situações Cotidianas', 'Problemas de tempo, velocidade, trabalho, rendimento, escala, densidade populacional.', 'aplicacao_pratica', 3, 3);

-- =====================================================
-- SEÇÃO 6: Média Aritmética (ID: 19)
-- =====================================================
INSERT INTO content_subsections (section_id, id, titulo, conteudo, tipo, peso, ordem) VALUES
(19, 'media_simples', 'Média Aritmética Simples', 'Conceito, cálculo e interpretação da média aritmética simples de um conjunto de dados.', 'conceito_base', 2, 1),
(19, 'media_ponderada', 'Média Aritmética Ponderada', 'Conceito de peso, cálculo da média ponderada, diferenças entre média simples e ponderada.', 'metodo_calculo', 3, 2),
(19, 'aplicacoes_medias', 'Aplicações das Médias', 'Notas escolares, índices estatísticos, análise de desempenho, tomada de decisões.', 'aplicacao_pratica', 3, 3);

-- =====================================================
-- SEÇÃO 7: Juros Simples (ID: 20)
-- =====================================================
INSERT INTO content_subsections (section_id, id, titulo, conteudo, tipo, peso, ordem) VALUES
(20, 'conceitos_juros', 'Conceitos Básicos de Juros', 'Capital, taxa de juros, tempo, montante. Diferença entre juros simples e compostos.', 'conceito_base', 2, 1),
(20, 'formula_juros_simples', 'Fórmula dos Juros Simples', 'J = C × i × t, M = C + J. Variações da fórmula para cálculo de cada variável.', 'metodo_calculo', 3, 2),
(20, 'problemas_financeiros', 'Problemas Financeiros', 'Aplicações bancárias, empréstimos, financiamentos, descontos simples.', 'aplicacao_pratica', 3, 3);

-- =====================================================
-- SEÇÃO 8: Equações (ID: 21)
-- =====================================================
INSERT INTO content_subsections (section_id, id, titulo, conteudo, tipo, peso, ordem) VALUES
(21, 'equacoes_1_grau', 'Equações do 1º Grau', 'Forma geral ax + b = 0, métodos de resolução, verificação da solução.', 'metodo_calculo', 3, 1),
(21, 'equacoes_2_grau', 'Equações do 2º Grau', 'Forma geral ax² + bx + c = 0, discriminante, fórmula de Bhaskara, relações entre coeficientes e raízes.', 'metodo_calculo', 3, 2),
(21, 'aplicacoes_equacoes', 'Aplicações das Equações', 'Problemas de idade, movimento, geometria, otimização de áreas e volumes.', 'aplicacao_pratica', 3, 3);

-- =====================================================
-- SEÇÃO 9: Sistemas de Equações (ID: 22)
-- =====================================================
INSERT INTO content_subsections (section_id, id, titulo, conteudo, tipo, peso, ordem) VALUES
(22, 'conceito_sistema_linear', 'Conceito de Sistema Linear', 'Sistema de duas equações com duas incógnitas, representação e interpretação geométrica.', 'conceito_base', 2, 1),
(22, 'metodos_resolucao_sistema', 'Métodos de Resolução', 'Método da substituição, método da adição, método gráfico.', 'metodo_calculo', 3, 2),
(22, 'classificacao_sistemas', 'Classificação dos Sistemas', 'Sistema possível determinado, possível indeterminado, impossível. Discussão de sistemas.', 'conceito_base', 3, 3);

-- =====================================================
-- SEÇÃO 10: Tabelas e Gráficos (ID: 23)
-- =====================================================
INSERT INTO content_subsections (section_id, id, titulo, conteudo, tipo, peso, ordem) VALUES
(23, 'interpretacao_tabelas', 'Interpretação de Tabelas', 'Leitura e análise de dados tabulares, frequência, distribuição de dados.', 'interpretacao_dados', 2, 1),
(23, 'tipos_graficos', 'Tipos de Gráficos', 'Gráfico de barras, linhas, setores, histogramas. Construção e interpretação.', 'interpretacao_dados', 3, 2),
(23, 'analise_tendencias', 'Análise de Tendências', 'Crescimento, decrescimento, máximos, mínimos, correlação entre variáveis.', 'aplicacao_pratica', 3, 3);

-- =====================================================
-- SEÇÃO 11: Sistemas de Medidas (ID: 24)
-- =====================================================
INSERT INTO content_subsections (section_id, id, titulo, conteudo, tipo, peso, ordem) VALUES
(24, 'unidades_fundamentais', 'Unidades Fundamentais', 'Metro, quilograma, segundo. Sistema Internacional de Unidades (SI).', 'conceito_base', 2, 1),
(24, 'conversoes_medidas', 'Conversões de Medidas', 'Comprimento, massa, tempo, área, volume, capacidade. Múltiplos e submúltiplos.', 'metodo_calculo', 3, 2),
(24, 'medidas_nao_decimais', 'Medidas Não Decimais', 'Tempo (horas, minutos, segundos), ângulos (graus, minutos, segundos).', 'aplicacao_pratica', 2, 3);

-- =====================================================
-- SEÇÃO 12: Geometria (ID: 25)
-- =====================================================
INSERT INTO content_subsections (section_id, id, titulo, conteudo, tipo, peso, ordem) VALUES
(25, 'figuras_planas', 'Figuras Planas', 'Triângulos, quadriláteros, círculos. Propriedades e classificações.', 'conceito_base', 2, 1),
(25, 'perimetro_area', 'Perímetro e Área', 'Fórmulas de perímetro e área das principais figuras planas. Unidades de medida.', 'metodo_calculo', 3, 2),
(25, 'figuras_espaciais', 'Figuras Espaciais', 'Prismas, cilindros, pirâmides, cones, esferas. Cálculo de volume e área superficial.', 'metodo_calculo', 3, 3),
(25, 'angulos_pitagoras', 'Ângulos e Teorema de Pitágoras', 'Tipos de ângulos, medidas angulares, triângulo retângulo, aplicações do teorema de Pitágoras.', 'conceito_base', 3, 4);

-- =====================================================
-- SEÇÃO 13: Situações-Problema (ID: 26)
-- =====================================================
INSERT INTO content_subsections (section_id, id, titulo, conteudo, tipo, peso, ordem) VALUES
(26, 'interpretacao_enunciados', 'Interpretação de Enunciados', 'Identificação de dados, incógnitas, relações entre grandezas. Tradução de linguagem natural para linguagem matemática.', 'metodo_resolucao', 3, 1),
(26, 'estrategias_resolucao', 'Estratégias de Resolução', 'Tentativa e erro, trabalho regressivo, uso de diagramas, resolução por partes.', 'metodo_resolucao', 3, 2),
(26, 'verificacao_interpretacao', 'Verificação e Interpretação', 'Análise da coerência dos resultados, verificação por substituição, interpretação no contexto do problema.', 'metodo_resolucao', 3, 3),
(26, 'problemas_cotidiano', 'Problemas do Cotidiano', 'Situações envolvendo compras, medidas, tempo, dinheiro, planejamento, otimização de recursos.', 'aplicacao_pratica', 3, 4);

-- =====================================================
-- VERIFICAÇÃO DOS DADOS INSERIDOS
-- =====================================================
SELECT 
  s.name as materia,
  sec.name as secao, 
  sub.titulo as topico,
  sub.tipo,
  sub.peso,
  sub.ordem
FROM subjects s
JOIN sections sec ON s.id = sec.subject_id  
JOIN content_subsections sub ON sec.id = sub.section_id
WHERE s.id = 2
ORDER BY sec.order_index, sub.ordem;

-- Estatísticas finais
SELECT 
  s.name as materia,
  COUNT(sec.id) as total_secoes,
  COUNT(sub.id) as total_subsecoes,
  AVG(sub.peso) as peso_medio
FROM subjects s
JOIN sections sec ON s.id = sec.subject_id  
JOIN content_subsections sub ON sec.id = sub.section_id
WHERE s.id = 2
GROUP BY s.id, s.name;