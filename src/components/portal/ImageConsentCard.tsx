import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ImageConsentFields } from '@/components/ImageConsentFields'
import {
  IMAGE_CONSENT_VERSION,
  imageConsentLabel,
  buildImageConsentText,
} from '@/lib/image-consent'
import { recordImageConsent } from '@/services/image-consent'
import { isMinor } from '@/lib/formatters'
import { useToast } from '@/hooks/use-toast'
import { Loader2, ShieldCheck } from 'lucide-react'

type Props = {
  profileId: string
  birthDate: string | null
  fullName: string
  status: string | null | undefined
  consentByName?: string | null
  onUpdated: () => void | Promise<void>
}

export function ImageConsentCard({
  profileId,
  birthDate,
  fullName,
  status,
  consentByName,
  onUpdated,
}: Props) {
  const { toast } = useToast()
  const [busy, setBusy] = useState(false)
  const [checked, setChecked] = useState(false)
  const [actorName, setActorName] = useState(consentByName || fullName || '')
  const minor = isMinor(birthDate)
  const granted = status === 'granted'

  const submit = async (action: 'granted' | 'revoked' | 'denied') => {
    if (action === 'granted') {
      if (!checked) {
        toast({
          title: 'Confirme o termo',
          description: 'Marque a autorização após ler o termo.',
          variant: 'destructive',
        })
        return
      }
      if (minor && !actorName.trim()) {
        toast({
          title: 'Responsável obrigatório',
          description: 'Informe o nome de quem autoriza (pai, mãe ou responsável legal).',
          variant: 'destructive',
        })
        return
      }
    }

    setBusy(true)
    const { error } = await recordImageConsent({
      profileId,
      action,
      actorName: actorName.trim() || fullName,
      actorRole: minor ? 'guardian' : 'self',
    })
    setBusy(false)

    if (error) {
      toast({ title: 'Erro', description: error, variant: 'destructive' })
      return
    }

    toast({
      title: action === 'granted' ? 'Autorização registrada' : 'Autorização atualizada',
      description:
        action === 'granted'
          ? 'Consentimento gravado com trilha de auditoria (LGPD).'
          : 'O status de uso de imagem foi atualizado.',
    })
    setChecked(false)
    await onUpdated()
  }

  return (
    <Card className="border-sky-500/20 bg-card/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-5 w-5 text-sky-300" />
          Autorização de imagem (LGPD)
        </CardTitle>
        <CardDescription>
          Status atual: <span className="font-semibold text-foreground">{imageConsentLabel(status)}</span>
          {consentByName ? ` · por ${consentByName}` : ''}. Versão do termo: {IMAGE_CONSENT_VERSION}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!granted ? (
          <>
            <ImageConsentFields
              birthDate={birthDate}
              checked={checked}
              onCheckedChange={setChecked}
              actorName={actorName}
              onActorNameChange={setActorName}
            />
            <Button
              type="button"
              className="h-11 w-full min-h-11"
              disabled={busy}
              onClick={() => void submit('granted')}
            >
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Registrar autorização
            </Button>
          </>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              A BMB pode usar imagem/voz nas finalidades institucionais do termo. Você pode revogar a
              qualquer momento; a revogação não apaga usos já feitos de forma lícita.
            </p>
            <details className="rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-muted-foreground">
              <summary className="cursor-pointer font-medium text-sky-100/90">Ver termo vigente</summary>
              <pre className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap font-sans">
                {buildImageConsentText()}
              </pre>
            </details>
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full min-h-11"
              disabled={busy}
              onClick={() => void submit('revoked')}
            >
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Revogar autorização
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
