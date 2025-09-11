-- =====================================================
-- LIMPEZA SEGURA - APENAS DADOS DO CRAM
-- =====================================================
-- Este script remove APENAS os dados das tabelas do CRAM
-- NÃO afeta auth.users nem outras tabelas de outros projetos
-- Execute no SQL Editor do Supabase Dashboard
-- =====================================================

-- 1. VERIFICAR DADOS EXISTENTES DO CRAM
SELECT 
  'user_profiles' as tabela,
  count(*) as registros,
  array_agg(username) as usernames
FROM user_profiles 
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('dpestilli@tjsp.jus.br', 'david.pestilli@outlook.com')
)

UNION ALL

SELECT 
  'study_sessions' as tabela,
  count(*) as registros,
  NULL as usernames
FROM study_sessions 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('dpestilli@tjsp.jus.br', 'david.pestilli@outlook.com')
)

UNION ALL

SELECT 
  'user_achievements' as tabela,
  count(*) as registros,
  NULL as usernames
FROM user_achievements 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('dpestilli@tjsp.jus.br', 'david.pestilli@outlook.com')
)

UNION ALL

SELECT 
  'user_answers' as tabela,
  count(*) as registros,
  NULL as usernames
FROM user_answers 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('dpestilli@tjsp.jus.br', 'david.pestilli@outlook.com')
)

UNION ALL

SELECT 
  'user_section_stats' as tabela,
  count(*) as registros,
  NULL as usernames
FROM user_section_stats 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('dpestilli@tjsp.jus.br', 'david.pestilli@outlook.com')
)

UNION ALL

SELECT 
  'user_inventory' as tabela,
  count(*) as registros,
  NULL as usernames
FROM user_inventory 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('dpestilli@tjsp.jus.br', 'david.pestilli@outlook.com')
);

-- =====================================================
-- 2. EXCLUIR APENAS DADOS DAS TABELAS DO CRAM
-- =====================================================

-- ATENÇÃO: Os usuários permanecerão em auth.users
-- Apenas os dados específicos do CRAM serão removidos

-- 2.1. Excluir sessões de estudo (CRAM)
DELETE FROM study_sessions 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('dpestilli@tjsp.jus.br', 'david.pestilli@outlook.com')
);

-- 2.2. Excluir conquistas (CRAM)
DELETE FROM user_achievements 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('dpestilli@tjsp.jus.br', 'david.pestilli@outlook.com')
);

-- 2.3. Excluir estatísticas por seção (CRAM)
DELETE FROM user_section_stats 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('dpestilli@tjsp.jus.br', 'david.pestilli@outlook.com')
);

-- 2.4. Excluir respostas (CRAM)
DELETE FROM user_answers 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('dpestilli@tjsp.jus.br', 'david.pestilli@outlook.com')
);

-- 2.5. Excluir inventário (CRAM)
DELETE FROM user_inventory 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('dpestilli@tjsp.jus.br', 'david.pestilli@outlook.com')
);

-- 2.6. Excluir perfil do CRAM (IMPORTANTE: Fazer por último)
DELETE FROM user_profiles 
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('dpestilli@tjsp.jus.br', 'david.pestilli@outlook.com')
);

-- =====================================================
-- 3. VERIFICAR QUE OS DADOS DO CRAM FORAM REMOVIDOS
-- =====================================================

-- Esta query deve retornar 0 para todas as tabelas
SELECT 
  'user_profiles' as tabela_cram,
  count(*) as registros_restantes
FROM user_profiles 
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('dpestilli@tjsp.jus.br', 'david.pestilli@outlook.com')
)

UNION ALL

SELECT 
  'user_answers' as tabela_cram,
  count(*) as registros_restantes
FROM user_answers 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('dpestilli@tjsp.jus.br', 'david.pestilli@outlook.com')
)

UNION ALL

SELECT 
  'study_sessions' as tabela_cram,
  count(*) as registros_restantes
FROM study_sessions 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('dpestilli@tjsp.jus.br', 'david.pestilli@outlook.com')
)

UNION ALL

SELECT 
  'user_achievements' as tabela_cram,
  count(*) as registros_restantes
FROM user_achievements 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('dpestilli@tjsp.jus.br', 'david.pestilli@outlook.com')
);

-- =====================================================
-- 4. CONFIRMAR QUE AUTH.USERS NÃO FOI AFETADO
-- =====================================================

-- Esta query deve mostrar que os usuários ainda existem no auth.users
SELECT 
  'Usuários ainda existem no auth.users' as status,
  email,
  created_at
FROM auth.users 
WHERE email IN ('dpestilli@tjsp.jus.br', 'david.pestilli@outlook.com')
ORDER BY email;

-- =====================================================
-- RESULTADO ESPERADO:
-- =====================================================
-- ✅ Dados do CRAM removidos (user_profiles, user_answers, etc.)
-- ✅ Usuários mantidos em auth.users (outros projetos não afetados)
-- ✅ Próximo login desses usuários no CRAM → ProfileSetup
-- ✅ Outros projetos continuam funcionando normalmente