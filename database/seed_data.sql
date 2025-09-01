-- =====================================================
-- CRAM - Seed Data Script for Supabase
-- =====================================================
-- Este script contém dados iniciais para desenvolvimento e teste
-- Execute este script no SQL Editor do Supabase Dashboard
--
-- PRÉ-REQUISITOS:
-- 1. Execute DATABASE_STRUCTURE.sql primeiro
-- 2. Execute CONQUISTAS_DATABASE.sql segundo  
-- 3. Execute este arquivo por último
--
-- PROTEÇÃO CONTRA DUPLICATAS:
-- Este script inclui comandos DELETE e ON CONFLICT
-- para permitir execução múltipla sem erros
-- =====================================================

-- =====================================================
-- LIMPEZA INICIAL (Execute apenas se houver dados duplicados)
-- =====================================================

-- Limpar dados existentes para evitar conflitos de chave primária
-- ATENÇÃO: Isto apagará todos os dados das tabelas relacionadas

-- Limpar na ordem correta devido às foreign keys
DELETE FROM user_achievements WHERE achievement_ref_id IS NOT NULL;
DELETE FROM study_sessions WHERE user_id IN (
  SELECT id FROM user_profiles WHERE username IN ('dev_user', 'student_test', 'advanced_user')
);
DELETE FROM user_profiles WHERE username IN ('dev_user', 'student_test', 'advanced_user');
DELETE FROM achievements WHERE id BETWEEN 1 AND 25;

-- Resetar sequences se necessário
SELECT setval('achievements_id_seq', 1, false);

-- =====================================================
-- 1. ACHIEVEMENTS (Conquistas do Sistema)
-- =====================================================

-- Inserir achievements com proteção contra duplicatas
INSERT INTO achievements (
  id, name, description, icon, type, category, 
  condition_type, condition_value, xp_reward, gold_reward,
  created_at
) VALUES 

-- BRONZE ACHIEVEMENTS
(1, 'Primeiro Passo', 'Complete sua primeira questão', '🎯', 'progress', 'bronze', 'questions_answered', 1, 50, 10, NOW()),
(2, 'Estudante Iniciante', 'Responda 10 questões corretamente', '📚', 'progress', 'bronze', 'correct_answers', 10, 100, 25, NOW()),
(3, 'Primeira Sessão', 'Complete sua primeira sessão de estudo', '⏰', 'milestone', 'bronze', 'study_sessions', 1, 75, 15, NOW()),
(4, 'Explorador', 'Estude 3 temas diferentes', '🗺️', 'variety', 'bronze', 'subjects_studied', 3, 125, 30, NOW()),
(5, 'Persistente', 'Mantenha uma sequência de 3 dias', '🔥', 'streak', 'bronze', 'daily_streak', 3, 150, 40, NOW()),

-- SILVER ACHIEVEMENTS  
(6, 'Conhecedor', 'Responda 50 questões corretamente', '🧠', 'progress', 'silver', 'correct_answers', 50, 200, 75, NOW()),
(7, 'Maratonista', 'Complete 10 sessões de estudo', '🏃', 'milestone', 'silver', 'study_sessions', 10, 250, 100, NOW()),
(8, 'Especialista', 'Alcance 80% de acertos em um tema', '📖', 'mastery', 'silver', 'subject_accuracy', 80, 300, 125, NOW()),
(9, 'Dedicado', 'Mantenha uma sequência de 7 dias', '🔥', 'streak', 'silver', 'daily_streak', 7, 350, 150, NOW()),
(10, 'Colecionador', 'Estude todos os 12 temas disponíveis', '🎭', 'variety', 'silver', 'subjects_studied', 12, 400, 200, NOW()),

-- GOLD ACHIEVEMENTS
(11, 'Mestre das Questões', 'Responda 200 questões corretamente', '👑', 'progress', 'gold', 'correct_answers', 200, 500, 250, NOW()),
(12, 'Veterano', 'Complete 50 sessões de estudo', '🎖️', 'milestone', 'gold', 'study_sessions', 50, 600, 300, NOW()),
(13, 'Perfeccionista', 'Alcance 95% de acertos em 3 temas', '⭐', 'mastery', 'gold', 'perfect_subjects', 3, 750, 400, NOW()),
(14, 'Inabalável', 'Mantenha uma sequência de 30 dias', '💪', 'streak', 'gold', 'daily_streak', 30, 1000, 500, NOW()),
(15, 'Polímata', 'Domine 8 temas com 90%+ de acertos', '🎓', 'mastery', 'gold', 'mastered_subjects', 8, 1200, 600, NOW()),

-- PLATINUM ACHIEVEMENTS
(16, 'Lenda Viva', 'Responda 1000 questões corretamente', '💎', 'progress', 'platinum', 'correct_answers', 1000, 2000, 1000, NOW()),
(17, 'Mestre Supremo', 'Complete 200 sessões de estudo', '👨‍🏫', 'milestone', 'platinum', 'study_sessions', 200, 2500, 1250, NOW()),
(18, 'Genialidade', 'Alcance 98% de acertos em 5 temas', '🧙', 'mastery', 'platinum', 'genius_subjects', 5, 3000, 1500, NOW()),
(19, 'Imortal', 'Mantenha uma sequência de 100 dias', '🔮', 'streak', 'platinum', 'daily_streak', 100, 5000, 2500, NOW()),
(20, 'Grande Mestre', 'Domine todos os 12 temas com 95%+', '🏆', 'mastery', 'platinum', 'all_subjects_mastered', 12, 10000, 5000, NOW()),

-- SECRET ACHIEVEMENTS
(21, 'Madrugador', 'Complete uma sessão antes das 6h', '🌅', 'special', 'secret', 'early_bird_session', 1, 500, 250, NOW()),
(22, 'Noturno', 'Complete uma sessão depois das 23h', '🌙', 'special', 'secret', 'night_owl_session', 1, 500, 250, NOW()),
(23, 'Velocista', 'Responda 20 questões em menos de 5min', '⚡', 'speed', 'secret', 'speed_questions', 20, 750, 375, NOW()),
(24, 'Resiliente', 'Continue estudando após 5 erros seguidos', '🛡️', 'persistence', 'secret', 'persistence_after_errors', 5, 800, 400, NOW()),
(25, 'Descobridor', 'Encontre esta conquista secreta', '🕵️', 'easter_egg', 'secret', 'easter_egg_found', 1, 1000, 500, NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  type = EXCLUDED.type,
  category = EXCLUDED.category,
  condition_type = EXCLUDED.condition_type,
  condition_value = EXCLUDED.condition_value,
  xp_reward = EXCLUDED.xp_reward,
  gold_reward = EXCLUDED.gold_reward;

-- =====================================================
-- 2. USER PROFILES (Usuários de Teste)
-- =====================================================

-- Usuários reais do Supabase Auth
INSERT INTO user_profiles (
  id, username, avatar_class, avatar_gender,
  level, xp, gold, current_streak, max_streak,
  total_questions, total_correct,
  created_at, updated_at
) VALUES 
-- UUIDs reais dos usuários do auth.users
('bdb5a20d-0170-498b-87cc-607d85307af0', 'dev_user', 'estudante', 'masculino', 5, 2150, 340, 8, 15, 147, 132, NOW(), NOW()),
('2c467a78-f3ee-43ca-86d0-59a79999010d', 'student_test', 'estudante', 'feminino', 3, 1180, 185, 4, 12, 89, 76, NOW(), NOW()),
('4d83b4ee-8091-4acd-8918-06a7022d7d21', 'advanced_user', 'advogado', 'masculino', 8, 4680, 890, 25, 35, 456, 398, NOW(), NOW()),
('1e639bbd-7881-4558-ba1b-a62a7d15708a', 'pro_user', 'juiz', 'masculino', 12, 8450, 1250, 45, 60, 890, 823, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  avatar_class = EXCLUDED.avatar_class,
  avatar_gender = EXCLUDED.avatar_gender,
  level = EXCLUDED.level,
  xp = EXCLUDED.xp,
  gold = EXCLUDED.gold,
  current_streak = EXCLUDED.current_streak,
  max_streak = EXCLUDED.max_streak,
  total_questions = EXCLUDED.total_questions,
  total_correct = EXCLUDED.total_correct,
  updated_at = NOW();

-- =====================================================
-- 3. USER ACHIEVEMENTS (Progresso das Conquistas)  
-- =====================================================

-- Limpar achievements existentes dos usuários reais
DELETE FROM user_achievements WHERE user_id IN (
  'bdb5a20d-0170-498b-87cc-607d85307af0',
  '2c467a78-f3ee-43ca-86d0-59a79999010d',
  '4d83b4ee-8091-4acd-8918-06a7022d7d21',
  '1e639bbd-7881-4558-ba1b-a62a7d15708a'
);

INSERT INTO user_achievements (
  user_id, achievement_ref_id, title, description, progress, is_completed, unlocked_at, notified
) VALUES
-- Conquistas do dev_user (bdb5a20d-0170-498b-87cc-607d85307af0)
('bdb5a20d-0170-498b-87cc-607d85307af0', 1, 'Primeiro Passo', 'Complete sua primeira questão', 1, true, NOW() - INTERVAL '7 days', true),
('bdb5a20d-0170-498b-87cc-607d85307af0', 2, 'Estudante Iniciante', 'Responda 10 questões corretamente', 10, true, NOW() - INTERVAL '5 days', true),  
('bdb5a20d-0170-498b-87cc-607d85307af0', 3, 'Primeira Sessão', 'Complete sua primeira sessão de estudo', 1, true, NOW() - INTERVAL '6 days', true),
('bdb5a20d-0170-498b-87cc-607d85307af0', 4, 'Explorador', 'Estude 3 temas diferentes', 3, true, NOW() - INTERVAL '4 days', true),
('bdb5a20d-0170-498b-87cc-607d85307af0', 5, 'Persistente', 'Mantenha uma sequência de 3 dias', 8, true, NOW() - INTERVAL '1 day', true),
('bdb5a20d-0170-498b-87cc-607d85307af0', 6, 'Conhecedor', 'Responda 50 questões corretamente', 45, false, NULL, false),
('bdb5a20d-0170-498b-87cc-607d85307af0', 7, 'Maratonista', 'Complete 10 sessões de estudo', 12, true, NOW() - INTERVAL '2 days', true),
('bdb5a20d-0170-498b-87cc-607d85307af0', 21, 'Madrugador', 'Complete uma sessão antes das 6h', 1, true, NOW() - INTERVAL '3 days', true),

-- Conquistas do student_test (2c467a78-f3ee-43ca-86d0-59a79999010d) - menos progresso  
('2c467a78-f3ee-43ca-86d0-59a79999010d', 1, 'Primeiro Passo', 'Complete sua primeira questão', 1, true, NOW() - INTERVAL '10 days', true),
('2c467a78-f3ee-43ca-86d0-59a79999010d', 2, 'Estudante Iniciante', 'Responda 10 questões corretamente', 8, false, NULL, false),
('2c467a78-f3ee-43ca-86d0-59a79999010d', 3, 'Primeira Sessão', 'Complete sua primeira sessão de estudo', 1, true, NOW() - INTERVAL '8 days', true),
('2c467a78-f3ee-43ca-86d0-59a79999010d', 5, 'Persistente', 'Mantenha uma sequência de 3 dias', 4, true, NOW() - INTERVAL '1 day', false),

-- Conquistas do advanced_user (4d83b4ee-8091-4acd-8918-06a7022d7d21) - muito progresso
('4d83b4ee-8091-4acd-8918-06a7022d7d21', 1, 'Primeiro Passo', 'Complete sua primeira questão', 1, true, NOW() - INTERVAL '30 days', true),
('4d83b4ee-8091-4acd-8918-06a7022d7d21', 2, 'Estudante Iniciante', 'Responda 10 questões corretamente', 10, true, NOW() - INTERVAL '25 days', true),
('4d83b4ee-8091-4acd-8918-06a7022d7d21', 3, 'Primeira Sessão', 'Complete sua primeira sessão de estudo', 1, true, NOW() - INTERVAL '28 days', true),
('4d83b4ee-8091-4acd-8918-06a7022d7d21', 4, 'Explorador', 'Estude 3 temas diferentes', 3, true, NOW() - INTERVAL '20 days', true),
('4d83b4ee-8091-4acd-8918-06a7022d7d21', 5, 'Persistente', 'Mantenha uma sequência de 3 dias', 25, true, NOW() - INTERVAL '5 days', true),
('4d83b4ee-8091-4acd-8918-06a7022d7d21', 6, 'Conhecedor', 'Responda 50 questões corretamente', 50, true, NOW() - INTERVAL '15 days', true),
('4d83b4ee-8091-4acd-8918-06a7022d7d21', 7, 'Maratonista', 'Complete 10 sessões de estudo', 10, true, NOW() - INTERVAL '12 days', true),
('4d83b4ee-8091-4acd-8918-06a7022d7d21', 8, 'Especialista', 'Alcance 80% de acertos em um tema', 85, true, NOW() - INTERVAL '10 days', true),
('4d83b4ee-8091-4acd-8918-06a7022d7d21', 9, 'Dedicado', 'Mantenha uma sequência de 7 dias', 25, true, NOW() - INTERVAL '2 days', true),
('4d83b4ee-8091-4acd-8918-06a7022d7d21', 10, 'Colecionador', 'Estude todos os 12 temas disponíveis', 12, true, NOW() - INTERVAL '8 days', true),
('4d83b4ee-8091-4acd-8918-06a7022d7d21', 11, 'Mestre das Questões', 'Responda 200 questões corretamente', 398, true, NOW() - INTERVAL '3 days', false),
('4d83b4ee-8091-4acd-8918-06a7022d7d21', 21, 'Madrugador', 'Complete uma sessão antes das 6h', 1, true, NOW() - INTERVAL '15 days', true),
('4d83b4ee-8091-4acd-8918-06a7022d7d21', 22, 'Noturno', 'Complete uma sessão depois das 23h', 1, true, NOW() - INTERVAL '12 days', true),

-- Conquistas do pro_user (1e639bbd-7881-4558-ba1b-a62a7d15708a) - usuário expert
('1e639bbd-7881-4558-ba1b-a62a7d15708a', 1, 'Primeiro Passo', 'Complete sua primeira questão', 1, true, NOW() - INTERVAL '60 days', true),
('1e639bbd-7881-4558-ba1b-a62a7d15708a', 2, 'Estudante Iniciante', 'Responda 10 questões corretamente', 10, true, NOW() - INTERVAL '55 days', true),
('1e639bbd-7881-4558-ba1b-a62a7d15708a', 3, 'Primeira Sessão', 'Complete sua primeira sessão de estudo', 1, true, NOW() - INTERVAL '58 days', true),
('1e639bbd-7881-4558-ba1b-a62a7d15708a', 4, 'Explorador', 'Estude 3 temas diferentes', 3, true, NOW() - INTERVAL '50 days', true),
('1e639bbd-7881-4558-ba1b-a62a7d15708a', 5, 'Persistente', 'Mantenha uma sequência de 3 dias', 45, true, NOW() - INTERVAL '15 days', true),
('1e639bbd-7881-4558-ba1b-a62a7d15708a', 6, 'Conhecedor', 'Responda 50 questões corretamente', 50, true, NOW() - INTERVAL '45 days', true),
('1e639bbd-7881-4558-ba1b-a62a7d15708a', 7, 'Maratonista', 'Complete 10 sessões de estudo', 10, true, NOW() - INTERVAL '40 days', true),
('1e639bbd-7881-4558-ba1b-a62a7d15708a', 8, 'Especialista', 'Alcance 80% de acertos em um tema', 90, true, NOW() - INTERVAL '35 days', true),
('1e639bbd-7881-4558-ba1b-a62a7d15708a', 9, 'Dedicado', 'Mantenha uma sequência de 7 dias', 45, true, NOW() - INTERVAL '10 days', true),
('1e639bbd-7881-4558-ba1b-a62a7d15708a', 10, 'Colecionador', 'Estude todos os 12 temas disponíveis', 12, true, NOW() - INTERVAL '30 days', true),
('1e639bbd-7881-4558-ba1b-a62a7d15708a', 11, 'Mestre das Questões', 'Responda 200 questões corretamente', 823, true, NOW() - INTERVAL '20 days', true),
('1e639bbd-7881-4558-ba1b-a62a7d15708a', 12, 'Veterano', 'Complete 50 sessões de estudo', 67, true, NOW() - INTERVAL '18 days', true),
('1e639bbd-7881-4558-ba1b-a62a7d15708a', 13, 'Perfeccionista', 'Alcance 95% de acertos em 3 temas', 3, true, NOW() - INTERVAL '25 days', true),
('1e639bbd-7881-4558-ba1b-a62a7d15708a', 14, 'Inabalável', 'Mantenha uma sequência de 30 dias', 45, true, NOW() - INTERVAL '5 days', true),
('1e639bbd-7881-4558-ba1b-a62a7d15708a', 21, 'Madrugador', 'Complete uma sessão antes das 6h', 1, true, NOW() - INTERVAL '45 days', true),
('1e639bbd-7881-4558-ba1b-a62a7d15708a', 22, 'Noturno', 'Complete uma sessão depois das 23h', 1, true, NOW() - INTERVAL '40 days', true),
('1e639bbd-7881-4558-ba1b-a62a7d15708a', 23, 'Velocista', 'Responda 20 questões em menos de 5min', 1, true, NOW() - INTERVAL '35 days', true);

-- =====================================================
-- 4. STUDY SESSIONS (Sessões de Estudo de Exemplo)
-- =====================================================

-- Limpar sessões existentes dos usuários
DELETE FROM study_sessions WHERE user_id IN (
  'bdb5a20d-0170-498b-87cc-607d85307af0',
  '2c467a78-f3ee-43ca-86d0-59a79999010d', 
  '4d83b4ee-8091-4acd-8918-06a7022d7d21',
  '1e639bbd-7881-4558-ba1b-a62a7d15708a'
);

INSERT INTO study_sessions (
  user_id, subject_id, section_id, questions_count, correct_count, 
  xp_gained, gold_gained, duration, started_at, completed_at
) VALUES

-- Sessões do dev_user (iniciante)
('bdb5a20d-0170-498b-87cc-607d85307af0', 1, 1, 10, 7, 70, 35, 900, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
('bdb5a20d-0170-498b-87cc-607d85307af0', 1, 2, 8, 5, 50, 25, 1200, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
('bdb5a20d-0170-498b-87cc-607d85307af0', 1, 1, 12, 9, 90, 45, 1800, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),

-- Sessões do student_test (progresso médio)
('2c467a78-f3ee-43ca-86d0-59a79999010d', 1, 1, 15, 12, 120, 60, 1500, NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
('2c467a78-f3ee-43ca-86d0-59a79999010d', 1, 2, 20, 16, 160, 80, 2400, NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),
('2c467a78-f3ee-43ca-86d0-59a79999010d', 1, 3, 15, 13, 130, 65, 1800, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
('2c467a78-f3ee-43ca-86d0-59a79999010d', 1, 1, 18, 15, 150, 75, 2100, NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
('2c467a78-f3ee-43ca-86d0-59a79999010d', 1, 4, 12, 10, 100, 50, 1500, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
('2c467a78-f3ee-43ca-86d0-59a79999010d', 1, 2, 22, 19, 190, 95, 2700, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
('2c467a78-f3ee-43ca-86d0-59a79999010d', 1, 5, 16, 14, 140, 70, 2000, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),

-- Sessões do advanced_user (usuário avançado)
('4d83b4ee-8091-4acd-8918-06a7022d7d21', 1, 1, 25, 23, 230, 115, 2100, NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),
('4d83b4ee-8091-4acd-8918-06a7022d7d21', 1, 2, 30, 27, 270, 135, 2400, NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),
('4d83b4ee-8091-4acd-8918-06a7022d7d21', 1, 3, 25, 22, 220, 110, 2200, NOW() - INTERVAL '13 days', NOW() - INTERVAL '13 days'),
('4d83b4ee-8091-4acd-8918-06a7022d7d21', 1, 4, 35, 32, 320, 160, 2800, NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),
('4d83b4ee-8091-4acd-8918-06a7022d7d21', 1, 5, 28, 25, 250, 125, 2500, NOW() - INTERVAL '11 days', NOW() - INTERVAL '11 days'),
('4d83b4ee-8091-4acd-8918-06a7022d7d21', 1, 6, 20, 18, 180, 90, 1800, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
('4d83b4ee-8091-4acd-8918-06a7022d7d21', 1, 7, 30, 28, 280, 140, 2600, NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days'),
('4d83b4ee-8091-4acd-8918-06a7022d7d21', 1, 8, 22, 20, 200, 100, 2000, NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),
('4d83b4ee-8091-4acd-8918-06a7022d7d21', 1, 9, 40, 36, 360, 180, 3200, NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
('4d83b4ee-8091-4acd-8918-06a7022d7d21', 1, 10, 35, 33, 330, 165, 2900, NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),
('4d83b4ee-8091-4acd-8918-06a7022d7d21', 1, 11, 25, 24, 240, 120, 2300, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
('4d83b4ee-8091-4acd-8918-06a7022d7d21', 1, 12, 45, 41, 410, 205, 3600, NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
('4d83b4ee-8091-4acd-8918-06a7022d7d21', 1, 1, 30, 28, 280, 140, 2400, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
('4d83b4ee-8091-4acd-8918-06a7022d7d21', 1, 3, 28, 26, 260, 130, 2500, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
('4d83b4ee-8091-4acd-8918-06a7022d7d21', 1, 5, 32, 30, 300, 150, 2700, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),

-- Sessões do pro_user (usuário expert)
('1e639bbd-7881-4558-ba1b-a62a7d15708a', 1, 1, 50, 48, 480, 240, 3000, NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
('1e639bbd-7881-4558-ba1b-a62a7d15708a', 1, 2, 45, 43, 430, 215, 2700, NOW() - INTERVAL '29 days', NOW() - INTERVAL '29 days'),
('1e639bbd-7881-4558-ba1b-a62a7d15708a', 1, 3, 40, 39, 390, 195, 2500, NOW() - INTERVAL '28 days', NOW() - INTERVAL '28 days'),
('1e639bbd-7881-4558-ba1b-a62a7d15708a', 1, 4, 55, 52, 520, 260, 3300, NOW() - INTERVAL '27 days', NOW() - INTERVAL '27 days'),
('1e639bbd-7881-4558-ba1b-a62a7d15708a', 1, 5, 48, 46, 460, 230, 2900, NOW() - INTERVAL '26 days', NOW() - INTERVAL '26 days'),
('1e639bbd-7881-4558-ba1b-a62a7d15708a', 1, 6, 35, 34, 340, 170, 2200, NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days'),
('1e639bbd-7881-4558-ba1b-a62a7d15708a', 1, 7, 60, 57, 570, 285, 3600, NOW() - INTERVAL '24 days', NOW() - INTERVAL '24 days'),
('1e639bbd-7881-4558-ba1b-a62a7d15708a', 1, 8, 42, 40, 400, 200, 2600, NOW() - INTERVAL '23 days', NOW() - INTERVAL '23 days'),
('1e639bbd-7881-4558-ba1b-a62a7d15708a', 1, 9, 65, 62, 620, 310, 3900, NOW() - INTERVAL '22 days', NOW() - INTERVAL '22 days'),
('1e639bbd-7881-4558-ba1b-a62a7d15708a', 1, 10, 50, 48, 480, 240, 3000, NOW() - INTERVAL '21 days', NOW() - INTERVAL '21 days'),
('1e639bbd-7881-4558-ba1b-a62a7d15708a', 1, 11, 38, 37, 370, 185, 2400, NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),
('1e639bbd-7881-4558-ba1b-a62a7d15708a', 1, 12, 70, 67, 670, 335, 4200, NOW() - INTERVAL '19 days', NOW() - INTERVAL '19 days'),
('1e639bbd-7881-4558-ba1b-a62a7d15708a', 1, 1, 45, 44, 440, 220, 2700, NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days'),
('1e639bbd-7881-4558-ba1b-a62a7d15708a', 1, 2, 52, 50, 500, 250, 3100, NOW() - INTERVAL '17 days', NOW() - INTERVAL '17 days'),
('1e639bbd-7881-4558-ba1b-a62a7d15708a', 1, 3, 48, 47, 470, 235, 2900, NOW() - INTERVAL '16 days', NOW() - INTERVAL '16 days'),
('1e639bbd-7881-4558-ba1b-a62a7d15708a', 1, 4, 55, 53, 530, 265, 3300, NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),
('1e639bbd-7881-4558-ba1b-a62a7d15708a', 1, 5, 40, 39, 390, 195, 2400, NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),
('1e639bbd-7881-4558-ba1b-a62a7d15708a', 1, 6, 58, 56, 560, 280, 3500, NOW() - INTERVAL '13 days', NOW() - INTERVAL '13 days'),
('1e639bbd-7881-4558-ba1b-a62a7d15708a', 1, 7, 62, 60, 600, 300, 3700, NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),
('1e639bbd-7881-4558-ba1b-a62a7d15708a', 1, 8, 35, 34, 340, 170, 2100, NOW() - INTERVAL '11 days', NOW() - INTERVAL '11 days'),
('1e639bbd-7881-4558-ba1b-a62a7d15708a', 1, 9, 75, 72, 720, 360, 4500, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
('1e639bbd-7881-4558-ba1b-a62a7d15708a', 1, 10, 50, 49, 490, 245, 3000, NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days'),
('1e639bbd-7881-4558-ba1b-a62a7d15708a', 1, 11, 42, 41, 410, 205, 2500, NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),
('1e639bbd-7881-4558-ba1b-a62a7d15708a', 1, 12, 80, 76, 760, 380, 4800, NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
('1e639bbd-7881-4558-ba1b-a62a7d15708a', 1, 1, 38, 37, 370, 185, 2200, NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),
('1e639bbd-7881-4558-ba1b-a62a7d15708a', 1, 3, 55, 54, 540, 270, 3300, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
('1e639bbd-7881-4558-ba1b-a62a7d15708a', 1, 5, 48, 47, 470, 235, 2900, NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
('1e639bbd-7881-4558-ba1b-a62a7d15708a', 1, 7, 65, 63, 630, 315, 3900, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
('1e639bbd-7881-4558-ba1b-a62a7d15708a', 1, 9, 70, 68, 680, 340, 4200, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
('1e639bbd-7881-4558-ba1b-a62a7d15708a', 1, 11, 45, 44, 440, 220, 2700, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

-- =====================================================
-- FINALIZAÇÃO E VERIFICAÇÕES
-- =====================================================

-- Verificar dados inseridos
SELECT 'Achievements criadas' as tabela, COUNT(*) as total FROM achievements
UNION ALL
SELECT 'User Profiles criados' as tabela, COUNT(*) as total FROM user_profiles
UNION ALL  
SELECT 'User Achievements criados' as tabela, COUNT(*) as total FROM user_achievements
UNION ALL
SELECT 'Study Sessions criadas' as tabela, COUNT(*) as total FROM study_sessions;

-- Verificar dados por usuário
SELECT 
  up.username,
  up.level,
  up.xp,
  up.gold,
  up.total_correct,
  up.current_streak,
  COUNT(ua.id) as total_achievements,
  COUNT(ss.id) as total_sessions
FROM user_profiles up
LEFT JOIN user_achievements ua ON up.id = ua.user_id AND ua.is_completed = true
LEFT JOIN study_sessions ss ON up.id = ss.user_id
GROUP BY up.id, up.username, up.level, up.xp, up.gold, up.total_correct, up.current_streak
ORDER BY up.level DESC;

-- Verificar conquistas mais comuns
SELECT 
  a.name as achievement_name,
  COUNT(ua.id) as users_completed
FROM achievements a
LEFT JOIN user_achievements ua ON a.id = ua.achievement_ref_id AND ua.is_completed = true
GROUP BY a.id, a.name
ORDER BY users_completed DESC, a.name;
-- Script executado com sucesso!
SELECT '✅ SEED DATA INSERIDO COM SUCESSO!' as status;
SELECT '📊 Mock data disponível para desenvolvimento' as info;
SELECT '👤 Para dados de usuário, use mock profiles no AuthContext' as instrucao;