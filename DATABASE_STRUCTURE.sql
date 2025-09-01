-- =====================================================
-- CRAM - ESTRUTURA COMPLETA DO BANCO DE DADOS
-- =====================================================
-- 
-- Este arquivo contém todas as queries necessárias para
-- criar a estrutura completa do banco de dados no Supabase.
--
-- INSTRUÇÕES DE USO:
-- 1. Execute as queries na ordem apresentada
-- 2. Use o SQL Editor do Supabase
-- 3. Execute uma seção por vez para evitar erros
--
-- Data de criação: Janeiro 2025
-- Versão: 1.0
-- =====================================================

-- =====================================================
-- SEÇÃO 1: CRIAÇÃO DAS TABELAS PRINCIPAIS
-- =====================================================

-- 1. PERFIL DO JOGADOR (users são nativos do Supabase Auth)
CREATE TABLE user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    avatar_class TEXT CHECK (avatar_class IN ('estudante', 'advogado', 'juiz', 'promotor', 'delegado', 'procurador')) DEFAULT 'estudante',
    avatar_gender TEXT CHECK (avatar_gender IN ('masculino', 'feminino')) NOT NULL,
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    gold INTEGER DEFAULT 100,
    current_streak INTEGER DEFAULT 0,
    max_streak INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 0,
    total_correct INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. LOJA DE ITEMS (dados estáticos)
CREATE TABLE shop_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT CHECK (category IN ('weapon', 'armor', 'accessory', 'pet')) NOT NULL,
    price INTEGER NOT NULL,
    bonus_type TEXT CHECK (bonus_type IN ('xp_boost', 'gold_boost', 'hint_chance', 'critical_chance')),
    bonus_value NUMERIC,
    bonus_condition TEXT, -- 'crimes_justice', 'nighttime', 'always', etc
    sprite_url TEXT,
    min_level INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. INVENTÁRIO DO JOGADOR
CREATE TABLE user_inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    item_id TEXT REFERENCES shop_items(id),
    equipped BOOLEAN DEFAULT FALSE,
    purchased_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, item_id)
);

-- 4. MATÉRIAS E SEÇÕES
CREATE TABLE subjects (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    color_code TEXT, -- hex color for UI
    icon TEXT, -- icon identifier
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sections (
    id INTEGER PRIMARY KEY,
    subject_id INTEGER REFERENCES subjects(id),
    name TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    content_file TEXT, -- caminho do arquivo JSON estruturado
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 5. QUESTÕES GERADAS
CREATE TABLE questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subject_id INTEGER REFERENCES subjects(id),
    section_id INTEGER REFERENCES sections(id),
    question_text TEXT NOT NULL,
    correct_answer BOOLEAN NOT NULL,
    explanation TEXT,
    difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5) DEFAULT 3,
    source_text TEXT,
    modified_parts TEXT[],
    created_by_ai TEXT DEFAULT 'deepseek',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 6. RESPOSTAS DO USUÁRIO
CREATE TABLE user_answers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id),
    user_answer BOOLEAN NOT NULL,
    is_correct BOOLEAN NOT NULL,
    time_spent INTEGER DEFAULT 0, -- segundos
    attempt_number INTEGER DEFAULT 1,
    answered_at TIMESTAMP DEFAULT NOW()
);

-- 7. ESTATÍSTICAS POR SEÇÃO
CREATE TABLE user_section_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subject_id INTEGER REFERENCES subjects(id),
    section_id INTEGER REFERENCES sections(id),
    questions_answered INTEGER DEFAULT 0,
    questions_correct INTEGER DEFAULT 0,
    total_time INTEGER DEFAULT 0, -- segundos
    last_studied TIMESTAMP DEFAULT NOW(),
    mastery_level NUMERIC DEFAULT 0.0 CHECK (mastery_level BETWEEN 0 AND 1),
    UNIQUE(user_id, subject_id, section_id)
);

-- 8. CONQUISTAS/ACHIEVEMENTS
CREATE TABLE user_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    unlocked_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- 9. SESSÕES DE ESTUDO
CREATE TABLE study_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subject_id INTEGER REFERENCES subjects(id),
    section_id INTEGER REFERENCES sections(id),
    questions_count INTEGER NOT NULL,
    correct_count INTEGER NOT NULL,
    xp_gained INTEGER DEFAULT 0,
    gold_gained INTEGER DEFAULT 0,
    duration INTEGER DEFAULT 0, -- segundos
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- =====================================================
-- SEÇÃO 2: TRIGGERS E FUNÇÕES
-- =====================================================

-- TRIGGERS PARA ATUALIZAR updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SEÇÃO 3: ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- HABILITAR RLS NAS TABELAS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_section_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS PARA user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- POLÍTICAS PARA user_inventory
CREATE POLICY "Users can view own inventory" ON user_inventory
    FOR ALL USING (auth.uid() = user_id);

-- POLÍTICAS PARA user_answers
CREATE POLICY "Users can manage own answers" ON user_answers
    FOR ALL USING (auth.uid() = user_id);

-- POLÍTICAS PARA user_section_stats
CREATE POLICY "Users can manage own stats" ON user_section_stats
    FOR ALL USING (auth.uid() = user_id);

-- POLÍTICAS PARA user_achievements
CREATE POLICY "Users can view own achievements" ON user_achievements
    FOR ALL USING (auth.uid() = user_id);

-- POLÍTICAS PARA study_sessions
CREATE POLICY "Users can manage own sessions" ON study_sessions
    FOR ALL USING (auth.uid() = user_id);

-- TABELAS PÚBLICAS (questions e shop_items)
CREATE POLICY "Questions are viewable by everyone" ON questions
    FOR SELECT USING (true);

CREATE POLICY "Shop items are viewable by everyone" ON shop_items
    FOR SELECT USING (true);

-- =====================================================
-- SEÇÃO 4: ÍNDICES PARA PERFORMANCE
-- =====================================================

-- ÍNDICES PARA OTIMIZAÇÃO DE CONSULTAS
CREATE INDEX idx_user_answers_user_id ON user_answers(user_id);
CREATE INDEX idx_user_answers_question_id ON user_answers(question_id);
CREATE INDEX idx_questions_subject_id ON questions(subject_id);
CREATE INDEX idx_questions_section_id ON questions(section_id);
CREATE INDEX idx_sections_subject_id ON sections(subject_id);
CREATE INDEX idx_user_section_stats_user_id ON user_section_stats(user_id);
CREATE INDEX idx_user_section_stats_subject_section ON user_section_stats(subject_id, section_id);
CREATE INDEX idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX idx_study_sessions_subject_section ON study_sessions(subject_id, section_id);
CREATE INDEX idx_user_inventory_user_id ON user_inventory(user_id);

-- =====================================================
-- SEÇÃO 5: DADOS INICIAIS - MATÉRIAS E SEÇÕES
-- =====================================================

-- INSERÇÃO DAS MATÉRIAS DISPONÍVEIS
INSERT INTO subjects (id, name, description, color_code, icon, is_active) VALUES
(1, 'Direito Penal', 'Crimes e suas punições', '#EF4444', 'gavel', true),
(2, 'Processo Penal', 'Procedimentos criminais', '#3B82F6', 'court', false),
(3, 'Direito Civil', 'Relações entre particulares', '#10B981', 'handshake', false),
(4, 'Processo Civil', 'Procedimentos cíveis', '#F59E0B', 'document', false),
(5, 'Direito Constitucional', 'Fundamentos do Estado', '#8B5CF6', 'flag', false),
(6, 'Direito Administrativo', 'Administração Pública', '#EC4899', 'building', false);

-- INSERÇÃO DAS SEÇÕES DO DIREITO PENAL (IMPLEMENTAÇÃO INICIAL)
INSERT INTO sections (id, subject_id, name, description, order_index, content_file, is_active) VALUES
(1, 1, 'Falsificação de Papéis Públicos - Conceitos', 'Art. 293 - Conceitos básicos', 1, 'direito_penal_secao_1.json', true),
(2, 1, 'Falsificação de Papéis Públicos - Condutas', 'Art. 293 §1º-§5º - Condutas equiparadas', 2, 'direito_penal_secao_2.json', true),
(3, 1, 'Petrechos e Funcionário Público', 'Art. 294-295 - Petrechos e agravantes', 3, 'direito_penal_secao_3.json', true),
(4, 1, 'Falsificação de Selos Públicos', 'Art. 296 - Selos e sinais oficiais', 4, 'direito_penal_secao_4.json', true),
(5, 1, 'Falsificação de Documento Público', 'Art. 297 - Documentos oficiais', 5, 'direito_penal_secao_5.json', true),
(6, 1, 'Falsificação de Documento Particular', 'Art. 298-299 - Documentos privados', 6, 'direito_penal_secao_6.json', true),
(7, 1, 'Outros Crimes Documentais', 'Art. 300-308 - Crimes específicos', 7, 'direito_penal_secao_7.json', true),
(8, 1, 'Fraudes em Certames Públicos', 'Art. 311-A - Concursos e exames', 8, 'direito_penal_secao_8.json', true),
(9, 1, 'Peculato e Crimes Patrimoniais', 'Art. 312-315 - Crimes contra patrimônio', 9, 'direito_penal_secao_9.json', true),
(10, 1, 'Corrupção e Concussão', 'Art. 316-317, 333 - Crimes de corrupção', 10, 'direito_penal_secao_10.json', true),
(11, 1, 'Outros Crimes Funcionais', 'Art. 319-327 - Demais crimes funcionais', 11, 'direito_penal_secao_11.json', true),
(12, 1, 'Crimes contra Administração da Justiça', 'Art. 339-359 - Crimes processuais', 12, 'direito_penal_secao_12.json', true);

-- =====================================================
-- SEÇÃO 6: DADOS INICIAIS - SHOP ITEMS
-- =====================================================

-- INSERÇÃO DOS ITEMS DA LOJA
INSERT INTO shop_items (id, name, description, category, price, bonus_type, bonus_value, bonus_condition, min_level) VALUES

-- ARMAS
('sword_justice', 'Espada da Justiça', '+10% XP em Crimes contra Justiça', 'weapon', 500, 'xp_boost', 0.10, 'crimes_justice', 5),
('judge_hammer', 'Martelo do Juiz', '+15% XP quando acerta na primeira', 'weapon', 800, 'xp_boost', 0.15, 'first_attempt', 10),
('enchanted_codes', 'Códigos Encantados', '+5% chance de dica', 'weapon', 1200, 'hint_chance', 0.05, 'always', 15),
('golden_scale', 'Balança Dourada', '+20% gold por acerto', 'weapon', 2000, 'gold_boost', 0.20, 'always', 20),

-- ARMADURAS
('golden_robe', 'Toga Dourada', '+20% gold, -10% XP', 'armor', 1000, 'gold_boost', 0.20, 'always', 8),
('knowledge_armor', 'Armadura do Conhecimento', '+15% XP geral', 'armor', 1500, 'xp_boost', 0.15, 'always', 12),
('wisdom_cape', 'Capa da Sabedoria', '+10% XP + 5% dicas', 'armor', 2500, 'xp_boost', 0.10, 'always', 25),
('magistrate_robes', 'Vestes do Magistrado', '+25% XP em crimes funcionais', 'armor', 3000, 'xp_boost', 0.25, 'crimes_funcionais', 30),

-- ACESSÓRIOS
('perception_glasses', 'Óculos da Percepção', '+5% chance de dica', 'accessory', 300, 'hint_chance', 0.05, 'always', 3),
('memory_ring', 'Anel da Memória', '+10% XP em revisões', 'accessory', 600, 'xp_boost', 0.10, 'review_mode', 7),
('luck_amulet', 'Amuleto da Sorte', '+3% chance crítico (dobro XP)', 'accessory', 1800, 'critical_chance', 0.03, 'always', 18),
('punctuality_watch', 'Relógio da Pontualidade', '+50% XP login diário', 'accessory', 2200, 'xp_boost', 0.50, 'daily_login', 22),

-- PETS
('wisdom_owl', 'Coruja da Sabedoria', '+15% XP noturno (22h-6h)', 'pet', 1000, 'xp_boost', 0.15, 'nighttime', 10),
('code_dragon', 'Dragão dos Códigos', '+20% XP questões difíceis', 'pet', 2000, 'xp_boost', 0.20, 'hard_questions', 20),
('perseverance_phoenix', 'Fênix da Perseverança', '+25% XP após erro', 'pet', 3500, 'xp_boost', 0.25, 'after_error', 35),
('library_cat', 'Gato da Biblioteca', '+10% XP geral sempre ativo', 'pet', 5000, 'xp_boost', 0.10, 'always', 50);

-- =====================================================
-- SEÇÃO 7: VERIFICAÇÃO E VALIDAÇÃO
-- =====================================================

-- QUERIES PARA VERIFICAR SE TUDO FOI CRIADO CORRETAMENTE
/*
-- Verificar tabelas criadas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Verificar dados inseridos
SELECT 'subjects' as table_name, count(*) as records FROM subjects
UNION ALL
SELECT 'sections' as table_name, count(*) as records FROM sections  
UNION ALL
SELECT 'shop_items' as table_name, count(*) as records FROM shop_items;

-- Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Verificar índices
SELECT indexname, tablename, indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;
*/

-- =====================================================
-- FIM DA ESTRUTURA DO BANCO DE DADOS
-- =====================================================

-- RESUMO DO QUE FOI CRIADO:
-- ✅ 9 tabelas principais
-- ✅ 1 função personalizada (update_updated_at)
-- ✅ 1 trigger para timestamps automáticos
-- ✅ 8 políticas RLS para segurança
-- ✅ 10 índices para performance
-- ✅ 6 matérias pré-cadastradas
-- ✅ 12 seções do Direito Penal
-- ✅ 16 items na loja (4 de cada categoria)
--
-- PRÓXIMO PASSO:
-- Execute essas queries no SQL Editor do Supabase
-- na ordem apresentada para criar toda a estrutura.
--
-- Data: Janeiro 2025
-- Versão: 1.0 - Estrutura Completa