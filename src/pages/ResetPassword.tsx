import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PasswordInput } from '@/components/PasswordInput'
import { BrandMark } from '@/components/BrandMark'
import { useToast } from '@/hooks/use-toast'
import { AlertCircle, KeyRound, Loader2 } from 'lucide-react'

function mapPasswordUpdateError(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('session missing') || lower.includes('not authenticated')) {
    return 'Sessão de recuperação expirada ou inválida. Solicite um novo link e abra-o neste mesmo navegador.'
  }
  if (lower.includes('same') || lower.includes('different from the old')) {
    return 'A nova senha precisa ser diferente da senha atual.'
  }
  if (lower.includes('weak') || lower.includes('pwned') || lower.includes('leaked')) {
    return 'Essa senha é considerada insegura. Escolha outra com pelo menos 8 caracteres.'
  }
  if (lower.includes('at least') || lower.includes('characters')) {
    return 'A nova senha deve ter pelo menos 8 caracteres.'
  }
  return message
}

async function establishRecoverySession(): Promise<{ ok: boolean; error?: string }> {
  const url = new URL(window.location.href)
  const code = url.searchParams.get('code')
  const errorDescription =
    url.searchParams.get('error_description') || url.searchParams.get('error')

  if (errorDescription) {
    return { ok: false, error: decodeURIComponent(errorDescription.replace(/\+/g, ' ')) }
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return { ok: false, error: mapPasswordUpdateError(error.message) }
    }
    // Limpa o code da URL para não reutilizar / exibir token
    url.searchParams.delete('code')
    window.history.replaceState({}, document.title, `${url.pathname}${url.search}`)
    return { ok: true }
  }

  // Fluxo implícito (hash com access_token) — raro, mas ainda aparece em alguns links
  const hash = window.location.hash.replace(/^#/, '')
  if (hash) {
    const params = new URLSearchParams(hash)
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')
    const type = params.get('type')
    if (accessToken && refreshToken && (type === 'recovery' || !type)) {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })
      if (error) {
        return { ok: false, error: mapPasswordUpdateError(error.message) }
      }
      window.history.replaceState({}, document.title, window.location.pathname)
      return { ok: true }
    }
  }

  const { data } = await supabase.auth.getSession()
  if (data.session) return { ok: true }

  return {
    ok: false,
    error: 'Link inválido ou expirado. Solicite uma nova recuperação.',
  }
}

export default function ResetPassword() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [checking, setChecking] = useState(true)
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setReady(true)
        setChecking(false)
        setErrorMessage(null)
      }
      if (event === 'SIGNED_OUT') {
        setReady(false)
      }
    })

    void (async () => {
      const result = await establishRecoverySession()
      if (!active) return
      if (result.ok) {
        setReady(true)
        setErrorMessage(null)
      } else {
        setReady(false)
        setErrorMessage(result.error ?? 'Link inválido ou expirado.')
      }
      setChecking(false)
    })()

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (password.length < 8) {
      setErrorMessage('A nova senha deve ter pelo menos 8 caracteres.')
      return
    }
    if (password !== confirm) {
      setErrorMessage('A confirmação não coincide com a nova senha.')
      return
    }

    setSubmitting(true)

    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session) {
      setSubmitting(false)
      setReady(false)
      const msg =
        'Sessão de recuperação expirada. Solicite um novo link e abra-o neste mesmo navegador.'
      setErrorMessage(msg)
      toast({
        title: 'Erro ao redefinir senha',
        description: msg,
        variant: 'destructive',
      })
      return
    }

    const { error } = await supabase.auth.updateUser({ password })
    setSubmitting(false)

    if (error) {
      const msg = mapPasswordUpdateError(error.message)
      setErrorMessage(msg)
      toast({
        title: 'Erro ao redefinir senha',
        description: msg,
        variant: 'destructive',
      })
      return
    }

    toast({
      title: 'Senha redefinida!',
      description: 'Faça login com a nova senha.',
    })
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="relative flex min-h-dvh flex-1 items-center justify-center overflow-x-clip bg-background p-4 pb-safe px-safe">
      <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <Card className="relative z-10 w-full max-w-md border-white/10 bg-card/80 shadow-2xl backdrop-blur-xl">
        <CardHeader className="space-y-3 pb-6 text-center">
          <BrandMark variant="login" />
          <CardTitle className="text-2xl font-bold">Redefinir senha</CardTitle>
          <CardDescription>
            {checking
              ? 'Validando o link de recuperação…'
              : ready
                ? 'Escolha uma nova senha para acessar o portal.'
                : 'Abra o link enviado por e-mail para continuar.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {checking ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !ready ? (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {errorMessage || 'Link inválido ou expirado. Solicite uma nova recuperação.'}
                </AlertDescription>
              </Alert>
              <Button asChild className="h-11 w-full">
                <Link to="/recuperar-senha">Solicitar novo link</Link>
              </Button>
              <Button asChild variant="ghost" className="h-11 w-full">
                <Link to="/login">Voltar ao login</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="password">Nova senha</Label>
                <PasswordInput
                  id="password"
                  autoComplete="new-password"
                  className="h-12 bg-background/50"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirmar nova senha</Label>
                <PasswordInput
                  id="confirm"
                  autoComplete="new-password"
                  className="h-12 bg-background/50"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                className="h-12 w-full text-base font-bold"
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <KeyRound className="mr-2 h-4 w-4" />
                    Salvar nova senha
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
