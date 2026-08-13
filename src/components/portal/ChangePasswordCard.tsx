import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Eye, EyeOff, KeyRound, Loader2, Lock } from 'lucide-react'

const MIN_PASSWORD_LENGTH = 8

export function ChangePasswordCard() {
  const { toast } = useToast()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)

  const resetForm = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos de senha.',
        variant: 'destructive',
      })
      return
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      toast({
        title: 'Senha fraca',
        description: `A nova senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`,
        variant: 'destructive',
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Senhas diferentes',
        description: 'A confirmação não coincide com a nova senha.',
        variant: 'destructive',
      })
      return
    }

    if (currentPassword === newPassword) {
      toast({
        title: 'Senha inválida',
        description: 'A nova senha deve ser diferente da senha atual.',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user?.email) {
      setSaving(false)
      toast({
        title: 'Sessão inválida',
        description: 'Faça login novamente e tente de novo.',
        variant: 'destructive',
      })
      return
    }

    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })

    if (reauthError) {
      setSaving(false)
      toast({
        title: 'Senha atual incorreta',
        description: 'Verifique a senha atual e tente novamente.',
        variant: 'destructive',
      })
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })

    setSaving(false)

    if (updateError) {
      toast({
        title: 'Erro ao trocar senha',
        description: updateError.message,
        variant: 'destructive',
      })
      return
    }

    resetForm()
    toast({
      title: 'Senha atualizada!',
      description: 'Sua nova senha já está ativa.',
    })
  }

  return (
    <Card className="overflow-hidden border-white/10 bg-gradient-to-br from-card/90 to-card/40 shadow-subtle">
      <CardHeader className="border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg">Trocar senha</CardTitle>
            <CardDescription>Proteja sua conta com uma senha forte e exclusiva.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current_password">Senha atual</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="current_password"
                type={showCurrent ? 'text' : 'password'}
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="pl-9 pr-10"
                placeholder="Digite sua senha atual"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowCurrent((v) => !v)}
                aria-label={showCurrent ? 'Ocultar senha atual' : 'Mostrar senha atual'}
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new_password">Nova senha</Label>
              <div className="relative">
                <Input
                  id="new_password"
                  type={showNew ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10"
                  placeholder={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres`}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowNew((v) => !v)}
                  aria-label={showNew ? 'Ocultar nova senha' : 'Mostrar nova senha'}
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirmar nova senha</Label>
              <Input
                id="confirm_password"
                type={showNew ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
              />
            </div>
          </div>

          <Button type="submit" disabled={saving} className="w-full sm:w-auto">
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <KeyRound className="mr-2 h-4 w-4" />
            )}
            Atualizar senha
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
