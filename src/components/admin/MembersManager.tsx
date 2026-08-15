import { useState, useEffect, useMemo } from 'react'
import { getAllProfiles, setMemberApproval } from '@/services/admin'
import type { Profile } from '@/services/profiles'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Pencil, Search, Loader2, Eye, CheckCircle2, XCircle, Clock3 } from 'lucide-react'
import { MemberEditDialog } from '@/components/admin/MemberEditDialog'
import { DigitalIdCard } from '@/components/portal/DigitalIdCard'
import { normalizeRole, roleLabel } from '@/lib/roles'

const statusLabel: Record<string, string> = {
  pending: 'Pendente',
  approved: 'Aprovado',
  rejected: 'Recusado',
}

function RoleBadge({ role }: { role: string }) {
  const normalized = normalizeRole(role)
  const styles = {
    member: 'bg-sky-500/15 text-sky-300 hover:bg-sky-500/15',
    professor: 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/15',
    admin: 'bg-violet-500/15 text-violet-300 hover:bg-violet-500/15',
  }
  return <Badge className={styles[normalized]}>{roleLabel(normalized)}</Badge>
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'approved') {
    return (
      <Badge className="bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15">
        {statusLabel[status]}
      </Badge>
    )
  }
  if (status === 'rejected') {
    return (
      <Badge className="bg-destructive/15 text-destructive hover:bg-destructive/15">
        {statusLabel[status]}
      </Badge>
    )
  }
  return (
    <Badge className="bg-amber-500/15 text-amber-300 hover:bg-amber-500/15">
      {statusLabel[status] || status}
    </Badge>
  )
}

export function MembersManager() {
  const { user, refreshProfile } = useAuth()
  const { toast } = useToast()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editProfile, setEditProfile] = useState<Profile | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [cardProfile, setCardProfile] = useState<Profile | null>(null)
  const [actingId, setActingId] = useState<string | null>(null)

  const fetchProfiles = async () => {
    setLoading(true)
    try {
      const list = await getAllProfiles()
      setProfiles(list)
      setCardProfile((current) =>
        current ? (list.find((item) => item.id === current.id) ?? current) : current,
      )
    } catch {
      setProfiles([])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchProfiles()
  }, [])

  const pending = useMemo(() => profiles.filter((p) => p.approval_status === 'pending'), [profiles])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return profiles.filter(
      (p) =>
        p.full_name.toLowerCase().includes(q) ||
        (p.email || '').toLowerCase().includes(q) ||
        p.registration_number.toLowerCase().includes(q) ||
        p.instrument.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        roleLabel(p.role).toLowerCase().includes(q),
    )
  }, [profiles, search])

  const handleEdit = (p: Profile) => {
    setEditProfile(p)
    setEditOpen(true)
  }

  const handleApproval = async (profileId: string, status: 'approved' | 'rejected') => {
    if (!user) return
    setActingId(profileId)
    const { error } = await setMemberApproval(profileId, status, user.id)
    setActingId(null)
    if (error) {
      toast({
        title: 'Erro ao atualizar cadastro',
        description: error,
        variant: 'destructive',
      })
      return
    }
    toast({
      title: status === 'approved' ? 'Aluno aprovado' : 'Cadastro recusado',
      description:
        status === 'approved'
          ? 'O aluno já pode fazer login no portal.'
          : 'O acesso deste cadastro foi bloqueado.',
    })
    await fetchProfiles()
  }

  if (loading)
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Clock3 className="h-5 w-5 text-amber-300" />
              <CardTitle className="text-lg">Cadastros aguardando aprovação</CardTitle>
            </div>
            <CardDescription>
              {pending.length} aluno{pending.length > 1 ? 's' : ''} aguardando liberação de acesso.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pending.map((p) => (
              <div
                key={p.id}
                className="flex flex-col gap-3 rounded-xl border border-white/10 bg-card/60 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">{p.full_name || 'Sem nome'}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {p.email || 'Sem e-mail'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {[p.instrument, p.registration_number].filter(Boolean).join(' · ') ||
                      'Sem instrumento/matrícula'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleApproval(p.id, 'approved')}
                    disabled={actingId === p.id}
                  >
                    {actingId === p.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                    )}
                    Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-destructive/40 text-destructive hover:bg-destructive/10"
                    onClick={() => handleApproval(p.id, 'rejected')}
                    disabled={actingId === p.id}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Recusar
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, e-mail, instrumento..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-white/5">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Matrícula</TableHead>
              <TableHead>Instrumento</TableHead>
              <TableHead>Função</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-28" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.full_name}</TableCell>
                <TableCell className="text-muted-foreground">{p.email || '—'}</TableCell>
                <TableCell>{p.registration_number || '—'}</TableCell>
                <TableCell>{p.instrument || '—'}</TableCell>
                <TableCell>
                  <RoleBadge role={p.role} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={p.approval_status || 'pending'} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {p.approval_status === 'pending' && (
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Aprovar"
                        onClick={() => handleApproval(p.id, 'approved')}
                        disabled={actingId === p.id}
                      >
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setCardProfile(p)}
                      title="Ver carteirinha"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(p)}
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <MemberEditDialog
        profile={editProfile}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={async () => {
          await fetchProfiles()
          await refreshProfile()
        }}
      />

      <Dialog open={!!cardProfile} onOpenChange={(open) => !open && setCardProfile(null)}>
        <DialogContent className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Carteirinha Digital</DialogTitle>
          </DialogHeader>
          {cardProfile && (
            <div className="flex max-h-[70vh] justify-center overflow-y-auto py-4">
              <DigitalIdCard profile={cardProfile} showActions={false} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
