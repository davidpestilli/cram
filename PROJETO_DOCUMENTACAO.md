# CRAM - Aplicativo de Estudos Jurídicos RPG

## 📋 VISÃO GERAL

Aplicativo gamificado para estudos de **múltiplas matérias jurídicas** no estilo "cram", onde usuários respondem questões verdadeiro/falso geradas por IA, com sistema RPG completo de progressão, avatares e recompensas.

**Matérias disponíveis:**
- 🔴 **Direito Penal** (implementação inicial)
- 🔵 **Processo Penal** (roadmap)
- 🟢 **Direito Civil** (roadmap)
- 🟡 **Processo Civil** (roadmap)
- 🟠 **Direito Constitucional** (roadmap)
- 🟣 **Direito Administrativo** (roadmap)

## 🎯 CONCEITO PRINCIPAL

O usuário seleciona uma **matéria jurídica** e depois uma **seção específica** do conteúdo. A IA (DeepSeek) gera questões inteligentes no formato verdadeiro/falso. As questões podem ser:
- **Verdadeiras**: Baseadas no texto original
- **Falsas**: Com modificações sutis no texto original (destacadas em caso de erro)

**Fluxo de navegação:**
1. Usuário escolhe a matéria (ex: Direito Penal)
2. Usuário escolhe a seção dentro da matéria (ex: Falsificação de Documentos)
3. Sistema gera questões específicas daquele tópico

## 🏗️ ARQUITETURA TÉCNICA

### **Frontend**
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Animações**: Framer Motion + React Spring + Lottie React
- **Deploy**: GitHub Pages

### **Backend**
- **BaaS**: Supabase
- **Database**: PostgreSQL (via Supabase)
- **Auth**: Sistema nativo do Supabase
- **API Externa**: DeepSeek para geração de questões

### **Assets**
- **Arte**: Pixel Art (16x16, 32x32 sprites)
- **Fonte**: Kenney.nl + assets customizados
- **Paleta**: Tema jurídico (dourado, azul escuro, branco, vermelho)

## 📚 CONTEÚDO DE ESTUDO

### **Estrutura Hierárquica**
```
📖 MATÉRIAS
├── 🔴 Direito Penal
│   ├── Crimes contra Fé Pública (6 seções)
│   └── Crimes contra Administração Pública (6 seções)
├── 🔵 Processo Penal
│   ├── Inquérito Policial
│   ├── Ação Penal
│   └── Recursos
├── 🟢 Direito Civil
│   ├── Parte Geral
│   ├── Obrigações
│   └── Contratos
└── 🟡 Processo Civil
    ├── Procedimento Comum
    ├── Recursos
    └── Execução
```

### **Base de Dados Atual (MVP)**
- **Fonte**: direito_penal_estruturado.json
- **Matéria**: Direito Penal
- **Seções**: 12 tópicos temáticos
- **Cobertura**: Crimes contra Fé Pública e Administração Pública

### **Seções do Direito Penal (Implementação Inicial)**
1. Falsificação de Papéis Públicos - Conceitos Básicos
2. Falsificação de Papéis Públicos - Condutas Equiparadas
3. Petrechos de Falsificação e Funcionário Público
4. Falsificação de Selos e Sinais Públicos
5. Falsificação de Documento Público
6. Falsificação de Documento Particular e Cartão
7. Outros Crimes Documentais
8. Fraudes em Certames Públicos
9. Peculato e Crimes Patrimoniais
10. Corrupção e Concussão
11. Outros Crimes Funcionais
12. Crimes contra Administração da Justiça

## 🎮 SISTEMA DE GAMIFICAÇÃO

### **Avatar & Progressão**
- **Criação inicial**: Escolha de gênero (masculino/feminino)
- **Classes disponíveis**: 
  - **Estudante** (bonus XP geral +5%)
  - **Advogado** (bonus Direito Civil +15%)
  - **Juiz** (bonus Processo Civil +15%)
  - **Promotor** (bonus Direito Penal +15%)
  - **Delegado** (bonus Processo Penal +15%)
  - **Procurador** (bonus Direito Administrativo +15%)

### **Sistema XP & Gold**
```
💎 GANHOS DE XP:
- Questão correta: 10 XP base
- Primeira tentativa: +5 XP bonus
- Streak de 5 acertos: +25 XP
- Completar seção (100%): +100 XP
- Estudar dias consecutivos: +50 XP

🪙 GANHOS DE GOLD:
- Questão correta: 5-15 gold (baseado na dificuldade)
- Perfect score (10/10): 100 gold bonus
- Daily login: 25 gold
- Weekly streak: 200 gold
```

### **Shop System**
**CATEGORIAS DE ITEMS:**

**⚔️ Armas:**
- Espada da Justiça (+10% XP crimes contra justiça)
- Martelo do Juiz (+15% XP sentenças corretas)
- Códigos Encantados (+5% dica em questões)
- Balança Dourada (+20% gold por acerto)

**🛡️ Armaduras:**
- Toga Dourada (+20% gold, -10% XP)
- Armadura do Conhecimento (+15% XP geral)
- Capa da Sabedoria (+10% XP, +5% dicas)
- Vestes do Magistrado (+25% XP crimes funcionais)

**💍 Acessórios:**
- Óculos da Percepção (+5% chance de dica)
- Anel da Memória (+10% XP revisões)
- Amuleto da Sorte (+3% chance crítico = dobro XP)
- Relógio da Pontualidade (+50% XP login diário)

**🐾 Pets:**
- Coruja da Sabedoria (+15% XP noturno 22h-6h)
- Dragão dos Códigos (+20% XP questões difíceis)
- Fênix da Perseverança (+25% XP após erro)
- Gato da Biblioteca (+10% XP geral, sempre ativo)

### **Achievements & Titles**
- **"Mestre do Peculato"**: 100% acerto na seção Peculato
- **"Incansável"**: 7 dias consecutivos estudando
- **"Milionário"**: 10.000 gold acumulado
- **"Perfeccionista"**: 10 perfect scores seguidos
- **"Especialista"**: Completar todas as 12 seções
- **"Lenda Viva"**: Atingir level 50

## 🎯 FUNCIONALIDADES PRINCIPAIS

### **Sistema de Questões Compartilhadas**
- **Pool Global**: Questões geradas ficam disponíveis para todos os usuários
- **Opções do Usuário**: 
  - **Questões Já Respondidas**: Revisar questões que já respondeu anteriormente
  - **Questões Novas (Existentes)**: Questões criadas por outros usuários que ainda não respondeu
  - **Gerar Novas Questões**: Criar questões inéditas via DeepSeek API
- **Personalização**: Definir quantas questões responder (1-10)
- **Tipos**: Verdadeiro/Falso com feedback inteligente
- **Eficiência**: Reutilização inteligente de conteúdo gerado pela comunidade

### **Modos de Estudo**
- **Modo Foco**: Uma seção específica
- **Modo Revisão**: Apenas questões erradas anteriores
- **Modo Desafio**: Mix aleatório de todas as seções
- **Modo Simulado**: Tempo limitado por questão
- **Modo Batalha**: PvE contra "chefões" temáticos

### **Analytics & Estatísticas**
- **Por Seção**: % acerto, questões respondidas, tempo médio
- **Geral**: XP total, gold, level, streak atual
- **Heatmap**: Desempenho visual por tópicos
- **Recomendações**: IA sugere o que estudar
- **Curva de Aprendizado**: Progresso temporal
- **Spaced Repetition**: Re-apresentação de questões erradas

### **Sistema Social (Futuro)**
- **Rankings**: Leaderboard semanal/mensal
- **Duelos PvP**: Questões simultâneas entre usuários
- **Guilds**: Grupos de estudo colaborativo

## 🗄️ ESTRUTURA DO BANCO DE DADOS

### **Queries de Criação das Tabelas (Supabase)**

**Execute essas queries no SQL Editor do Supabase na ordem apresentada:**

-- 1. PERFIL DO JOGADOR (users são nativos do Supabase Auth)
CREATE TABLE user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    avatar_class TEXT CHECK (avatar_class IN ('estudante', 'advogado', 'juiz', 'promotor')) DEFAULT 'estudante',
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

-- RLS (Row Level Security) POLICIES
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_section_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas para user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Políticas para user_inventory
CREATE POLICY "Users can view own inventory" ON user_inventory
    FOR ALL USING (auth.uid() = user_id);

-- Políticas para user_answers
CREATE POLICY "Users can manage own answers" ON user_answers
    FOR ALL USING (auth.uid() = user_id);

-- Políticas para user_section_stats
CREATE POLICY "Users can manage own stats" ON user_section_stats
    FOR ALL USING (auth.uid() = user_id);

-- Políticas para user_achievements
CREATE POLICY "Users can view own achievements" ON user_achievements
    FOR ALL USING (auth.uid() = user_id);

-- Políticas para study_sessions
CREATE POLICY "Users can manage own sessions" ON study_sessions
    FOR ALL USING (auth.uid() = user_id);

-- Tabelas públicas (questions e shop_items)
CREATE POLICY "Questions are viewable by everyone" ON questions
    FOR SELECT USING (true);

CREATE POLICY "Shop items are viewable by everyone" ON shop_items
    FOR SELECT USING (true);

-- ÍNDICES PARA PERFORMANCE
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

-- INSERÇÃO DE DADOS INICIAIS

-- Matérias disponíveis
INSERT INTO subjects (id, name, description, color_code, icon, is_active) VALUES
(1, 'Direito Penal', 'Crimes e suas punições', '#EF4444', 'gavel', true),
(2, 'Processo Penal', 'Procedimentos criminais', '#3B82F6', 'court', false),
(3, 'Direito Civil', 'Relações entre particulares', '#10B981', 'handshake', false),
(4, 'Processo Civil', 'Procedimentos cíveis', '#F59E0B', 'document', false),
(5, 'Direito Constitucional', 'Fundamentos do Estado', '#8B5CF6', 'flag', false),
(6, 'Direito Administrativo', 'Administração Pública', '#EC4899', 'building', false);

-- Seções do Direito Penal (implementação inicial)
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

-- Shop items
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
```

## 🎨 SISTEMA DE ANIMAÇÕES

### **Bibliotecas de Animação**
- **Framer Motion**: Transições entre componentes
- **React Spring**: Física realista para contadores
- **Lottie React**: Animações complexas (level up, confetti)
- **CSS Keyframes**: Animações simples do avatar
- **Howler.js**: Efeitos sonoros sincronizados

### **Tipos de Animação**

**Feedback de Questões:**
- ✅ **Acerto**: Avatar celebra, partículas verdes, XP counter animado
- ❌ **Erro**: Avatar desanimado, screen shake, destaque do texto correto
- 🔥 **Streak**: Indicador de fogo crescente, multiplicador visual

**Progressão:**
- 📈 **Level Up**: Avatar brilha, confetti explosion, som especial
- 🎁 **New Item**: Chest opening, sparkle effects, tooltip animado
- 💰 **Shop Purchase**: Gold decreasing, item flying to inventory

**Avatar System:**
- **Sprite Layers**: Corpo, roupas, armas, acessórios separados
- **Equipment Change**: Smooth transitions entre equipamentos
- **Idle Animations**: Respiração, piscadas sutis
- **Celebration**: Jump, thumbs up, dance

## 🚀 ROADMAP DE DESENVOLVIMENTO

### **MVP - Versão 1.0**
- [ ] Setup básico: React + Vite + Tailwind + Supabase
- [ ] Sistema de autenticação
- [ ] Navegação Matérias → Seções
- [ ] Integração com DeepSeek API
- [ ] Interface básica de questões
- [ ] Sistema XP/Gold fundamental
- [ ] Avatar básico (sem animações)
- [ ] Direito Penal completo (12 seções)

### **Versão 1.1 - Gamificação**
- [ ] Shop system completo
- [ ] Sistema de equipamentos
- [ ] Animações básicas
- [ ] Achievement system
- [ ] Classes de avatar com bônus por matéria

### **Versão 1.2 - Analytics**
- [ ] Dashboard de estatísticas multi-matéria
- [ ] Spaced repetition
- [ ] Recomendações inteligentes
- [ ] Diferentes modos de estudo

### **Versão 2.0 - Expansão de Conteúdo**
- [ ] **Processo Penal** (nova matéria)
- [ ] **Direito Civil** (nova matéria)
- [ ] **Processo Civil** (nova matéria)
- [ ] Sistema de comparação entre matérias
- [ ] Modo "Concurso" (mix de matérias)

### **Versão 3.0 - Social & Avançado**
- [ ] Sistema PvP
- [ ] Rankings globais por matéria
- [ ] Modo offline + PWA
- [ ] Sistema de guilds
- [ ] **Direito Constitucional** e **Administrativo**

## 🔧 CONFIGURAÇÃO TÉCNICA

### **Variáveis de Ambiente**
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_DEEPSEEK_API_KEY=your_deepseek_key
VITE_APP_URL=https://username.github.io/cram
```

### **Scripts do Projeto**
```json
{
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "deploy": "gh-pages -d dist"
}
```

### **Dependências Principais**
```json
{
  "react": "^18.2.0",
  "vite": "^5.0.0",
  "tailwindcss": "^3.4.0",
  "@supabase/supabase-js": "^2.38.0",
  "framer-motion": "^10.0.0",
  "react-spring": "^9.7.0",
  "lottie-react": "^2.4.0",
  "howler": "^2.2.4",
  "react-router-dom": "^6.20.0"
}
```

## 📝 OBSERVAÇÕES IMPORTANTES

### **Sobre o Conteúdo**
- **Arquitetura multi-matéria** preparada para expansão
- **Implementação inicial**: Direito Penal (Código Penal Brasileiro)
- **Roadmap**: Processo Penal, Civil, Constitucional, Administrativo
- **Questões geradas dinamicamente** pela IA DeepSeek
- **Feedback inteligente** com destaque de modificações
- **Estrutura modular** para fácil adição de novas matérias

### **Sobre Performance**
- Sprite atlas para otimização de assets
- Lazy loading de componentes pesados
- Cache das questões já geradas
- Compressão de imagens pixel art

### **Sobre Segurança**
- Dados isolados por usuário (RLS no Supabase)
- API keys protegidas
- Validação server-side das respostas
- Rate limiting na geração de questões

### **Sobre Monetização (Futuro)**
- Freemium: Básico gratuito, premium pago
- Premium: Mais gold, XP boost, items exclusivos
- Ads opcionais para gold extra
- Compra direta de gold/items

## 🚀 DEPLOY E CI/CD

### **Plataforma de Deploy**
- **Frontend**: Vercel (deploy automático via GitHub Actions)
- **Backend**: Supabase (BaaS - Backend as a Service)
- **Domínio**: Configurado via Vercel
- **SSL**: Automático via Vercel

### **GitHub Actions Workflows**

#### **1. Deploy Principal (.github/workflows/deploy.yml)**
- **Trigger**: Push para branch `main`
- **Processo**:
  1. Checkout do código
  2. Setup Node.js 20
  3. Instalação de dependências (`npm ci`)
  4. Criação do arquivo .env com secrets do GitHub
  5. Build da aplicação (`npm run build`)
  6. Deploy para Vercel (produção)

#### **2. Preview de PRs (.github/workflows/pr-preview.yml)**
- **Trigger**: Abertura/atualização de Pull Requests
- **Processo**:
  1. Build da aplicação
  2. Deploy de preview no Vercel
  3. Comentário automático no PR com URL de preview
  4. Atualização automática a cada novo commit

#### **3. Verificação de Qualidade (.github/workflows/code-quality.yml)**
- **Trigger**: Push/PR para `main` e `develop`
- **Verificações**:
  1. ESLint (análise de código)
  2. Prettier (formatação)
  3. Type checking (TypeScript)
  4. Build check (verificação de build)
  5. Bundle size analysis (tamanho dos arquivos)

### **Secrets Configurados no GitHub**
```env
VITE_SUPABASE_URL=https://[project].supabase.co
VITE_SUPABASE_ANON_KEY=[anon-key]
VITE_DEEPSEEK_API_KEY=[deepseek-key]
VERCEL_TOKEN=[vercel-token]
VERCEL_ORG_ID=[org-id]
VERCEL_PROJECT_ID=[project-id]
```

### **Configuração Vercel**
- **Framework**: Vite (auto-detectado)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm ci`
- **Rewrites**: SPA redirect para `index.html`
- **Headers**: Cache otimizado para assets estáticos

### **Fluxo de Development**
1. **Desenvolvimento**: Branch `develop` ou feature branches
2. **Pull Request**: Cria preview automático via Actions
3. **Review**: Code review + preview testing
4. **Merge**: Deploy automático para produção via Actions
5. **Monitoring**: Vercel Analytics + Logs

---

**Última atualização**: Janeiro 2025  
**Status**: Documentação Completa - Pronto para Deploy via GitHub Actions