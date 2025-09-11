-- =====================================================
-- ADICIONAR POLÍTICA DELETE FALTANTE
-- =====================================================
-- Execute no SQL Editor do Supabase Dashboard
-- =====================================================

-- Adicionar política DELETE para user_profiles
CREATE POLICY "Users can delete own profile" ON user_profiles
    FOR DELETE USING (auth.uid() = id);

-- Verificar se a política foi criada
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd,
  qual 
FROM pg_policies 
WHERE tablename = 'user_profiles'
ORDER BY cmd;