import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatPhoneBR } from '@/lib/formatters'
import type { EmergencyContact } from '@/lib/image-consent'
import { Plus, Trash2 } from 'lucide-react'

type Props = {
  contacts: EmergencyContact[]
  onChange: (contacts: EmergencyContact[]) => void
  max?: number
}

export function EmergencyContactsFields({ contacts, onChange, max = 3 }: Props) {
  const setAt = (index: number, patch: Partial<EmergencyContact>) => {
    onChange(contacts.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  const add = () => {
    if (contacts.length >= max) return
    onChange([...contacts, { name: '', phone: '', relationship: 'Responsável legal' }])
  }

  const remove = (index: number) => {
    onChange(contacts.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
      <div>
        <p className="text-sm font-medium text-amber-200">Responsáveis / emergência</p>
        <p className="text-xs text-muted-foreground">
          Até {max} contatos de emergência na carteirinha. O primeiro é o principal. Para dar
          acesso ao portal (autorizações), o admin vincula pela matrícula do responsável.
        </p>
      </div>

      {contacts.map((contact, index) => (
        <div
          key={`ec-${index}`}
          className="grid grid-cols-1 gap-3 rounded-lg border border-white/10 bg-black/20 p-3 sm:grid-cols-2"
        >
          <div className="flex items-center justify-between gap-2 sm:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-100/80">
              Responsável {index + 1}
              {index === 0 ? ' (principal)' : ''}
            </p>
            {contacts.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 min-h-9 text-destructive"
                onClick={() => remove(index)}
              >
                <Trash2 className="mr-1 h-4 w-4" />
                Remover
              </Button>
            )}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor={`ec-rel-${index}`}>Parentesco / vínculo</Label>
            <Input
              id={`ec-rel-${index}`}
              value={contact.relationship || ''}
              onChange={(e) => setAt(index, { relationship: e.target.value })}
              placeholder="Pai, mãe, responsável legal..."
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`ec-name-${index}`}>Nome completo</Label>
            <Input
              id={`ec-name-${index}`}
              value={contact.name}
              onChange={(e) => setAt(index, { name: e.target.value })}
              placeholder="Nome do responsável"
              className="h-11"
              required={index === 0}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`ec-phone-${index}`}>Telefone</Label>
            <Input
              id={`ec-phone-${index}`}
              type="tel"
              inputMode="tel"
              value={contact.phone}
              onChange={(e) => setAt(index, { phone: formatPhoneBR(e.target.value) })}
              placeholder="(14) 99999-0000"
              className="h-11"
              required={index === 0}
            />
          </div>
        </div>
      ))}

      {contacts.length < max && (
        <Button type="button" variant="outline" className="h-11 w-full min-h-11" onClick={add}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar outro responsável
        </Button>
      )}
    </div>
  )
}
