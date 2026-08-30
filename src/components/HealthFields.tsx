import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export type HealthFormValues = {
  disability_info: string
  health_problems: string
  continuous_medications: string
  diseases: string
  surgeries: string
  dietary_restrictions: string
}

type Props = {
  values: HealthFormValues
  onChange: (field: keyof HealthFormValues, value: string) => void
  idPrefix?: string
}

const FIELDS: Array<{
  key: keyof HealthFormValues
  label: string
  placeholder: string
}> = [
  {
    key: 'disability_info',
    label: 'Deficiência ou limitação de mobilidade',
    placeholder: 'Descreva deficiência ou limitação que a organização precise conhecer.',
  },
  {
    key: 'health_problems',
    label: 'Problemas de saúde',
    placeholder: 'Ex.: asma, alergias graves, condições crônicas…',
  },
  {
    key: 'continuous_medications',
    label: 'Uso contínuo de medicamentos',
    placeholder: 'Liste medicamentos de uso contínuo e, se possível, posologia.',
  },
  {
    key: 'diseases',
    label: 'Doenças',
    placeholder: 'Doenças diagnosticadas relevantes para viagens e ensaios.',
  },
  {
    key: 'surgeries',
    label: 'Cirurgias',
    placeholder: 'Cirurgias recentes ou que ainda exijam cuidados.',
  },
  {
    key: 'dietary_restrictions',
    label: 'Restrições alimentares',
    placeholder: 'Ex.: alergia a glúten, lactose, restrição religiosa…',
  },
]

export function HealthFields({ values, onChange, idPrefix = 'health' }: Props) {
  return (
    <div className="space-y-4 rounded-xl border border-sky-500/20 bg-sky-500/5 p-4">
      <div className="space-y-1">
        <p className="text-sm font-medium text-sky-100">Ficha de saúde</p>
        <p className="text-xs text-muted-foreground">
          Informações internas da banda para segurança em ensaios e viagens. Não aparecem na
          carteirinha pública.
        </p>
      </div>
      {FIELDS.map((field) => {
        const id = `${idPrefix}-${field.key}`
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={id}>{field.label}</Label>
            <Textarea
              id={id}
              value={values[field.key]}
              onChange={(e) => onChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              rows={2}
            />
          </div>
        )
      })}
    </div>
  )
}

export function emptyHealthForm(): HealthFormValues {
  return {
    disability_info: '',
    health_problems: '',
    continuous_medications: '',
    diseases: '',
    surgeries: '',
    dietary_restrictions: '',
  }
}

export function healthFormFromProfile(profile: {
  disability_info?: string | null
  health_problems?: string | null
  continuous_medications?: string | null
  diseases?: string | null
  surgeries?: string | null
  dietary_restrictions?: string | null
}): HealthFormValues {
  return {
    disability_info: profile.disability_info || '',
    health_problems: profile.health_problems || '',
    continuous_medications: profile.continuous_medications || '',
    diseases: profile.diseases || '',
    surgeries: profile.surgeries || '',
    dietary_restrictions: profile.dietary_restrictions || '',
  }
}

export function healthPayloadFromForm(values: HealthFormValues) {
  return {
    disability_info: values.disability_info.trim() || null,
    health_problems: values.health_problems.trim() || null,
    continuous_medications: values.continuous_medications.trim() || null,
    diseases: values.diseases.trim() || null,
    surgeries: values.surgeries.trim() || null,
    dietary_restrictions: values.dietary_restrictions.trim() || null,
  }
}
