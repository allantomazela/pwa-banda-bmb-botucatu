import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { isFatalAuthError } from '@/lib/supabase/session-recovery'

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
  health_problems: string | null
  continuous_medications: string | null
  diseases: string | null
  surgeries: string | null
  dietary_restrictions: string | null
  rg: string
  role: string
  email: string
  approval_status: ApprovalStatus
  approved_at: string | null
  approved_by: string | null
  updated_at: string
  guardian_name: string | null
  guardian_phone: string | null
  phone?: string | null
  emergency_contacts?: Array<{ name: string; phone: string; relationship?: string }> | null
  image_consent_status?: string | null
  image_consent_at?: string | null
  image_consent_by_name?: string | null
  image_consent_by_role?: string | null
  image_consent_version?: string | null
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
  signUpGuardian: (
    email: string,
    password: string,
    fullName: string,
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
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setUser(nextSession?.user ?? null)
      setLoading(false)
    })

    // Restaura sessão do localStorage e renova o access token se precisar.
    // Não desloga por falha de rede ou token só expirado — só se o refresh for inválido.
    void (async () => {
      const params = new URLSearchParams(window.location.search)
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
      const authRecoveryCallback =
        window.location.pathname.startsWith('/redefinir-senha') ||
        params.has('code') ||
        hashParams.get('type') === 'recovery'

      const { data: sessionData } = await supabase.auth.getSession()
      let localSession = sessionData.session

      if (localSession && !authRecoveryCallback) {
        const expiresAtMs = (localSession.expires_at ?? 0) * 1000
        const needsRefresh = expiresAtMs < Date.now() + 60_000

        if (needsRefresh) {
          const { data: refreshed, error } = await supabase.auth.refreshSession()
          if (refreshed.session) {
            localSession = refreshed.session
          } else if (isFatalAuthError(error)) {
            await supabase.auth.signOut({ scope: 'local' })
            setSession(null)
            setUser(null)
            setLoading(false)
            return
          }
          // Rede/instabilidade: mantém a sessão local; autoRefreshToken tenta de novo.
        }
      }

      setSession(localSession)
      setUser(localSession?.user ?? null)
      setLoading(false)
    })()

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
              !window.location.pathname.startsWith('/redefinir-senha') &&
              !window.location.pathname.startsWith('/recuperar-senha') &&
              !new URLSearchParams(window.location.search).has('code') &&
              new URLSearchParams(window.location.hash.replace(/^#/, '')).get('type') !==
                'recovery'
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
      // Ativa convites de responsável pendentes para este e-mail
      await supabase.rpc('activate_guardian_invites')

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

  const signUpGuardian = async (
    email: string,
    password: string,
    fullName: string,
  ): Promise<{ error: AuthError | null }> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: {
          full_name: fullName.trim(),
          signup_as: 'guardian',
        },
      },
    })
    if (error) return { error }

    // Cadastro de responsável também aguarda aprovação — não manter sessão
    if (data.session) {
      await supabase.auth.signOut()
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
        signUpGuardian,
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
