import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'

/**
 * Se o Auth redirecionar para a Home (Site URL) com o code de recovery,
 * envia o usuário para /redefinir-senha onde a senha pode ser definida.
 */
export function PasswordRecoveryRedirect() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event !== 'PASSWORD_RECOVERY') return
      if (location.pathname.startsWith('/redefinir-senha')) return
      navigate('/redefinir-senha', { replace: true })
    })

    return () => subscription.unsubscribe()
  }, [navigate, location.pathname])

  return null
}
