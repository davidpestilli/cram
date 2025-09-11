-- =====================================================
-- LIMPEZA RÁPIDA DOS USUÁRIOS ESPECÍFICOS
-- =====================================================
-- Execute estas queries no SQL Editor do Supabase Dashboard
-- Uma por vez, na ordem apresentada
-- =====================================================

-- 1. VER OS USUÁRIOS ANTES DE EXCLUIR
SELECT 
  u.id, 
  u.email, 
  up.username,
  up.level,
  up.xp,
  u.created_at
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
WHERE u.email IN ('dpestilli@tjsp.jus.br', 'david.pestilli@outlook.com')
ORDER BY u.email;

-- 2. EXCLUIR TODOS OS DADOS (EM UMA ÚNICA OPERAÇÃO)
-- ATENÇÃO: Esta operação é IRREVERSÍVEL
WITH target_users AS (
  SELECT id FROM auth.users 
  WHERE email IN ('dpestilli@tjsp.jus.br', 'david.pestilli@outlook.com')
)
DELETE FROM auth.users 
WHERE id IN (SELECT id FROM target_users);

-- A exclusão em cascata (ON DELETE CASCADE) automaticamente remove:
-- - user_profiles
-- - user_answers  
-- - user_section_stats
-- - user_achievements
-- - user_inventory
-- - study_sessions

-- 3. VERIFICAR QUE TUDO FOI REMOVIDO
SELECT 
  'Usuários restantes' as status,
  count(*) as quantidade
FROM auth.users 
WHERE email IN ('dpestilli@tjsp.jus.br', 'david.pestilli@outlook.com');

-- Se retornar 0, a limpeza foi bem-sucedida