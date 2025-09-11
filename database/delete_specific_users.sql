-- =====================================================
-- SCRIPT PARA EXCLUIR DADOS DE USUÁRIOS ESPECÍFICOS
-- =====================================================
-- 
-- Este script remove TODOS os dados relacionados aos usuários:
-- - dpestilli@tjsp.jus.br
-- - david.pestilli@outlook.com
--
-- ATENÇÃO: Esta operação é IRREVERSÍVEL
-- Execute no SQL Editor do Supabase Dashboard
--
-- =====================================================

-- =====================================================
-- SEÇÃO 1: IDENTIFICAR IDs DOS USUÁRIOS
-- =====================================================

-- Primeiro, vamos identificar os IDs dos usuários pelos emails
-- Execute esta query para ver os IDs antes de excluir:

SELECT 
  id, 
  email, 
  created_at,
  email_confirmed_at
FROM auth.users 
WHERE email IN ('dpestilli@tjsp.jus.br', 'david.pestilli@outlook.com')
ORDER BY email;

-- =====================================================
-- SEÇÃO 2: EXCLUIR DADOS DAS TABELAS RELACIONADAS
-- =====================================================

-- IMPORTANTE: Execute as queries na ordem apresentada
-- As foreign keys estão configuradas com ON DELETE CASCADE,
-- mas é mais seguro excluir manualmente na ordem correta

-- 1. Excluir sessões de estudo
DELETE FROM study_sessions 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('dpestilli@tjsp.jus.br', 'david.pestilli@outlook.com')
);

-- 2. Excluir conquistas do usuário
DELETE FROM user_achievements 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('dpestilli@tjsp.jus.br', 'david.pestilli@outlook.com')
);

-- 3. Excluir estatísticas por seção
DELETE FROM user_section_stats 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('dpestilli@tjsp.jus.br', 'david.pestilli@outlook.com')
);

-- 4. Excluir respostas do usuário
DELETE FROM user_answers 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('dpestilli@tjsp.jus.br', 'david.pestilli@outlook.com')
);

-- 5. Excluir inventário do usuário
DELETE FROM user_inventory 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('dpestilli@tjsp.jus.br', 'david.pestilli@outlook.com')
);

-- 6. Excluir perfil do usuário
DELETE FROM user_profiles 
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('dpestilli@tjsp.jus.br', 'david.pestilli@outlook.com')
);

-- =====================================================
-- SEÇÃO 3: EXCLUIR USUÁRIOS DO AUTHENTICATION
-- =====================================================

-- ATENÇÃO: Isto remove os usuários do sistema de autenticação
-- Eles terão que se re-registrar completamente

-- Opção A: Excluir apenas do auth.users (mais seguro para teste)
DELETE FROM auth.users 
WHERE email IN ('dpestilli@tjsp.jus.br', 'david.pestilli@outlook.com');

-- =====================================================
-- SEÇÃO 4: VERIFICAÇÃO PÓS-EXCLUSÃO
-- =====================================================

-- Verificar se os dados foram removidos
SELECT 'auth.users' as tabela, count(*) as registros_restantes
FROM auth.users 
WHERE email IN ('dpestilli@tjsp.jus.br', 'david.pestilli@outlook.com')

UNION ALL

SELECT 'user_profiles' as tabela, count(*) as registros_restantes
FROM user_profiles 
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('dpestilli@tjsp.jus.br', 'david.pestilli@outlook.com')
)

UNION ALL

SELECT 'user_answers' as tabela, count(*) as registros_restantes
FROM user_answers 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('dpestilli@tjsp.jus.br', 'david.pestilli@outlook.com')
)

UNION ALL

SELECT 'study_sessions' as tabela, count(*) as registros_restantes
FROM study_sessions 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('dpestilli@tjsp.jus.br', 'david.pestilli@outlook.com')
)

UNION ALL

SELECT 'user_achievements' as tabela, count(*) as registros_restantes
FROM user_achievements 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('dpestilli@tjsp.jus.br', 'david.pestilli@outlook.com')
);

-- =====================================================
-- SEÇÃO 5: INSTRUÇÕES DE USO
-- =====================================================

/*
COMO USAR ESTE SCRIPT:

1. BACKUP PRIMEIRO (Recomendado):
   - Faça backup dos dados se necessário
   - Anote os IDs dos usuários executando a SEÇÃO 1

2. EXECUTE NO SUPABASE:
   - Vá para o SQL Editor no Dashboard do Supabase
   - Execute cada seção separadamente
   - Comece pela SEÇÃO 1 para ver os dados
   - Execute SEÇÃO 2 para limpar dados relacionados
   - Execute SEÇÃO 3 para remover usuários do Auth
   - Execute SEÇÃO 4 para verificar

3. TESTE O CADASTRO:
   - Após a exclusão, os usuários podem se re-registrar
   - O fluxo novo implementado irá funcionar corretamente
   - Eles serão direcionados para ProfileSetup

4. ALTERNATIVA MAIS SEGURA:
   - Se quiser apenas "resetar" em vez de excluir completamente,
   - Execute apenas as SEÇÕES 2 e 6 (pular exclusão do auth.users)
   - Isso manterá o usuário no Auth mas limpará os dados do CRAM
*/

-- =====================================================
-- FIM DO SCRIPT DE EXCLUSÃO
-- =====================================================