import { useAuth as useSupabaseAuth, AuthProvider } from '@/hooks/use-auth'

export { AuthProvider }

export function useAuth() {
  const auth = useSupabaseAuth()
  return {
    ...auth,
    isLoading: auth.loading,
    login: async (email: string, password = '') => auth.signIn(email, password),
    logout: () => {
      auth.signOut()
    },
    user: auth.profile
      ? {
          id: auth.profile.id,
          full_name: auth.profile.full_name,
          instrument: auth.profile.instrument,
          enrollment_id: auth.profile.registration_number,
          avatar_url: auth.profile.avatar_url,
          role: 'student' as const,
        }
      : null,
  }
}
