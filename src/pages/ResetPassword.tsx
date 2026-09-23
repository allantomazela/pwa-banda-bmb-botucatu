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

export default function ResetPassword() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        if (active) setReady(true)
      }
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && active) setReady(true)
    })

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
    const { error } = await supabase.auth.updateUser({ password })
    setSubmitting(false)

    if (error) {
      setErrorMessage(error.message)
      toast({
        title: 'Erro ao redefinir senha',
        description: error.message,
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
            {ready
              ? 'Escolha uma nova senha para acessar o portal.'
              : 'Abra o link enviado por e-mail para continuar.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!ready ? (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Link inválido ou expirado. Solicite uma nova recuperação.
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
