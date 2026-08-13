import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { updateProfile } from '@/services/profiles'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Save, AlertCircle, UserRound } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { BRAZILIAN_STATES } from '@/lib/brazilian-states'
import { formatCPF, isValidCPF } from '@/lib/formatters'
import { AvatarUpload } from '@/components/AvatarUpload'
import { ChangePasswordCard } from '@/components/portal/ChangePasswordCard'

export default function ProfileSettings() {
  const { user, profile, refreshProfile } = useAuth()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [cpfError, setCpfError] = useState(false)
  const [form, setForm] = useState({
    full_name: '',
    instrument: '',
    registration_number: '',
    city: '',
    state: '',
    cpf: '',
    rg: '',
    birth_date: '',
    avatar_url: '',
    disability_info: '',
  })

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        instrument: profile.instrument || '',
        registration_number: profile.registration_number || '',
        city: profile.city || '',
        state: profile.state || '',
        cpf: profile.cpf || '',
        rg: profile.rg || '',
        birth_date: profile.birth_date ? profile.birth_date.split('T')[0] : '',
        avatar_url: profile.avatar_url || '',
        disability_info: profile.disability_info || '',
      })
    }
  }, [profile])

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleCpfChange = (value: string) => {
    const formatted = formatCPF(value)
    handleChange('cpf', formatted)
    setCpfError(!isValidCPF(formatted))
  }

  const handleAvatarUploaded = async (url: string) => {
    if (!user) return
    handleChange('avatar_url', url)
    const { error } = await updateProfile(user.id, { avatar_url: url })
    if (error) {
      toast({ title: 'Erro ao salvar foto', description: error, variant: 'destructive' })
    } else {
      await refreshProfile()
      toast({ title: 'Foto atualizada!', description: 'Sua foto de perfil foi salva com sucesso.' })
    }
  }

  const handleSave = async () => {
    if (!user) return
    if (form.cpf && !isValidCPF(form.cpf)) {
      setCpfError(true)
      toast({
        title: 'CPF inválido',
        description: 'Verifique o formato do CPF.',
        variant: 'destructive',
      })
      return
    }
    setSaving(true)
    const { error } = await updateProfile(user.id, {
      full_name: form.full_name,
      instrument: form.instrument,
      registration_number: form.registration_number,
      city: form.city,
      state: form.state,
      cpf: form.cpf,
      rg: form.rg,
      birth_date: form.birth_date || null,
      avatar_url: form.avatar_url,
      disability_info: form.disability_info || null,
    })
    setSaving(false)
    if (error) {
      toast({ title: 'Erro ao salvar', description: error, variant: 'destructive' })
    } else {
      await refreshProfile()
      toast({
        title: 'Perfil atualizado!',
        description: 'Suas informações foram salvas com sucesso.',
      })
    }
  }

  if (!profile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
      </div>
    )
  }

  const MANDATORY_FIELDS: (keyof typeof form)[] = [
    'full_name',
    'instrument',
    'registration_number',
    'city',
    'state',
    'cpf',
    'rg',
    'birth_date',
    'avatar_url',
  ]
  const filledCount = MANDATORY_FIELDS.filter(
    (f) => form[f] && String(form[f]).trim() !== '',
  ).length
  const completion = Math.round((filledCount / MANDATORY_FIELDS.length) * 100)

  return (
    <div className="mx-auto max-w-3xl animate-fade-in space-y-6 p-6 lg:p-10">
      <header className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-primary/10 via-card/60 to-transparent p-6">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
        <div className="relative flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <UserRound className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">Editar Perfil</h1>
            <p className="mt-1 text-muted-foreground">
              Atualize seus dados pessoais, foto e senha de acesso.
            </p>
          </div>
        </div>
      </header>

      <Card className="border-white/10 bg-card/50">
        <CardContent className="space-y-2 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Completude do Perfil</span>
            <span className="font-bold text-primary">{completion}%</span>
          </div>
          <Progress value={completion} className="h-2" />
          {completion < 100 && (
            <p className="text-xs text-muted-foreground">
              Preencha todos os campos obrigatórios para ter um perfil completo.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-white/10 bg-gradient-to-br from-card/90 to-card/40 shadow-subtle">
        <CardHeader className="border-b border-white/5 bg-white/[0.02]">
          <CardTitle>Informações Pessoais</CardTitle>
          <CardDescription>Estes dados aparecem em sua carteirinha digital.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {user && (
            <AvatarUpload
              userId={user.id}
              currentUrl={form.avatar_url}
              name={form.full_name || 'U'}
              onUploaded={handleAvatarUploaded}
            />
          )}
          <div className="space-y-2">
            <Label htmlFor="full_name">Nome Completo</Label>
            <Input
              id="full_name"
              value={form.full_name}
              onChange={(e) => handleChange('full_name', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="instrument">Instrumento</Label>
              <Input
                id="instrument"
                value={form.instrument}
                onChange={(e) => handleChange('instrument', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registration_number">
                Matrícula
                {profile?.role !== 'admin' && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    (gerenciado pelo admin)
                  </span>
                )}
              </Label>
              <Input
                id="registration_number"
                value={form.registration_number}
                onChange={(e) => handleChange('registration_number', e.target.value)}
                disabled={profile?.role !== 'admin'}
                className={profile?.role !== 'admin' ? 'cursor-not-allowed opacity-60' : ''}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                placeholder="Ex: Botucatu"
                value={form.city}
                onChange={(e) => handleChange('city', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">Estado (UF)</Label>
              <Select value={form.state} onValueChange={(v) => handleChange('state', v)}>
                <SelectTrigger id="state">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {BRAZILIAN_STATES.map((s) => (
                    <SelectItem key={s.uf} value={s.uf}>
                      {s.uf} — {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                placeholder="000.000.000-00"
                value={form.cpf}
                onChange={(e) => handleCpfChange(e.target.value)}
                className={cpfError ? 'border-destructive' : ''}
              />
              {cpfError && (
                <p className="flex items-center gap-1 text-xs text-destructive">
                  <AlertCircle className="h-3 w-3" /> CPF inválido
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="rg">RG</Label>
              <Input
                id="rg"
                placeholder="00.000.000-0"
                value={form.rg}
                onChange={(e) => handleChange('rg', e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="birth_date">Data de Nascimento</Label>
            <Input
              id="birth_date"
              type="date"
              value={form.birth_date}
              onChange={(e) => handleChange('birth_date', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="disability_info">
              Observação de deficiência ou limitação de mobilidade
            </Label>
            <Textarea
              id="disability_info"
              placeholder="Descreva qualquer deficiência ou limitação de mobilidade que precise ser informada à organização."
              value={form.disability_info}
              onChange={(e) => handleChange('disability_info', e.target.value)}
              rows={3}
            />
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar Alterações
          </Button>
        </CardContent>
      </Card>

      <ChangePasswordCard />
    </div>
  )
}
