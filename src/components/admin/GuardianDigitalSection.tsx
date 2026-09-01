import { useEffect, useState } from 'react'
import {
  inviteGuardianForStudent,
  linkStatusLabel,
  listLinksForStudent,
  revokeGuardianLink,
  type GuardianLink,
} from '@/services/guardian-links'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Loader2, UserPlus } from 'lucide-react'

interface GuardianDigitalSectionProps {
  studentId: string
}

export function GuardianDigitalSection({ studentId }: GuardianDigitalSectionProps) {
  const { toast } = useToast()
  const [links, setLinks] = useState<GuardianLink[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [relationship, setRelationship] = useState('Responsável')
  const [inviting, setInviting] = useState(false)
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
        'O responsável deve criar conta ou fazer login com este e-mail para ativar o vínculo.',
    })
    setEmail('')
    refresh()
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
    refresh()
  }

  return (
    <div className="space-y-3 rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <div>
        <h3 className="text-sm font-semibold">Responsável digital</h3>
        <p className="text-xs text-muted-foreground">
          Conta com login próprio para assinar autorizações de viagem. O e-mail não pode ser o
          mesmo de um aluno.
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
              <div>
                <p className="font-medium">{link.invited_email}</p>
                <p className="text-xs text-muted-foreground">
                  {link.relationship} · {linkStatusLabel(link.status)}
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

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="gd-email">E-mail do responsável</Label>
          <Input
            id="gd-email"
            type="email"
            placeholder="responsavel@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gd-rel">Parentesco</Label>
          <Input
            id="gd-rel"
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            placeholder="Pai, Mãe, Responsável legal…"
          />
        </div>
        <div className="flex items-end">
          <Button type="button" className="w-full" onClick={handleInvite} disabled={inviting}>
            {inviting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="mr-2 h-4 w-4" />
            )}
            Convidar responsável
          </Button>
        </div>
      </div>
    </div>
  )
}
