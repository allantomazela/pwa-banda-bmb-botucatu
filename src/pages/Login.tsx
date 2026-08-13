import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Music, AlertCircle, KeyRound } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { AuthError } from '@supabase/supabase-js'

type AuthMode = 'login' | 'register' | 'forgot'

export default function Login() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [instrument, setInstrument] = useState('')
  const [regNumber, setRegNumber] = useState('')
  const { signIn, signUp, resetPassword, user, loading } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (user && !submitting && mode !== 'forgot') navigate('/')
  }, [user, submitting, navigate, mode])

  const getErrorMessage = (error: unknown): string => {
    const authError = error as AuthError
    if (authError?.message) {
      if (authError.message.includes('Invalid login credentials')) {
        return 'E-mail ou senha inválidos'
      }
      if (authError.message.includes('Email not confirmed')) {
        return 'E-mail não confirmado. Verifique sua caixa de entrada.'
      }
      if (authError.message.includes('User already registered')) {
        return 'Este e-mail já está cadastrado. Tente fazer login.'
      }
      if (authError.message.includes('Password should be at least')) {
        return 'A senha deve ter pelo menos 6 caracteres.'
      }
      if (
        authError.message.includes('Perfil não encontrado') ||
        authError.message.includes('aguarda aprovação') ||
        authError.message.includes('foi recusado') ||
        authError.message.includes('sem permissão')
      ) {
        return authError.message
      }
      return authError.message
    }
    return 'Não foi possível conectar ao servidor. Tente novamente mais tarde.'
  }

  const validateEmail = (value: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  }

  const switchMode = (next: AuthMode) => {
    setMode(next)
    setErrorMessage(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateEmail(email)) {
      setErrorMessage('Informe um e-mail válido.')
      return
    }

    if (mode !== 'forgot' && !password.trim()) {
      setErrorMessage('Informe a senha.')
      return
    }

    setSubmitting(true)
    try {
      if (mode === 'forgot') {
        const { error } = await resetPassword(email)
        if (error) {
          const msg = getErrorMessage(error)
          setErrorMessage(msg)
          toast({
            title: 'Erro ao enviar recuperação',
            description: msg,
            variant: 'destructive',
          })
        } else {
          setErrorMessage(null)
          toast({
            title: 'E-mail enviado',
            description:
              'Se existir uma conta com este e-mail, você receberá o link para redefinir a senha.',
          })
          switchMode('login')
        }
        return
      }

      if (mode === 'login') {
        const { error } = await signIn(email, password)
        if (error) {
          const msg = getErrorMessage(error)
          setErrorMessage(msg)
          toast({
            title: 'Erro ao entrar',
            description: msg,
            variant: 'destructive',
          })
        } else {
          setErrorMessage(null)
          toast({ title: 'Bem-vindo!', description: 'Login realizado com sucesso.' })
          navigate('/')
        }
        return
      }

      const { error } = await signUp(email, password, {
        full_name: fullName,
        instrument,
        registration_number: regNumber,
      })
      if (error) {
        const msg = getErrorMessage(error)
        setErrorMessage(msg)
        toast({
          title: 'Erro ao cadastrar',
          description: msg,
          variant: 'destructive',
        })
      } else {
        setErrorMessage(null)
        toast({
          title: 'Cadastro enviado!',
          description:
            'Seu pedido foi registrado e aguarda aprovação do administrador antes do primeiro login.',
        })
        switchMode('login')
        setPassword('')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const titles: Record<AuthMode, { title: string; description: string }> = {
    login: {
      title: 'Portal do Aluno',
      description: 'Acesso restrito para membros aprovados da BMB',
    },
    register: {
      title: 'Criar Conta',
      description: 'Cadastre-se e aguarde a aprovação do administrador',
    },
    forgot: {
      title: 'Recuperar senha',
      description: 'Enviaremos um link de redefinição para o seu e-mail',
    },
  }

  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-background p-4">
      <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />

      <Card className="relative z-10 w-full max-w-md animate-fade-in border-white/10 bg-card/80 shadow-2xl backdrop-blur-xl">
        <CardHeader className="space-y-3 pb-6 text-center">
          <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-glow">
            <Music className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">{titles[mode].title}</CardTitle>
          <CardDescription>{titles[mode].description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
            {mode === 'register' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome Completo</Label>
                  <Input
                    id="fullName"
                    placeholder="Seu nome"
                    className="h-12 bg-background/50"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="instrument">Instrumento</Label>
                    <Input
                      id="instrument"
                      placeholder="Ex: Trompete"
                      className="h-12 bg-background/50"
                      value={instrument}
                      onChange={(e) => setInstrument(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="regNumber">Matrícula</Label>
                    <Input
                      id="regNumber"
                      placeholder="BMB-XXXX"
                      className="h-12 bg-background/50"
                      value={regNumber}
                      onChange={(e) => setRegNumber(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                className="h-12 bg-background/50"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {mode !== 'forgot' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="password">Senha</Label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      className="text-xs text-muted-foreground transition-colors hover:text-primary"
                      onClick={() => switchMode('forgot')}
                    >
                      Esqueci minha senha
                    </button>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  className="h-12 bg-background/50"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            )}
            <Button
              type="submit"
              className="h-12 w-full text-base font-bold"
              disabled={loading || submitting}
            >
              {loading || submitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : mode === 'login' ? (
                'Entrar no Portal'
              ) : mode === 'register' ? (
                'Enviar cadastro'
              ) : (
                <>
                  <KeyRound className="mr-2 h-4 w-4" />
                  Enviar link de recuperação
                </>
              )}
            </Button>
            <div className="space-y-2 text-center">
              {mode === 'forgot' ? (
                <button
                  type="button"
                  className="w-full text-sm text-muted-foreground transition-colors hover:text-primary"
                  onClick={() => switchMode('login')}
                >
                  Voltar ao login
                </button>
              ) : (
                <button
                  type="button"
                  className="w-full text-sm text-muted-foreground transition-colors hover:text-primary"
                  onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                >
                  {mode === 'login' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Faça login'}
                </button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
