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
import { Loader2, Save, AlertCircle } from 'lucide-react'
import { BRAZILIAN_STATES } from '@/lib/brazilian-states'
import { formatCPF, isValidCPF } from '@/lib/formatters'
import { AvatarUpload } from '@/components/AvatarUpload'

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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-10 max-w-3xl mx-auto space-y-6 animate-fade-in">
      <header>
        <h1 className="text-3xl font-bold font-display">Editar Perfil</h1>
        <p className="text-muted-foreground">
          Atualize suas informações pessoais e de identificação.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Informações Pessoais</CardTitle>
          <CardDescription>Estes dados aparecem em sua carteirinha digital.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="instrument">Instrumento</Label>
              <Input
                id="instrument"
                value={form.instrument}
                onChange={(e) => handleChange('instrument', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registration_number">Matrícula</Label>
              <Input
                id="registration_number"
                value={form.registration_number}
                onChange={(e) => handleChange('registration_number', e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> CPF inválido
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
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : (
          <Save className="w-4 h-4 mr-2" />
        )}
        Salvar Alterações
      </Button>
    </div>
  )
}
