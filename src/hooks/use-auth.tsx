import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'

export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export interface Profile {
  id: string
  full_name: string
  instrument: string
  registration_number: string
  avatar_url: string
  birth_date: string | null
  valid_until: string | null
  city: string
  state: string
  cpf: string
  disability_info: string | null
  rg: string
  role: string
  email: string
  approval_status: ApprovalStatus
  approved_at: string | null
  approved_by: string | null
  updated_at: string
  guardian_name: string | null
  guardian_phone: string | null
}

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  signUp: (
    email: string,
    password: string,
    metadata?: Record<string, string>,
  ) => Promise<{ error: AuthError | null }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
  loading: boolean
  profileLoading: boolean
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

function asAuthError(message: string): AuthError {
  return { message, name: 'AuthError', status: 403 } as AuthError
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (user) {
      setProfileLoading(true)
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        .then(async ({ data, error }) => {
          if (!error && data) {
            const next = data as Profile
            if (
              next.approval_status &&
              next.approval_status !== 'approved' &&
              !window.location.pathname.startsWith('/redefinir-senha')
            ) {
              await supabase.auth.signOut()
              setProfile(null)
            } else {
              setProfile(next)
            }
          }
          setProfileLoading(false)
        })
    } else {
      setProfile(null)
    }
  }, [user])

  const refreshProfile = useCallback(async () => {
    if (!user) return
    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (!error && data) {
      setProfile(data as Profile)
    }
  }, [user])

  const signUp = async (email: string, password: string, metadata?: Record<string, string>) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: metadata,
      },
    })
    if (error) return { error }

    // Cadastro fica pendente de aprovação — não manter sessão ativa
    if (data.session) {
      await supabase.auth.signOut()
    }

    return { error: null }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error }

    if (data.user) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, approval_status, role')
        .eq('id', data.user.id)
        .maybeSingle()

      if (profileError || !profileData) {
        await supabase.auth.signOut()
        return { error: asAuthError('Perfil não encontrado. Contate o administrador.') }
      }

      if (profileData.approval_status === 'pending') {
        await supabase.auth.signOut()
        return {
          error: asAuthError(
            'Seu cadastro ainda aguarda aprovação do administrador. Você receberá acesso após a liberação.',
          ),
        }
      }

      if (profileData.approval_status === 'rejected') {
        await supabase.auth.signOut()
        return {
          error: asAuthError(
            'Seu cadastro foi recusado. Entre em contato com a administração da Banda BMB.',
          ),
        }
      }

      if (profileData.approval_status !== 'approved') {
        await supabase.auth.signOut()
        return { error: asAuthError('Conta sem permissão de acesso. Contate o administrador.') }
      }
    }

    return { error: null }
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    })
    return { error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        signUp,
        signIn,
        signOut,
        resetPassword,
        loading,
        profileLoading,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
