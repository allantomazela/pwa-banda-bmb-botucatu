import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  IMAGE_CONSENT_PURPOSES,
  IMAGE_CONSENT_TITLE,
  IMAGE_CONSENT_VERSION,
  buildImageConsentText,
} from '@/lib/image-consent'
import { isMinor } from '@/lib/formatters'
import { cn } from '@/lib/utils'

type Props = {
  birthDate?: string | null
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  actorName: string
  onActorNameChange: (value: string) => void
  className?: string
  /** No cadastro de menor, exige nome de quem autoriza (responsável). */
  requireActorName?: boolean
}

export function ImageConsentFields({
  birthDate,
  checked,
  onCheckedChange,
  actorName,
  onActorNameChange,
  className,
  requireActorName,
}: Props) {
  const minor = isMinor(birthDate)
  const needActor = requireActorName ?? minor

  return (
    <div
      className={cn(
        'space-y-3 rounded-xl border border-sky-500/25 bg-sky-500/5 p-4',
        className,
      )}
    >
      <div>
        <p className="text-sm font-semibold text-sky-100">{IMAGE_CONSENT_TITLE}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Consentimento específico e em destaque (LGPD, art. 14). Versão {IMAGE_CONSENT_VERSION}.
          {minor
            ? ' Para menores, deve ser autorizado por pai, mãe ou responsável legal.'
            : ' Você autoriza o uso da própria imagem/voz.'}
        </p>
      </div>

      <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
        {IMAGE_CONSENT_PURPOSES.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <details className="rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-muted-foreground">
        <summary className="cursor-pointer font-medium text-sky-100/90">Ler termo completo</summary>
        <pre className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap font-sans leading-relaxed">
          {buildImageConsentText()}
        </pre>
      </details>

      {needActor && (
        <div className="space-y-2">
          <Label htmlFor="image-consent-actor">
            {minor ? 'Nome de quem autoriza (responsável legal)' : 'Nome de quem autoriza'}
          </Label>
          <Input
            id="image-consent-actor"
            value={actorName}
            onChange={(e) => onActorNameChange(e.target.value)}
            placeholder={minor ? 'Nome do pai, mãe ou responsável' : 'Seu nome completo'}
            className="h-11"
          />
        </div>
      )}

      <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
        <Checkbox
          checked={checked}
          onCheckedChange={(v) => onCheckedChange(v === true)}
          className="mt-0.5"
        />
        <span className="text-sm leading-snug text-foreground">
          Li e autorizo o uso de imagem/voz conforme o termo acima. Posso revogar a qualquer momento
          no portal.
        </span>
      </label>
    </div>
  )
}
