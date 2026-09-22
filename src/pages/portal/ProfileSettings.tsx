import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { updateProfile } from '@/services/profiles'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Save, AlertCircle, UserRound } from 'lucide-react'
import { getProfileCompletion } from '@/lib/profile-completion'
import { Progress } from '@/components/ui/progress'
import { BRAZILIAN_STATES } from '@/lib/brazilian-states'
import { formatCPF, formatPhoneBR, getEmergencyContactsValidationError, isMinor, isValidCPF } from '@/lib/formatters'
import { AvatarUpload } from '@/components/AvatarUpload'
import { EmergencyContactsFields } from '@/components/EmergencyContactsFields'
import { ImageConsentCard } from '@/components/portal/ImageConsentCard'
import { normalizeEmergencyContacts, type EmergencyContact } from '@/lib/image-consent'
import {
  HealthFields,
  healthFormFromProfile,
  healthPayloadFromForm,
  type HealthFormValues,
} from '@/components/HealthFields'
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
    guardian_name: '',
    guardian_phone: '',
    phone: '',
    ...healthFormFromProfile({}),
  })
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
    { name: '', phone: '', relationship: 'Responsável legal' },
  ])

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
        guardian_name: profile.guardian_name || '',
        guardian_phone: profile.guardian_phone || '',
        phone: profile.phone || '',
        ...healthFormFromProfile(profile),
      })
      const contacts = normalizeEmergencyContacts(profile.emergency_contacts, {
        name: profile.guardian_name,
        phone: profile.guardian_phone,
      })
      setEmergencyContacts(
        contacts.length > 0
          ? contacts
          : [{ name: '', phone: '', relationship: 'Responsável legal' }],
      )
    }
  }, [profile])

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleHealthChange = (field: keyof HealthFormValues, value: string) => {
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
    const contactsError = getEmergencyContactsValidationError(form.birth_date, emergencyContacts)
    if (contactsError) {
      toast({ title: 'Dados do responsável', description: contactsError, variant: 'destructive' })
      return
    }
    const primary = emergencyContacts[0]
    setSaving(true)
    const { error } = await updateProfile(user.id, {
      full_name: form.full_name,
      instrument: form.instrument,
      city: form.city,
      state: form.state,
      cpf: form.cpf,
      rg: form.rg,
      birth_date: form.birth_date || null,
      avatar_url: form.avatar_url,
      guardian_name: primary?.name?.trim() || null,
      guardian_phone: primary?.phone?.trim() || null,
      phone: form.phone.trim() || '',
      emergency_contacts: emergencyContacts
        .filter((c) => c.name.trim())
        .map((c) => ({
          name: c.name.trim(),
          phone: c.phone.trim(),
          relationship: (c.relationship || 'Responsável').trim(),
        })),
      ...healthPayloadFromForm(form),
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

  const completion = getProfileCompletion({
    role: profile.role,
    full_name: form.full_name,
    instrument: form.instrument,
    registration_number: form.registration_number,
    city: form.city,
    state: form.state,
    cpf: form.cpf,
    rg: form.rg,
    birth_date: form.birth_date,
    avatar_url: form.avatar_url,
    guardian_name: emergencyContacts[0]?.name || form.guardian_name,
    guardian_phone: emergencyContacts[0]?.phone || form.guardian_phone,
    image_consent_status: profile.image_consent_status,
  })
  const minor = isMinor(form.birth_date)

  return (
    <div className="mx-auto max-w-3xl animate-fade-in space-y-6 p-4 sm:p-6 lg:p-10">
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
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Completude do perfil</CardTitle>
          <CardDescription>
            Progresso: <span className="font-bold text-primary">{completion.percent}%</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={completion.percent} className="h-2" />
          {!completion.isComplete && (
            <p className="flex items-start gap-2 text-sm text-amber-200/90">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              Faltam: {completion.missingLabels.join(', ')}. Preencha para manter a carteirinha
              completa.
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
              <Label htmlFor="registration_number">Matrícula</Label>
              <Input
                id="registration_number"
                value={form.registration_number}
                disabled
                className="cursor-not-allowed opacity-60"
              />
              <p className="text-xs text-muted-foreground">Gerada automaticamente pelo sistema.</p>
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
              <Label htmlFor="phone">Telefone de contato</Label>
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                value={form.phone}
                onChange={(e) => handleChange('phone', formatPhoneBR(e.target.value))}
                placeholder="(14) 99999-0000"
                className="h-11"
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            <Label htmlFor="valid_until">Validade da carteirinha</Label>
            <Input
              id="valid_until"
              type="date"
              value={profile.valid_until ? profile.valid_until.split('T')[0] : ''}
              disabled
              className="cursor-not-allowed opacity-60"
            />
            <p className="text-xs text-muted-foreground">Definida pelo administrador.</p>
          </div>
          </div>
          <HealthFields values={form} onChange={handleHealthChange} />
          {minor && (
            <EmergencyContactsFields
              contacts={emergencyContacts}
              onChange={setEmergencyContacts}
              max={3}
            />
          )}

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

      <ImageConsentCard
        profileId={profile.id}
        birthDate={form.birth_date || null}
        fullName={form.full_name}
        status={profile.image_consent_status}
        consentByName={profile.image_consent_by_name}
        consentAt={profile.image_consent_at}
        onUpdated={refreshProfile}
      />

      <ChangePasswordCard />
    </div>
  )
}
