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
import { useToast } from '@/hooks/use-toast'
import { Loader2, ShieldCheck } from 'lucide-react'
import type { GuardianLinkWithStudent } from '@/services/guardian-links'
import { isMinor } from '@/lib/formatters'

type Props = {
  links: GuardianLinkWithStudent[]
  actorName: string
  onUpdated: () => void | Promise<void>
}

export function GuardianImageConsentPanel({ links, actorName, onUpdated }: Props) {
  const { toast } = useToast()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [checkedByStudent, setCheckedByStudent] = useState<Record<string, boolean>>({})

  const minors = links.filter((link) => isMinor(link.profiles?.birth_date ?? null))

  if (minors.length === 0) return null

  const submit = async (
    studentId: string,
    studentName: string,
    action: 'granted' | 'revoked',
  ) => {
    if (action === 'granted' && !checkedByStudent[studentId]) {
      toast({
        title: 'Confirme o termo',
        description: 'Marque a autorização após ler o termo.',
        variant: 'destructive',
      })
      return
    }

    setBusyId(studentId)
    const { error } = await recordImageConsent({
      profileId: studentId,
      action,
      actorName: actorName.trim() || 'Responsável legal',
      actorRole: 'guardian',
    })
    setBusyId(null)

    if (error) {
      toast({ title: 'Erro', description: error, variant: 'destructive' })
      return
    }

    toast({
      title: action === 'granted' ? 'Imagem autorizada' : 'Autorização revogada',
      description:
        action === 'granted'
          ? `Consentimento de ${studentName} registrado em seu nome (LGPD).`
          : `Uso de imagem de ${studentName} atualizado.`,
    })
    setCheckedByStudent((prev) => ({ ...prev, [studentId]: false }))
    await onUpdated()
  }

  return (
    <Card className="border-sky-500/25 bg-sky-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-5 w-5 text-sky-300" />
          Autorização de imagem dos alunos
        </CardTitle>
        <CardDescription>
          Somente o responsável vinculado autoriza o uso de imagem/voz dos menores (LGPD). Versão do
          termo: {IMAGE_CONSENT_VERSION}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {minors.map((link) => {
          const student = link.profiles
          if (!student) return null
          const status = student.image_consent_status || 'pending'
          const granted = status === 'granted'
          const studentId = student.id

          return (
            <div
              key={link.id}
              className="space-y-3 rounded-xl border border-white/10 bg-background/40 p-3 sm:p-4"
            >
              <div className="min-w-0">
                <p className="font-medium break-words text-foreground">{student.full_name}</p>
                <p className="text-xs text-muted-foreground">
                  {student.registration_number ? `Matrícula ${student.registration_number} · ` : ''}
                  Status: {imageConsentLabel(status)}
                  {student.image_consent_by_name
                    ? ` · por ${student.image_consent_by_name}`
                    : ''}
                </p>
              </div>

              {!granted ? (
                <>
                  <ImageConsentFields
                    birthDate={student.birth_date}
                    checked={Boolean(checkedByStudent[studentId])}
                    onCheckedChange={(v) =>
                      setCheckedByStudent((prev) => ({ ...prev, [studentId]: v }))
                    }
                    actorName={actorName}
                    onActorNameChange={() => undefined}
                    requireActorName={false}
                  />
                  <p className="text-xs text-muted-foreground">
                    Autorizando como: <span className="text-foreground">{actorName}</span>
                  </p>
                  <Button
                    type="button"
                    className="h-11 w-full min-h-11"
                    disabled={busyId === studentId}
                    onClick={() => void submit(studentId, student.full_name, 'granted')}
                  >
                    {busyId === studentId ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Autorizar imagem de {student.full_name.split(' ')[0]}
                  </Button>
                </>
              ) : (
                <div className="space-y-2">
                  <details className="rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-muted-foreground">
                    <summary className="cursor-pointer font-medium text-sky-100/90">
                      Ver termo vigente
                    </summary>
                    <pre className="mt-2 max-h-32 overflow-y-auto whitespace-pre-wrap font-sans">
                      {buildImageConsentText()}
                    </pre>
                  </details>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 w-full min-h-11"
                    disabled={busyId === studentId}
                    onClick={() => void submit(studentId, student.full_name, 'revoked')}
                  >
                    {busyId === studentId ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Revogar autorização de imagem
                  </Button>
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
