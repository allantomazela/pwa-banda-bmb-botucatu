import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatPhoneBR } from '@/lib/formatters'

interface GuardianFieldsProps {
  name: string
  phone: string
  onNameChange: (value: string) => void
  onPhoneChange: (value: string) => void
  idPrefix?: string
}

export function GuardianFields({
  name,
  phone,
  onNameChange,
  onPhoneChange,
  idPrefix = 'guardian',
}: GuardianFieldsProps) {
  const nameId = `${idPrefix}-name`
  const phoneId = `${idPrefix}-phone`

  return (
    <div className="grid grid-cols-1 gap-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 sm:grid-cols-2">
      <div className="space-y-2 sm:col-span-2">
        <p className="text-sm font-medium text-amber-200">Responsável (menor de idade)</p>
        <p className="text-xs text-muted-foreground">
          Obrigatório para alunos com menos de 18 anos. Aparece na carteirinha e no contato de
          emergência.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor={nameId}>Nome do responsável</Label>
        <Input
          id={nameId}
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Nome completo do responsável"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={phoneId}>Telefone de contato</Label>
        <Input
          id={phoneId}
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => onPhoneChange(formatPhoneBR(e.target.value))}
          placeholder="(14) 99999-0000"
          required
        />
      </div>
    </div>
  )
}
