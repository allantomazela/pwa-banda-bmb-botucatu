import { useEffect, useState } from 'react'
import {
  inviteGuardianForStudent,
  linkGuardianByRegistration,
  linkStatusLabel,
  listLinksForStudent,
  revokeGuardianLink,
  type GuardianLink,
} from '@/services/guardian-links'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Link2, Loader2, UserPlus } from 'lucide-react'

interface GuardianDigitalSectionProps {
  studentId: string
  onLinked?: () => void | Promise<void>
}

export function GuardianDigitalSection({ studentId, onLinked }: GuardianDigitalSectionProps) {
  const { toast } = useToast()
  const [links, setLinks] = useState<GuardianLink[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [registration, setRegistration] = useState('')
  const [relationship, setRelationship] = useState('Responsável legal')
  const [inviting, setInviting] = useState(false)
  const [linking, setLinking] = useState(false)
  const [revokingId, setRevokingId] = useState<string | null>(null)

  const refresh = async () => {
    setLoading(true)
    try {
      setLinks(await listLinksForStudent(studentId))
    } catch {
      setLinks([])
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os vínculos de responsável.',
        variant: 'destructive',
      })
    }
    setLoading(false)
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId])

  const afterLink = async () => {
    await refresh()
    await onLinked?.()
  }

  const handleInvite = async () => {
    if (!email.trim()) {
      toast({ title: 'Informe o e-mail do responsável', variant: 'destructive' })
      return
    }
    setInviting(true)
    const { error } = await inviteGuardianForStudent({
      studentId,
      email,
      relationship,
    })
    setInviting(false)
    if (error) {
      toast({ title: 'Não foi possível convidar', description: error, variant: 'destructive' })
      return
    }
    toast({
      title: 'Convite registrado',
      description:
        'Se o e-mail já tiver conta de responsável aprovada, o vínculo fica ativo e o nome entra na carteirinha. Caso contrário, o responsável deve se cadastrar com este e-mail.',
    })
    setEmail('')
    await afterLink()
  }

  const handleLinkByRegistration = async () => {
    if (!registration.trim()) {
      toast({ title: 'Informe a matrícula do responsável', variant: 'destructive' })
      return
    }
    setLinking(true)
    const { error } = await linkGuardianByRegistration({
      studentId,
      guardianRegistration: registration,
      relationship,
    })
    setLinking(false)
    if (error) {
      toast({ title: 'Não foi possível vincular', description: error, variant: 'destructive' })
      return
    }
    toast({
      title: 'Responsável vinculado',
      description: 'O nome do responsável legal foi atualizado na carteirinha do menor.',
    })
    setRegistration('')
    await afterLink()
  }

  const handleRevoke = async (id: string) => {
    setRevokingId(id)
    const { error } = await revokeGuardianLink(id)
    setRevokingId(null)
    if (error) {
      toast({ title: 'Erro ao revogar', description: error, variant: 'destructive' })
      return
    }
    toast({ title: 'Vínculo revogado' })
    await afterLink()
  }

  return (
    <div className="space-y-4 rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <div>
        <h3 className="text-sm font-semibold">Responsável legal (carteirinha e autorizações)</h3>
        <p className="text-xs text-muted-foreground">
          Vincule um responsável já cadastrado pela matrícula (ex.: BMB-0012) ou convide por
          e-mail. O nome do vínculo ativo aparece na carteirinha do menor.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : links.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum responsável vinculado ainda.</p>
      ) : (
        <ul className="space-y-2">
          {links.map((link) => (
            <li
              key={link.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-white/10 bg-background/40 px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <p className="font-medium break-words">
                  {link.guardian?.full_name || link.invited_email}
                </p>
                <p className="text-xs text-muted-foreground">
                  {link.relationship} · {linkStatusLabel(link.status)}
                  {link.guardian?.registration_number
                    ? ` · ${link.guardian.registration_number}`
                    : ''}
                  {link.guardian?.full_name ? ` · ${link.invited_email}` : ''}
                </p>
              </div>
              {link.status !== 'revoked' ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={revokingId === link.id}
                  onClick={() => handleRevoke(link.id)}
                >
                  {revokingId === link.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    'Revogar'
                  )}
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-2">
        <Label htmlFor="gd-rel">Parentesco / tipo</Label>
        <Input
          id="gd-rel"
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
          placeholder="Pai, Mãe, Responsável legal…"
        />
      </div>

      <div className="grid gap-3 rounded-md border border-primary/20 bg-primary/5 p-3 sm:grid-cols-[1fr_auto]">
        <div className="space-y-2">
          <Label htmlFor="gd-reg">Matrícula do responsável já cadastrado</Label>
          <Input
            id="gd-reg"
            value={registration}
            onChange={(e) => setRegistration(e.target.value.toUpperCase())}
            placeholder="BMB-0000"
            autoCapitalize="characters"
          />
        </div>
        <div className="flex items-end">
          <Button
            type="button"
            className="w-full sm:w-auto"
            onClick={handleLinkByRegistration}
            disabled={linking}
          >
            {linking ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Link2 className="mr-2 h-4 w-4" />
            )}
            Vincular
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div className="space-y-2">
          <Label htmlFor="gd-email">Ou convidar por e-mail</Label>
          <Input
            id="gd-email"
            type="email"
            placeholder="responsavel@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <Button
            type="button"
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={handleInvite}
            disabled={inviting}
          >
            {inviting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="mr-2 h-4 w-4" />
            )}
            Convidar
          </Button>
        </div>
      </div>
    </div>
  )
}
