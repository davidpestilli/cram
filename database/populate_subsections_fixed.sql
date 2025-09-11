-- =====================================================
-- SCRIPT PARA POPULAR SUBSEÇÕES - VERSÃO COM TIPOS PRECISOS
-- =====================================================
-- 
-- Este script popula as tabelas content_subsections e 
-- subsection_question_stats com os dados do JSON estruturado
--
-- Execute APÓS expand_valid_tipo_constraint.sql
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
('modalidades', 1, 'Modalidades de Conduta', 'fabricação (criar do nada) e alteração (modificar existente)', 'conceito_base', 2, 9)
ON CONFLICT (id, section_id) DO NOTHING;

-- 2. POPULAR SUBSEÇÕES DA SEÇÃO 2 (Art. 293, §1º ao §5º)
INSERT INTO content_subsections (id, section_id, titulo, conteudo, tipo, peso, ordem) VALUES
('paragrafo_1_uso', 2, 'Uso de Papéis Falsificados', 'usa, guarda, possui ou detém qualquer dos papéis falsificados', 'conduta_equiparada', 2, 1),
('paragrafo_1_circulacao', 2, 'Circulação de Selos Falsificados', 'importa, exporta, adquire, vende, troca, cede, empresta, guarda, fornece ou restitui à circulação selo falsificado destinado a controle tributário', 'conduta_equiparada', 2, 2),
('paragrafo_1_produtos', 2, 'Produtos com Selos Falsificados', 'importa, exporta, adquire, vende, expõe à venda, mantém em depósito, guarda, troca, cede, empresta, fornece, porta ou utiliza produto com selo falsificado ou sem selo obrigatório', 'conduta_equiparada', 2, 3),
('paragrafo_2_supressao', 2, 'Supressão de Sinais de Inutilização', 'suprimir carimbo ou sinal indicativo de inutilização para tornar papéis novamente utilizáveis', 'conduta_especifica', 1, 4),
('paragrafo_3_uso_alterado', 2, 'Uso de Papel Alterado', 'usar papel alterado conforme §2º', 'conduta_especifica', 1, 5),
('paragrafo_4_boa_fe', 2, 'Uso Após Conhecimento da Falsidade', 'usar ou restituir à circulação papel falsificado, mesmo recebido de boa-fé, após conhecer a falsidade', 'conduta_especifica', 1, 6),
('penas_equiparadas', 2, 'Penalidades das Condutas Equiparadas', '§1º: mesma pena do caput | §2º e §3º: reclusão, de um a quatro anos, e multa | §4º: detenção, de seis meses a dois anos, ou multa', 'consequencia', 1, 7)
ON CONFLICT (id, section_id) DO NOTHING;

-- 3. POPULAR SUBSEÇÕES DA SEÇÃO 3 (Art. 294-295)
INSERT INTO content_subsections (id, section_id, titulo, conteudo, tipo, peso, ordem) VALUES
('petrechos_conduta', 3, 'Conduta com Petrechos', 'fabricar, adquirir, fornecer, possuir ou guardar objeto especialmente destinado à falsificação', 'crime_preparatorio', 2, 1),
('petrechos_pena', 3, 'Pena por Petrechos', 'reclusão, de um a três anos, e multa', 'consequencia', 1, 2),
('petrechos_natureza', 3, 'Natureza do Crime de Petrechos', 'crime de perigo abstrato - pune preparação para falsificação', 'conceito_base', 1, 3),
('funcionario_agravante', 3, 'Agravante para Funcionário Público', 'funcionário público que comete qualquer crime do capítulo prevalecendo-se do cargo - aumenta-se a pena de sexta parte', 'agravante', 2, 4)
ON CONFLICT (id, section_id) DO NOTHING;

-- 4. POPULAR SUBSEÇÕES DA SEÇÃO 4 (Art. 296)
INSERT INTO content_subsections (id, section_id, titulo, conteudo, tipo, peso, ordem) VALUES
('selos_tipificacao', 4, 'Tipificação - Selos Públicos', 'falsificar, fabricando-os ou alterando-os', 'conceito_base', 2, 1),
('selos_oficiais', 4, 'Selos Oficiais de Entes Públicos', 'selo público destinado a autenticar atos oficiais da União, de Estado ou de Município', 'objeto_crime', 1, 2),
('selos_entidades', 4, 'Selos de Entidades e Autoridades', 'selo ou sinal atribuído por lei a entidade de direito público, ou a autoridade, ou sinal público de tabelião', 'objeto_crime', 1, 3),
('selos_pena_basica', 4, 'Pena Básica para Selos', 'reclusão, de dois a seis anos, e multa', 'consequencia', 1, 4),
('selos_uso_falsificado', 4, 'Uso de Selo Falsificado', 'fazer uso do selo ou sinal falsificado', 'conduta_equiparada', 1, 5),
('selos_uso_verdadeiro_indevido', 4, 'Uso Indevido de Selo Verdadeiro', 'fazer uso, sem autorização, do selo ou sinal verdadeiro em prejuízo de outrem ou em proveito próprio ou alheio', 'conduta_equiparada', 1, 6)
ON CONFLICT (id, section_id) DO NOTHING;

-- 5. POPULAR SUBSEÇÕES DA SEÇÃO 5 (Art. 297)
INSERT INTO content_subsections (id, section_id, titulo, conteudo, tipo, peso, ordem) VALUES
('doc_publico_tipificacao', 5, 'Tipificação - Documento Público', 'falsificar, no todo ou em parte, documento público, ou alterar documento público verdadeiro', 'conceito_base', 2, 1),
('doc_publico_pena', 5, 'Pena Básica - Documento Público', 'reclusão, de dois a seis anos, e multa', 'consequencia', 1, 2),
('doc_publico_agravante', 5, 'Agravante Funcionário Público', 'funcionário público prevalecendo-se do cargo - aumenta-se a pena de sexta parte', 'agravante', 2, 3),
('doc_equiparado_paraestatal', 5, 'Documento de Entidade Paraestatal', 'documento emanado de entidade paraestatal', 'objeto_equiparado', 1, 4),
('doc_equiparado_titulo', 5, 'Título ao Portador', 'título ao portador ou transmissível por endosso', 'objeto_equiparado', 1, 5),
('doc_equiparado_acoes', 5, 'Ações de Sociedade Comercial', 'ações de sociedade comercial, livros mercantis e testamento particular', 'objeto_equiparado', 1, 6),
('doc_previdenciario_inserir', 5, 'Falsidade Previdenciária - Inserção', 'inserir pessoa não segurada na folha de pagamento ou declaração falsa em CTPS/documento previdenciário', 'conduta_especifica', 2, 7),
('doc_previdenciario_omitir', 5, 'Falsidade Previdenciária - Omissão', 'omitir dados do segurado em documentos previdenciários', 'conduta_especifica', 1, 8)
ON CONFLICT (id, section_id) DO NOTHING;

-- 6. POPULAR SUBSEÇÕES DA SEÇÃO 6 (Art. 298-299)
INSERT INTO content_subsections (id, section_id, titulo, conteudo, tipo, peso, ordem) VALUES
('doc_particular_tipificacao', 6, 'Tipificação - Documento Particular', 'falsificar, no todo ou em parte, documento particular ou alterar documento particular verdadeiro', 'conceito_base', 2, 1),
('doc_particular_pena', 6, 'Pena Documento Particular', 'reclusão, de um a cinco anos, e multa', 'consequencia', 1, 2),
('cartao_equiparacao', 6, 'Equiparação de Cartões', 'cartão de crédito ou débito equipara-se a documento particular', 'objeto_equiparado', 1, 3),
('falsidade_ideologica_condutas', 6, 'Falsidade Ideológica - Condutas', 'omitir declaração que devia constar ou inserir declaração falsa ou diversa', 'conceito_base', 2, 4),
('falsidade_ideologica_finalidade', 6, 'Finalidade da Falsidade Ideológica', 'prejudicar direito, criar obrigação ou alterar verdade sobre fato juridicamente relevante', 'elemento_subjetivo', 2, 5),
('falsidade_penas_diferenciadas', 6, 'Penas da Falsidade Ideológica', 'documento público: reclusão de 1-5 anos e multa | documento particular: reclusão de 1-3 anos e multa', 'consequencia', 1, 6),
('falsidade_agravantes', 6, 'Agravantes Falsidade Ideológica', 'funcionário público prevalecendo-se do cargo ou falsificação de registro civil - aumenta 1/6', 'agravante', 1, 7)
ON CONFLICT (id, section_id) DO NOTHING;

-- 7. POPULAR SUBSEÇÕES DA SEÇÃO 7 (Art. 300-308)
INSERT INTO content_subsections (id, section_id, titulo, conteudo, tipo, peso, ordem) VALUES
('falso_reconhecimento_condutas', 7, 'Falso Reconhecimento de Firma', 'reconhecer como verdadeira firma ou letra que não seja', 'crime_especifico', 2, 1),
('falso_reconhecimento_penas', 7, 'Penas do Falso Reconhecimento', 'documento público: reclusão 1-5 anos e multa | documento particular: reclusão 1-3 anos e multa', 'consequencia', 1, 2),
('certidao_falsa_condutas', 7, 'Certidão ou Atestado Falso', 'atestar ou certificar falsamente fato que habilite a cargo público ou vantagem', 'crime_especifico', 1, 3),
('certidao_falsa_penas', 7, 'Penas Certidão Falsa', 'atestar: detenção 2 meses-1 ano | falsificar: detenção 3 meses-2 anos | com lucro: + multa', 'consequencia', 1, 4),
('atestado_medico_falso', 7, 'Atestado Médico Falso', 'médico dar atestado falso no exercício da profissão', 'crime_especifico', 2, 5),
('atestado_medico_pena', 7, 'Pena Atestado Médico Falso', 'detenção, de um mês a um ano | com fim de lucro: + multa', 'consequencia', 1, 6),
('uso_documento_falso', 7, 'Uso de Documento Falso', 'usar documento falsificado - mesma pena da falsificação', 'conduta_equiparada', 2, 7),
('supressao_documento', 7, 'Supressão de Documento', 'destruir, suprimir ou ocultar documento de que não podia dispor', 'crime_especifico', 1, 8),
('supressao_penas', 7, 'Penas Supressão Documento', 'documento público: reclusão 2-6 anos e multa | documento particular: reclusão 1-5 anos e multa', 'consequencia', 1, 9)
ON CONFLICT (id, section_id) DO NOTHING;

-- 8. POPULAR SUBSEÇÕES DA SEÇÃO 8 (Art. 311-A)
INSERT INTO content_subsections (id, section_id, titulo, conteudo, tipo, peso, ordem) VALUES
('certame_tipificacao', 8, 'Tipificação Fraude em Certames', 'utilizar ou divulgar indevidamente conteúdo sigiloso para beneficiar-se ou comprometer credibilidade', 'conceito_base', 2, 1),
('certame_objetos', 8, 'Objetos Protegidos', 'concurso público, avaliação/exame público, processo seletivo ensino superior, exame previsto em lei', 'objeto_crime', 1, 2),
('certame_pena_basica', 8, 'Pena Básica Certames', 'reclusão, de 1 a 4 anos, e multa', 'consequencia', 1, 3),
('certame_facilitacao', 8, 'Facilitação de Acesso', 'permitir ou facilitar acesso não autorizado - mesmas penas', 'conduta_equiparada', 1, 4),
('certame_dano_administracao', 8, 'Dano à Administração', 'se resulta dano à administração pública - reclusão de 2 a 6 anos e multa', 'agravante', 2, 5),
('certame_funcionario_publico', 8, 'Funcionário Público em Certames', 'funcionário público - aumenta-se a pena de 1/3', 'agravante', 1, 6)
ON CONFLICT (id, section_id) DO NOTHING;

-- 9. POPULAR SUBSEÇÕES DA SEÇÃO 9 (Art. 312-315)
INSERT INTO content_subsections (id, section_id, titulo, conteudo, tipo, peso, ordem) VALUES
('peculato_condutas', 9, 'Condutas do Peculato', 'apropriar-se de bem público/particular em razão do cargo ou desviar bem em proveito próprio ou alheio', 'conceito_base', 2, 1),
('peculato_pena', 9, 'Pena do Peculato', 'reclusão, de dois a doze anos, e multa', 'consequencia', 1, 2),
('peculato_furto', 9, 'Peculato-Furto', 'funcionário sem posse que subtrai valendo-se da facilidade da função', 'modalidade_especifica', 2, 3),
('peculato_culposo', 9, 'Peculato Culposo', 'concorrer culposamente para crime de outrem - detenção de 3 meses a 1 ano', 'modalidade_culposa', 1, 4),
('peculato_reparacao', 9, 'Reparação do Dano', 'reparação antes da sentença extingue punibilidade no peculato culposo', 'extincao_punibilidade', 2, 5),
('apropriacao_erro', 9, 'Apropriação por Erro', 'apropriar-se de dinheiro recebido por erro de outrem no exercício do cargo', 'crime_especifico', 1, 6),
('dados_falsos_sistema', 9, 'Inserção de Dados Falsos', 'inserir dados falsos em sistema informatizado da Administração', 'crime_informatico', 2, 7),
('alteracao_sistema', 9, 'Alteração de Sistema', 'modificar sistema de informações sem autorização', 'crime_informatico', 1, 8),
('extravio_documento', 9, 'Extravio de Documento', 'extraviar, sonegar ou inutilizar livro ou documento oficial', 'crime_especifico', 1, 9),
('emprego_irregular_verbas', 9, 'Emprego Irregular de Verbas', 'dar aplicação diversa da legal a verbas públicas', 'crime_especifico', 1, 10)
ON CONFLICT (id, section_id) DO NOTHING;

-- 10. POPULAR SUBSEÇÕES DA SEÇÃO 10 (Art. 316-317, 333)
INSERT INTO content_subsections (id, section_id, titulo, conteudo, tipo, peso, ordem) VALUES
('concussao_conduta', 10, 'Conduta da Concussão', 'exigir vantagem indevida em razão da função', 'conceito_base', 2, 1),
('concussao_pena', 10, 'Pena da Concussão', 'reclusão, de 2 a 12 anos, e multa', 'consequencia', 1, 2),
('excesso_exacao', 10, 'Excesso de Exação', 'exigir tributo indevido ou usar meio vexatório - reclusão de 3 a 8 anos e multa', 'modalidade_especifica', 2, 3),
('corrupcao_passiva_condutas', 10, 'Corrupção Passiva - Condutas', 'solicitar, receber ou aceitar promessa de vantagem indevida', 'conceito_base', 2, 4),
('corrupcao_passiva_pena', 10, 'Pena Corrupção Passiva', 'reclusão, de 2 a 12 anos, e multa', 'consequencia', 1, 5),
('corrupcao_passiva_agravante', 10, 'Agravante Corrupção Passiva', 'aumenta 1/3 se retarda, omite ou pratica ato infringindo dever', 'agravante', 1, 6),
('corrupcao_passiva_privilegiada', 10, 'Corrupção Passiva Privilegiada', 'ceder a pedido ou influência sem vantagem - detenção de 3 meses a 1 ano ou multa', 'modalidade_privilegiada', 1, 7),
('corrupcao_ativa_conduta', 10, 'Corrupção Ativa - Conduta', 'oferecer ou prometer vantagem a funcionário público', 'conceito_base', 2, 8),
('corrupcao_ativa_pena', 10, 'Pena Corrupção Ativa', 'reclusão, de 2 a 12 anos, e multa', 'consequencia', 1, 9),
('diferencas_conceituais', 10, 'Diferenças entre Concussão e Corrupção', 'concussão: funcionário EXIGE (mais grave) | corrupção passiva: funcionário SOLICITA/RECEBE | corrupção ativa: particular OFERECE', 'conceito_diferencial', 2, 10)
ON CONFLICT (id, section_id) DO NOTHING;

-- 11. POPULAR SUBSEÇÕES DA SEÇÃO 11 (Art. 319-327)
INSERT INTO content_subsections (id, section_id, titulo, conteudo, tipo, peso, ordem) VALUES
('prevaricacao_condutas', 11, 'Condutas da Prevaricação', 'retardar, deixar de praticar ou praticar ato contra lei para satisfazer interesse pessoal', 'conceito_base', 2, 1),
('prevaricacao_pena', 11, 'Pena da Prevaricação', 'detenção, de três meses a um ano, e multa', 'consequencia', 1, 2),
('prevaricacao_elemento_subjetivo', 11, 'Elemento Subjetivo da Prevaricação', 'exige interesse ou sentimento pessoal do agente', 'elemento_subjetivo', 2, 3),
('condescendencia_criminosa', 11, 'Condescendência Criminosa', 'não responsabilizar subordinado que cometeu infração no exercício do cargo', 'crime_especifico', 1, 4),
('advocacia_administrativa', 11, 'Advocacia Administrativa', 'patrocinar interesse privado valendo-se da qualidade de funcionário', 'crime_especifico', 2, 5),
('advocacia_penas', 11, 'Penas Advocacia Administrativa', 'interesse legítimo: detenção 1-3 meses ou multa | interesse ilegítimo: detenção 3 meses-1 ano e multa', 'consequencia', 1, 6),
('violencia_arbitraria', 11, 'Violência Arbitrária', 'praticar violência no exercício ou pretexto da função', 'crime_especifico', 1, 7),
('abandono_funcao', 11, 'Abandono de Função', 'abandonar cargo fora dos casos legais', 'crime_especifico', 1, 8),
('abandono_penas_graduadas', 11, 'Penas Graduadas do Abandono', 'básica: detenção 15 dias-1 mês | com prejuízo: detenção 3 meses-1 ano | fronteira: detenção 1-3 anos', 'consequencia', 2, 9),
('violacao_sigilo', 11, 'Violação do Sigilo Funcional', 'revelar fato sigiloso ou facilitar revelação', 'crime_especifico', 2, 10),
('sigilo_penas', 11, 'Penas Violação Sigilo', 'básica: detenção 6 meses-2 anos ou multa | com dano: reclusão 2-6 anos e multa', 'consequencia', 1, 11),
('conceito_funcionario_publico', 11, 'Conceito de Funcionário Público', 'quem exerce cargo, emprego ou função pública, mesmo transitoriamente, incluindo entidade paraestatal', 'conceito_base', 2, 12)
ON CONFLICT (id, section_id) DO NOTHING;

-- 12. POPULAR SUBSEÇÕES DA SEÇÃO 12 (Art. 339-359)
INSERT INTO content_subsections (id, section_id, titulo, conteudo, tipo, peso, ordem) VALUES
('denunciacao_caluniosa_conduta', 12, 'Denunciação Caluniosa', 'imputar crime ou infração que sabe ser falsa', 'conceito_base', 2, 1),
('denunciacao_caluniosa_pena', 12, 'Pena Denunciação Caluniosa', 'reclusão, de dois a oito anos, e multa', 'consequencia', 1, 2),
('denunciacao_qualificadoras', 12, 'Qualificadoras Denunciação', 'anonimato: aumenta 1/6 | contravenção: diminui 1/2', 'modificadoras', 1, 3),
('falso_testemunho_condutas', 12, 'Falso Testemunho - Condutas', 'afirmar falsamente, negar a verdade ou calar a verdade', 'conceito_base', 2, 4),
('falso_testemunho_sujeitos', 12, 'Sujeitos do Falso Testemunho', 'testemunha, perito, contador, tradutor, intérprete', 'sujeito_ativo', 1, 5),
('falso_testemunho_pena', 12, 'Pena Falso Testemunho', 'reclusão, de 2 a 4 anos, e multa', 'consequencia', 1, 6),
('falso_testemunho_agravante', 12, 'Agravantes Falso Testemunho', 'suborno ou processo contra administração: aumenta 1/6 a 1/3', 'agravante', 1, 7),
('retratacao_falso_testemunho', 12, 'Retratação no Falso Testemunho', 'deixa de ser punível se retratar-se antes da sentença', 'extincao_punibilidade', 2, 8),
('corrupcao_testemunha', 12, 'Corrupção de Testemunha', 'dar, oferecer ou prometer vantagem para testemunha mentir', 'crime_especifico', 1, 9),
('coacao_processo', 12, 'Coação no Curso do Processo', 'usar violência contra pessoa que intervém em processo', 'crime_especifico', 1, 10),
('justica_proprias_maos', 12, 'Exercício Arbitrário das Próprias Razões', 'fazer justiça pelas próprias mãos para realizar ou assegurar pretensão', 'crime_especifico', 2, 11),
('fraude_processual', 12, 'Fraude Processual', 'inovar artificiosamente estado de coisa para induzir erro judicial', 'crime_especifico', 2, 12),
('fraude_processual_penas', 12, 'Penas Fraude Processual', 'processo civil: detenção 3 meses-2 anos e multa | processo penal: penas em dobro', 'consequencia', 1, 13)
ON CONFLICT (id, section_id) DO NOTHING;

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
-- Total: 12 seções completas abrangendo todo o Direito Penal
-- Tipos tecnicamente precisos para melhor granularidade:
-- - modalidade_especifica, modalidade_culposa, modalidade_privilegiada
-- - extincao_punibilidade, crime_informatico, elemento_subjetivo
-- - conceito_diferencial, sujeito_ativo, modificadoras, objeto_equiparado
-- =====================================================