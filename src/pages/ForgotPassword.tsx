import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { BrandMark } from '@/components/BrandMark'
import { useToast } from '@/hooks/use-toast'
import { AlertCircle, ArrowLeft, KeyRound, Loader2 } from 'lucide-react'
import type { AuthError } from '@supabase/supabase-js'

export default function ForgotPassword() {
  const { resetPassword } = useAuth()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!validateEmail(email)) {
      setErrorMessage('Informe um e-mail válido.')
      return
    }

    setSubmitting(true)
    const { error } = await resetPassword(email.trim())
    setSubmitting(false)

    if (error) {
      const msg = (error as AuthError).message || 'Não foi possível enviar o e-mail.'
      setErrorMessage(msg)
      toast({
        title: 'Erro ao enviar recuperação',
        description: msg,
        variant: 'destructive',
      })
      return
    }

    setSent(true)
    toast({
      title: 'E-mail enviado',
      description:
        'Se existir uma conta com este e-mail, você receberá o link para redefinir a senha.',
    })
  }

  return (
    <div className="relative flex min-h-dvh flex-1 items-center justify-center overflow-x-clip bg-background p-4 pb-safe px-safe">
      <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />

      <Card className="relative z-10 w-full max-w-md animate-fade-in border-white/10 bg-card/80 shadow-2xl backdrop-blur-xl">
        <CardHeader className="space-y-3 pb-6 text-center">
          <BrandMark variant="login" />
          <CardTitle className="text-2xl font-bold">Recuperar senha</CardTitle>
          <CardDescription>
            Informe o e-mail da sua conta. Enviaremos um link seguro para criar uma nova senha.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
                <KeyRound className="h-6 w-6" />
              </div>
              <p className="text-sm text-muted-foreground">
                Verifique sua caixa de entrada (e o spam). O link expira em alguns minutos.
              </p>
              <Button asChild className="h-11 w-full">
                <Link to="/login">Voltar ao login</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="recovery-email">E-mail</Label>
                <Input
                  id="recovery-email"
                  type="email"
                  autoComplete="email"
                  placeholder="seu@email.com"
                  className="h-12 bg-background/50"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="h-12 w-full text-base font-bold" disabled={submitting}>
                {submitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <KeyRound className="mr-2 h-4 w-4" />
                    Enviar link de recuperação
                  </>
                )}
              </Button>

              <Button asChild variant="ghost" className="h-11 w-full text-muted-foreground">
                <Link to="/login">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar ao login
                </Link>
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
