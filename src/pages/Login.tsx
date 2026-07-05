import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Music, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { AuthError } from '@supabase/supabase-js'

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [instrument, setInstrument] = useState('')
  const [regNumber, setRegNumber] = useState('')
  const { signIn, signUp, user, loading } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (user && !submitting) navigate('/')
  }, [user, submitting, navigate])
  const getErrorMessage = (error: unknown): string => {
    const authError = error as AuthError
    if (authError?.message) {
      if (
        authError.message.includes('Invalid login credentials') ||
        authError.message.includes('Email not confirmed') ||
        authError.message.includes('User already registered') ||
        authError.message.includes('Password should be at least')
      ) {
        return 'E-mail ou senha inválidos'
      }
      return 'E-mail ou senha inválidos'
    }
    return 'Não foi possível conectar ao servidor. Tente novamente mais tarde.'
  }

  const validateEmail = (value: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateEmail(email)) {
      setErrorMessage('E-mail ou senha inválidos')
      return
    }
    if (!password.trim()) {
      setErrorMessage('E-mail ou senha inválidos')
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
    } else {
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
          title: 'Conta criada!',
          description:
            'Verifique seu e-mail para confirmar o cadastro, ou faça login se a confirmação não for necessária.',
        })
        setMode('login')
      }
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center p-4 bg-background relative overflow-hidden">
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <Card className="w-full max-w-md bg-card/80 backdrop-blur-xl border-white/10 shadow-2xl relative z-10 animate-fade-in">
        <CardHeader className="space-y-3 text-center pb-6">
          <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-2 shadow-glow">
            <Music className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {mode === 'login' ? 'Portal do Aluno' : 'Criar Conta'}
          </CardTitle>
          <CardDescription>
            {mode === 'login'
              ? 'Acesso restrito para membros da BMB'
              : 'Cadastre-se como membro da BMB'}
          </CardDescription>
          {mode === 'login' && (
            <p className="text-xs text-muted-foreground pt-1">
              Demonstração: allantomazela@gmail.com / Skip@Pass
            </p>
          )}
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
                    className="bg-background/50 h-12"
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
                      className="bg-background/50 h-12"
                      value={instrument}
                      onChange={(e) => setInstrument(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="regNumber">Matricula</Label>
                    <Input
                      id="regNumber"
                      placeholder="BMB-XXXX"
                      className="bg-background/50 h-12"
                      value={regNumber}
                      onChange={(e) => setRegNumber(e.target.value)}
                      required
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
                className="bg-background/50 h-12"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                className="bg-background/50 h-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 font-bold text-base"
              disabled={loading || submitting}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : mode === 'login' ? (
                'Entrar no Portal'
              ) : (
                'Criar Conta'
              )}
            </Button>
            <button
              type="button"
              className="w-full text-sm text-muted-foreground hover:text-primary transition-colors"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login')
                setErrorMessage(null)
              }}
            >
              {mode === 'login' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Faça login'}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
