-- =====================================================
-- SCRIPT PARA POPULAR SUBSEÇÕES
-- =====================================================
-- 
-- Este script popula as tabelas content_subsections e 
-- subsection_question_stats com os dados do JSON estruturado
--
-- Execute após a migração subsections_migration.sql
-- =====================================================

-- 1. POPULAR SUBSEÇÕES DA SEÇÃO 1 (Art. 293)
INSERT INTO content_subsections (id, section_id, titulo, conteudo, tipo, peso, ordem) VALUES
('tipificacao', 1, 'Tipificação do Crime', 'Falsificar, fabricando-os ou alterando-os', 'conceito_base', 2, 1),
('objeto_tributario', 1, 'Selos e Papéis Tributários', 'selo destinado a controle tributário, papel selado ou qualquer papel de emissão legal destinado à arrecadação de tributo', 'objeto_crime', 1, 2),
('objeto_credito', 1, 'Papel de Crédito Público', 'papel de crédito público que não seja moeda de curso legal', 'objeto_crime', 1, 3),
('objeto_vale_postal', 1, 'Vale Postal', 'vale postal', 'objeto_crime', 1, 4),
('objeto_cautela', 1, 'Cautelas e Cadernetas', 'cautela de penhor, caderneta de depósito de caixa econômica ou de outro estabelecimento mantido por entidade de direito público', 'objeto_crime', 1, 5),
('objeto_documentos_rendas', 1, 'Documentos de Rendas Públicas', 'talão, recibo, guia, alvará ou qualquer outro documento relativo a arrecadação de rendas públicas ou a depósito ou caução por que o poder público seja responsável', 'objeto_crime', 1, 6),
('objeto_transporte', 1, 'Documentos de Transporte Público', 'bilhete, passe ou conhecimento de empresa de transporte administrada pela União, por Estado ou por Município', 'objeto_crime', 1, 7),
('pena', 1, 'Penalidade', 'reclusão, de dois a oito anos, e multa', 'consequencia', 1, 8),
('modalidades', 1, 'Modalidades de Conduta', 'fabricação (criar do nada) e alteração (modificar existente)', 'conceito_base', 2, 9);

-- 2. POPULAR SUBSEÇÕES DA SEÇÃO 2 (Art. 293, §1º ao §5º)
INSERT INTO content_subsections (id, section_id, titulo, conteudo, tipo, peso, ordem) VALUES
('paragrafo_1_uso', 2, 'Uso de Papéis Falsificados', 'usa, guarda, possui ou detém qualquer dos papéis falsificados', 'conduta_equiparada', 2, 1),
('paragrafo_1_circulacao', 2, 'Circulação de Selos Falsificados', 'importa, exporta, adquire, vende, troca, cede, empresta, guarda, fornece ou restitui à circulação selo falsificado destinado a controle tributário', 'conduta_equiparada', 2, 2),
('paragrafo_1_produtos', 2, 'Produtos com Selos Falsificados', 'importa, exporta, adquire, vende, expõe à venda, mantém em depósito, guarda, troca, cede, empresta, fornece, porta ou utiliza produto com selo falsificado ou sem selo obrigatório', 'conduta_equiparada', 2, 3),
('paragrafo_2_supressao', 2, 'Supressão de Sinais de Inutilização', 'suprimir carimbo ou sinal indicativo de inutilização para tornar papéis novamente utilizáveis', 'conduta_especifica', 1, 4),
('paragrafo_3_uso_alterado', 2, 'Uso de Papel Alterado', 'usar papel alterado conforme §2º', 'conduta_especifica', 1, 5),
('paragrafo_4_boa_fe', 2, 'Uso Após Conhecimento da Falsidade', 'usar ou restituir à circulação papel falsificado, mesmo recebido de boa-fé, após conhecer a falsidade', 'conduta_especifica', 1, 6),
('penas_equiparadas', 2, 'Penalidades das Condutas Equiparadas', '§1º: mesma pena do caput | §2º e §3º: reclusão, de um a quatro anos, e multa | §4º: detenção, de seis meses a dois anos, ou multa', 'consequencia', 1, 7);

-- 3. POPULAR SUBSEÇÕES DA SEÇÃO 3 (Art. 294-295)
INSERT INTO content_subsections (id, section_id, titulo, conteudo, tipo, peso, ordem) VALUES
('petrechos_conduta', 3, 'Conduta com Petrechos', 'fabricar, adquirir, fornecer, possuir ou guardar objeto especialmente destinado à falsificação', 'crime_preparatorio', 2, 1),
('petrechos_pena', 3, 'Pena por Petrechos', 'reclusão, de um a três anos, e multa', 'consequencia', 1, 2),
('petrechos_natureza', 3, 'Natureza do Crime de Petrechos', 'crime de perigo abstrato - pune preparação para falsificação', 'conceito_base', 1, 3),
('funcionario_agravante', 3, 'Agravante para Funcionário Público', 'funcionário público que comete qualquer crime do capítulo prevalecendo-se do cargo - aumenta-se a pena de sexta parte', 'agravante', 2, 4);

-- 4. POPULAR SUBSEÇÕES DA SEÇÃO 4 (Art. 296)
INSERT INTO content_subsections (id, section_id, titulo, conteudo, tipo, peso, ordem) VALUES
('selos_tipificacao', 4, 'Tipificação - Selos Públicos', 'falsificar, fabricando-os ou alterando-os', 'conceito_base', 2, 1),
('selos_oficiais', 4, 'Selos Oficiais de Entes Públicos', 'selo público destinado a autenticar atos oficiais da União, de Estado ou de Município', 'objeto_crime', 1, 2),
('selos_entidades', 4, 'Selos de Entidades e Autoridades', 'selo ou sinal atribuído por lei a entidade de direito público, ou a autoridade, ou sinal público de tabelião', 'objeto_crime', 1, 3),
('selos_pena_basica', 4, 'Pena Básica para Selos', 'reclusão, de dois a seis anos, e multa', 'consequencia', 1, 4),
('selos_uso_falsificado', 4, 'Uso de Selo Falsificado', 'fazer uso do selo ou sinal falsificado', 'conduta_equiparada', 1, 5),
('selos_uso_verdadeiro_indevido', 4, 'Uso Indevido de Selo Verdadeiro', 'fazer uso, sem autorização, do selo ou sinal verdadeiro em prejuízo de outrem ou em proveito próprio ou alheio', 'conduta_equiparada', 1, 6);

-- 5. CALCULAR E DEFINIR TARGETS INICIAIS (10 questões por seção)
SELECT update_all_targets(10);

-- 6. VERIFICAR DADOS INSERIDOS
SELECT 
    section_id,
    COUNT(*) as total_subsections,
    SUM(peso) as total_weight,
    string_agg(DISTINCT tipo, ', ') as tipos_presentes
FROM content_subsections 
GROUP BY section_id 
ORDER BY section_id;

-- 7. VERIFICAR DISTRIBUIÇÃO DE TARGETS
SELECT 
    cs.section_id,
    cs.id as subsection_id,
    cs.titulo,
    cs.peso,
    stats.target_count,
    stats.question_count,
    (stats.target_count - stats.question_count) as deficit
FROM content_subsections cs
LEFT JOIN subsection_question_stats stats 
    ON cs.section_id = stats.section_id 
    AND cs.id = stats.subsection_id
ORDER BY cs.section_id, cs.ordem;

-- =====================================================
-- RESULTADO ESPERADO:
-- =====================================================
-- Seção 1: 9 subseções, peso total = 11
-- - tipificacao (peso 2) → target = 2 questões  
-- - modalidades (peso 2) → target = 2 questões
-- - objeto_vale_postal (peso 1) → target = 1 questão
-- - demais objetos (peso 1 cada) → target = 1 questão cada
-- - pena (peso 1) → target = 1 questão
--
-- Seção 2: 7 subseções, peso total = 10  
-- - condutas equiparadas do §1º (peso 2 cada) → target = 2 questões cada
-- - demais condutas (peso 1 cada) → target = 1 questão cada
--
-- Seção 3: 4 subseções, peso total = 6
-- - petrechos_conduta (peso 2) → target = 3 questões
-- - funcionario_agravante (peso 2) → target = 3 questões  
-- - demais (peso 1 cada) → target = 2 questões cada
--
-- Seção 4: 6 subseções, peso total = 8
-- - selos_tipificacao (peso 2) → target = 3 questões
-- - demais (peso 1 cada) → target = 1-2 questões cada
-- =====================================================