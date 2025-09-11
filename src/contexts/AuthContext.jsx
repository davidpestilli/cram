import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          fetchProfile(session.user.id, session.user.email)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription?.unsubscribe()
  }, [])

  const fetchProfile = async (userId, userEmail = null) => {
    try {
      console.log('FetchProfile: Starting fetch for user:', userId, 'email:', userEmail)
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      console.log('FetchProfile: Supabase response:', { data, error })
      
      if (error) {
        // Se o usuário não existe, criar um perfil temporário
        if (error.code === 'PGRST116' || error.status === 406) {
          console.log('User profile not found, creating temporary profile')
          const tempProfile = createTemporaryProfile(userId, userEmail || user?.email)
          setProfile(tempProfile)
          return
        }
        
        console.error('Error fetching profile:', error)
        
        // Criar perfil temporário para usuários novos
        console.log('Creating temporary profile for new user')
        const tempProfile = createTemporaryProfile(userId, userEmail || user?.email)
        setProfile(tempProfile)
        return
      }
      
      console.log('AuthContext: Profile loaded from database:', data)
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
      
      // Criar perfil temporário para usuários novos (desenvolvimento e produção)
      console.log('Creating temporary profile for new user')
      const tempProfile = createTemporaryProfile(userId, userEmail || user?.email)
      setProfile(tempProfile)
    }
  }

  // Criar perfil temporário para novos usuários
  const createTemporaryProfile = (userId, userEmail) => {
    // Usar email como username padrão, removendo domínio se necessário
    const defaultUsername = userEmail ? userEmail.split('@')[0] : 'novo_usuario'
    
    return {
      id: userId,
      username: defaultUsername,
      avatar_class: 'estudante',
      avatar_gender: 'masculino',
      level: 1,
      xp: 0,
      gold: 100,
      current_streak: 0,
      max_streak: 0,
      total_questions: 0,
      total_correct: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_temporary: true // Flag para indicar que é perfil temporário
    }
  }

  const signUp = async (email, password) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email, password) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      console.log('SignOut: Starting logout process')
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('SignOut: Supabase error:', error)
        // Se é erro de sessão missing, apenas limpamos o estado local
        if (error.message?.includes('Auth session missing')) {
          console.log('SignOut: Session already missing, cleaning local state')
        } else {
          throw error
        }
      }
      console.log('SignOut: Logout successful')
    } catch (error) {
      console.error('Error signing out:', error)
      // Se falhar por qualquer motivo, ainda tentamos limpar o estado local
    } finally {
      // Sempre limpar estado local, independente do que aconteceu no Supabase
      setUser(null)
      setProfile(null)
      setLoading(false)
      console.log('SignOut: Local state cleaned, process completed')
    }
  }

  const createProfile = async (profileData) => {
    try {
      // Dados padrão para novo perfil
      const newProfile = {
        id: user.id,
        username: profileData.username || user.email.split('@')[0],
        avatar_class: profileData.avatar_class || 'estudante',
        avatar_gender: profileData.avatar_gender || 'masculino',
        level: 1,
        xp: 0,
        gold: 100,
        current_streak: 0,
        max_streak: 0,
        total_questions: 0,
        total_correct: 0
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .insert([newProfile])
        .select()
        .single()
      
      if (error) {
        console.error('Error creating profile in database:', error)
        throw error
      }
      
      // Atualizar o estado local com o perfil criado
      setProfile(data)
      console.log('Profile successfully created in database:', data)
      
      return { data, error: null }
    } catch (error) {
      console.error('Failed to create profile:', error)
      return { data: null, error }
    }
  }

  // Resetar apenas dados de progresso (manter perfil básico)
  const resetProgressData = async () => {
    try {
      if (!user?.id) {
        throw new Error('Usuário não autenticado')
      }

      // 1. Excluir dados de progresso das tabelas relacionadas
      const deletePromises = [
        supabase.from('study_sessions').delete().eq('user_id', user.id),
        supabase.from('user_achievements').delete().eq('user_id', user.id),
        supabase.from('user_section_stats').delete().eq('user_id', user.id),
        supabase.from('user_answers').delete().eq('user_id', user.id),
        supabase.from('user_inventory').delete().eq('user_id', user.id)
      ]

      await Promise.all(deletePromises)

      // 2. Resetar estatísticas no perfil (manter username, avatar, etc.)
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          level: 1,
          xp: 0,
          gold: 100,
          current_streak: 0,
          max_streak: 0,
          total_questions: 0,
          total_correct: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error

      // Atualizar estado local
      setProfile(data)
      console.log('Progress data reset successfully')
      
      return { success: true, error: null }
    } catch (error) {
      console.error('Error resetting progress data:', error)
      return { success: false, error }
    }
  }

  // Excluir completamente todos os dados do CRAM (manter auth.users)
  const deleteAllCramData = async () => {
    try {
      if (!user?.id) {
        throw new Error('Usuário não autenticado')
      }

      console.log('DeleteAllCramData: Starting deletion for user:', user.id)

      // 1. Excluir todos os dados relacionados
      const deletePromises = [
        supabase.from('study_sessions').delete().eq('user_id', user.id),
        supabase.from('user_achievements').delete().eq('user_id', user.id),
        supabase.from('user_section_stats').delete().eq('user_id', user.id),
        supabase.from('user_answers').delete().eq('user_id', user.id),
        supabase.from('user_inventory').delete().eq('user_id', user.id)
      ]

      const results = await Promise.all(deletePromises)
      console.log('DeleteAllCramData: Related data deletion results:', results)

      // 2. Excluir o perfil (por último)
      console.log('DeleteAllCramData: Deleting user profile for ID:', user.id)
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', user.id)
        .select()

      console.log('DeleteAllCramData: Profile deletion result:', { profileData, profileError })

      if (profileError) {
        console.error('DeleteAllCramData: Profile deletion failed:', profileError)
        throw profileError
      }

      // 3. Limpar estado local
      setProfile(null)
      console.log('All CRAM data deleted successfully')
      
      return { success: true, error: null }
    } catch (error) {
      console.error('Error deleting CRAM data:', error)
      return { success: false, error }
    }
  }

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    createProfile,
    fetchProfile,
    resetProgressData,
    deleteAllCramData
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}