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
        fetchProfile(session.user.id)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription?.unsubscribe()
  }, [])

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) {
        // Se o usuário não existe, criar um perfil padrão
        if (error.code === 'PGRST116' || error.status === 406) {
          console.log('User profile not found, creating default profile')
          const defaultProfile = createMockProfile(userId)
          setProfile(defaultProfile)
          
          // Em produção, criar perfil no banco de dados
          if (process.env.NODE_ENV === 'production') {
            try {
              await createProfile({
                username: 'Novo Usuário',
                avatar_class: 'estudante',
                avatar_gender: 'masculino'
              })
            } catch (createError) {
              console.log('Could not create profile in database, using default profile')
            }
          }
          return
        }
        
        console.error('Error fetching profile:', error)
        
        // Criar perfil padrão para usuários novos em qualquer ambiente
        console.log('Creating default profile for new user')
        const defaultProfile = createMockProfile(userId)
        setProfile(defaultProfile)
        
        // Em produção, tentar criar perfil no banco de dados
        if (process.env.NODE_ENV === 'production') {
          try {
            await createProfile({
              username: 'Novo Usuário',
              avatar_class: 'estudante', 
              avatar_gender: 'masculino'
            })
          } catch (createError) {
            console.log('Could not create profile in database, using default profile')
          }
        }
        return
      }
      
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
      
      // Criar perfil padrão para usuários novos (desenvolvimento e produção)
      console.log('Creating default profile for new user')
      const defaultProfile = createMockProfile(userId)
      setProfile(defaultProfile)
      
      // Em produção, criar perfil no banco de dados
      if (process.env.NODE_ENV === 'production') {
        try {
          await createProfile({
            username: 'Novo Usuário',
            avatar_class: 'estudante',
            avatar_gender: 'masculino'
          })
        } catch (createError) {
          console.log('Could not create profile in database, using default profile')
        }
      }
    }
  }

  // Criar perfil mock para desenvolvimento
  const createMockProfile = (userId) => {
    return {
      id: userId,
      username: 'dev_user',
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
      updated_at: new Date().toISOString()
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
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setLoading(false)
    }
  }

  const createProfile = async (profileData) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert([{
          id: user.id,
          ...profileData
        }])
        .select()
        .single()
      
      if (error) throw error
      setProfile(data)
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
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
    fetchProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}