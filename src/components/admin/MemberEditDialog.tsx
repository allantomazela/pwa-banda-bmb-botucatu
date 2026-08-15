import { useState, useEffect } from 'react'
import type { Profile } from '@/services/profiles'
import { updateProfileAdmin } from '@/services/admin'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AvatarUpload } from '@/components/AvatarUpload'
import { GuardianFields } from '@/components/GuardianFields'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { BRAZILIAN_STATES } from '@/lib/brazilian-states'
import { addYearsToDate, formatCPF, getGuardianValidationError, isMinor } from '@/lib/formatters'

interface MemberEditDialogProps {
  profile: Profile | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void | Promise<void>
}

export function MemberEditDialog({ profile, open, onOpenChange, onSaved }: MemberEditDialogProps) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    full_name: '',
    instrument: '',
    registration_number: '',
    city: '',
    state: '',
    cpf: '',
    rg: '',
    birth_date: '',
    valid_until: '',
    role: 'member',
    avatar_url: '',
    disability_info: '',
    guardian_name: '',
    guardian_phone: '',
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
        valid_until: profile.valid_until ? profile.valid_until.split('T')[0] : '',
        role: profile.role || 'member',
        avatar_url: profile.avatar_url || '',
        disability_info: profile.disability_info || '',
        guardian_name: profile.guardian_name || '',
        guardian_phone: profile.guardian_phone || '',
      })
    }
  }, [profile])

  const set = (f: string, v: string) => setForm((p) => ({ ...p, [f]: v }))

  const handleAvatar = async (url: string) => {
    set('avatar_url', url)
    if (!profile) return
    const { error } = await updateProfileAdmin(profile.id, { avatar_url: url })
    if (error) toast({ title: 'Erro ao salvar foto', description: error, variant: 'destructive' })
  }

  const handleSave = async () => {
    if (!profile) return
    if (!form.full_name.trim()) {
      toast({ title: 'Erro', description: 'O nome é obrigatório.', variant: 'destructive' })
      return
    }
    const guardianError = getGuardianValidationError(
      form.birth_date,
      form.guardian_name,
      form.guardian_phone,
    )
    if (guardianError) {
      toast({ title: 'Dados do responsável', description: guardianError, variant: 'destructive' })
      return
    }
    setSaving(true)
    const { error } = await updateProfileAdmin(profile.id, {
      full_name: form.full_name,
      instrument: form.instrument,
      registration_number: form.registration_number,
      city: form.city,
      state: form.state,
      cpf: form.cpf,
      rg: form.rg,
      birth_date: form.birth_date || null,
      valid_until: form.valid_until || null,
      role: form.role,
      disability_info: form.disability_info || null,
      guardian_name: form.guardian_name.trim() || null,
      guardian_phone: form.guardian_phone.trim() || null,
    })
    setSaving(false)
    if (error) {
      toast({ title: 'Erro', description: error, variant: 'destructive' })
    } else {
      toast({ title: 'Membro atualizado!' })
      await onSaved()
      onOpenChange(false)
    }
  }

  if (!profile) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Membro: {profile.full_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <AvatarUpload
            userId={profile.id}
            currentUrl={form.avatar_url}
            name={form.full_name || 'U'}
            onUploaded={handleAvatar}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="me-name">Nome Completo</Label>
              <Input
                id="me-name"
                value={form.full_name}
                onChange={(e) => set('full_name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="me-instrument">Instrumento</Label>
              <Input
                id="me-instrument"
                value={form.instrument}
                onChange={(e) => set('instrument', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="me-reg">Matrícula (automática)</Label>
              <Input id="me-reg" value={form.registration_number} readOnly className="opacity-80" />
              <p className="text-xs text-muted-foreground">
                Gerada pelo sistema no cadastro. Não editar.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="me-city">Cidade</Label>
              <Input id="me-city" value={form.city} onChange={(e) => set('city', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Estado (UF)</Label>
              <Select value={form.state} onValueChange={(v) => set('state', v)}>
                <SelectTrigger>
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
            <div className="space-y-2">
              <Label htmlFor="me-cpf">CPF</Label>
              <Input
                id="me-cpf"
                value={form.cpf}
                onChange={(e) => set('cpf', formatCPF(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="me-rg">RG</Label>
              <Input id="me-rg" value={form.rg} onChange={(e) => set('rg', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="me-birth">Data de Nascimento</Label>
              <Input
                id="me-birth"
                type="date"
                value={form.birth_date}
                onChange={(e) => set('birth_date', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="me-valid">Validade da Carteirinha</Label>
              <div className="flex gap-2">
                <Input
                  id="me-valid"
                  type="date"
                  value={form.valid_until}
                  onChange={(e) => set('valid_until', e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0"
                  onClick={() => set('valid_until', addYearsToDate(1))}
                >
                  +1 ano
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Identificação institucional válida em todo o território brasileiro junto à Banda
                BMB, até esta data. Não substitui documento oficial.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Função</Label>
              <Select value={form.role} onValueChange={(v) => set('role', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Membro</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="me-disability">Observação de deficiência ou limitação</Label>
            <Textarea
              id="me-disability"
              value={form.disability_info}
              onChange={(e) => set('disability_info', e.target.value)}
              rows={2}
            />
          </div>
          {isMinor(form.birth_date) && (
            <GuardianFields
              idPrefix="me-guardian"
              name={form.guardian_name}
              phone={form.guardian_phone}
              onNameChange={(v) => set('guardian_name', v)}
              onPhoneChange={(v) => set('guardian_phone', v)}
            />
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
