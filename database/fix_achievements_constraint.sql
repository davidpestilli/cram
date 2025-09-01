-- =====================================================
-- CORREÇÃO PARA CONSTRAINT legacy_achievement_id
-- =====================================================

-- Tornar o campo legacy_achievement_id opcional (nullable)
ALTER TABLE user_achievements ALTER COLUMN legacy_achievement_id DROP NOT NULL;

-- Verificar a estrutura atual
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_achievements' 
AND table_schema = 'public'
ORDER BY ordinal_position;