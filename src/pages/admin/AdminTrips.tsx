import { useEffect, useState } from 'react'
import {
  authorizationStatusLabel,
  createTravelTrip,
  deleteTravelTrip,
  generateAuthorizationsForMinors,
  listAuthorizationsForTrip,
  listTravelTrips,
  revokeAuthorization,
  updateTravelTrip,
  type TravelAuthorizationWithMember,
  type TravelTrip,
} from '@/services/travel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { Bus, Loader2, Plus, Trash2, Users } from 'lucide-react'

function toLocalInput(iso: string | null | undefined) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromLocalInput(value: string) {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

const EMPTY_FORM = {
  title: '',
  destination: '',
  departure_at: '',
  return_at: '',
  description: '',
  is_active: true,
}

export default function AdminTrips() {
  const { toast } = useToast()
  const [trips, setTrips] = useState<TravelTrip[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<TravelTrip | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [detailTrip, setDetailTrip] = useState<TravelTrip | null>(null)
  const [auths, setAuths] = useState<TravelAuthorizationWithMember[]>([])
  const [authsLoading, setAuthsLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  const refresh = async () => {
    setLoading(true)
    try {
      setTrips(await listTravelTrips())
    } catch {
      setTrips([])
      toast({ title: 'Erro', description: 'Não foi possível carregar as viagens.', variant: 'destructive' })
    }
    setLoading(false)
  }

  useEffect(() => {
    refresh()
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setOpen(true)
  }

  const openEdit = (trip: TravelTrip) => {
    setEditing(trip)
    setForm({
      title: trip.title,
      destination: trip.destination || '',
      departure_at: toLocalInput(trip.departure_at),
      return_at: toLocalInput(trip.return_at),
      description: trip.description || '',
      is_active: trip.is_active,
    })
    setOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim() || !form.departure_at) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Informe título e data/hora de saída.',
        variant: 'destructive',
      })
      return
    }
    const departure = fromLocalInput(form.departure_at)
    if (!departure) {
      toast({ title: 'Data inválida', description: 'Confira a saída.', variant: 'destructive' })
      return
    }
    setSaving(true)
    const payload = {
      title: form.title.trim(),
      destination: form.destination.trim(),
      departure_at: departure,
      return_at: fromLocalInput(form.return_at),
      description: form.description.trim(),
      is_active: form.is_active,
    }
    const { error } = editing
      ? await updateTravelTrip(editing.id, payload)
      : await createTravelTrip(payload)
    setSaving(false)
    if (error) {
      toast({ title: 'Erro', description: error, variant: 'destructive' })
      return
    }
    toast({ title: editing ? 'Viagem atualizada!' : 'Viagem criada!' })
    setOpen(false)
    refresh()
  }

  const handleDelete = async (trip: TravelTrip) => {
    if (!window.confirm(`Excluir a viagem "${trip.title}" e suas autorizações?`)) return
    const { error } = await deleteTravelTrip(trip.id)
    if (error) {
      toast({ title: 'Erro', description: error, variant: 'destructive' })
      return
    }
    toast({ title: 'Viagem excluída' })
    if (detailTrip?.id === trip.id) setDetailTrip(null)
    refresh()
  }

  const openDetail = async (trip: TravelTrip) => {
    setDetailTrip(trip)
    setAuthsLoading(true)
    try {
      setAuths(await listAuthorizationsForTrip(trip.id))
    } catch {
      setAuths([])
    }
    setAuthsLoading(false)
  }

  const handleGenerate = async () => {
    if (!detailTrip) return
    setGenerating(true)
    const { error, created } = await generateAuthorizationsForMinors(detailTrip.id)
    setGenerating(false)
    if (error) {
      toast({ title: 'Erro', description: error, variant: 'destructive' })
      return
    }
    toast({
      title: created ? `${created} autorização(ões) gerada(s)` : 'Nenhuma nova autorização',
      description: created
        ? 'Pendentes para alunos menores aprovados.'
        : 'Todos os menores já tinham autorização ou não há menores.',
    })
    openDetail(detailTrip)
  }

  const handleRevoke = async (id: string) => {
    const { error } = await revokeAuthorization(id)
    if (error) {
      toast({ title: 'Erro', description: error, variant: 'destructive' })
      return
    }
    toast({ title: 'Autorização revogada' })
    if (detailTrip) openDetail(detailTrip)
  }

  return (
    <div className="mx-auto max-w-5xl animate-fade-in space-y-6 p-4 sm:p-6 lg:p-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Viagens e autorizações</h1>
          <p className="mt-1 text-muted-foreground">
            Crie viagens e gere autorizações para alunos menores assinarem no portal.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Nova viagem
        </Button>
      </header>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : trips.length === 0 ? (
        <Card className="border-dashed border-white/15 bg-card/40">
          <CardContent className="py-14 text-center text-muted-foreground">
            <Bus className="mx-auto mb-3 h-10 w-10 opacity-40" />
            Nenhuma viagem cadastrada ainda.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {trips.map((trip) => (
            <Card key={trip.id} className="border-white/10 bg-card/50">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate font-semibold text-white">{trip.title}</h2>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        trip.is_active
                          ? 'bg-primary/15 text-primary'
                          : 'bg-white/10 text-muted-foreground'
                      }`}
                    >
                      {trip.is_active ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {trip.destination || 'Sem destino'} ·{' '}
                    {new Date(trip.departure_at).toLocaleString('pt-BR')}
                    {trip.return_at
                      ? ` → ${new Date(trip.return_at).toLocaleString('pt-BR')}`
                      : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => openDetail(trip)}>
                    <Users className="mr-2 h-4 w-4" /> Autorizações
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => openEdit(trip)}>
                    Editar
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(trip)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar viagem' : 'Nova viagem'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Ex.: Festival de Bandas 2026"
              />
            </div>
            <div className="space-y-2">
              <Label>Destino</Label>
              <Input
                value={form.destination}
                onChange={(e) => setForm((p) => ({ ...p, destination: e.target.value }))}
                placeholder="Cidade / local"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Saída</Label>
                <Input
                  type="datetime-local"
                  value={form.departure_at}
                  onChange={(e) => setForm((p) => ({ ...p, departure_at: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Retorno (opcional)</Label>
                <Input
                  type="datetime-local"
                  value={form.return_at}
                  onChange={(e) => setForm((p) => ({ ...p, return_at: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2">
              <Label htmlFor="trip-active">Viagem ativa</Label>
              <Switch
                id="trip-active"
                checked={form.is_active}
                onCheckedChange={(v) => setForm((p) => ({ ...p, is_active: v }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detailTrip} onOpenChange={(v) => !v && setDetailTrip(null)}>
        <DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Autorizações — {detailTrip?.title}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleGenerate} disabled={generating}>
              {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Users className="mr-2 h-4 w-4" />}
              Gerar para menores aprovados
            </Button>
          </div>
          {authsLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : auths.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma autorização gerada. Use o botão acima.
            </p>
          ) : (
            <div className="space-y-3">
              {auths.map((auth) => (
                <Card key={auth.id} className="border-white/10 bg-card/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
                      <span>{auth.profiles?.full_name || 'Aluno'}</span>
                      <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                        {authorizationStatusLabel(auth.status)}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>Matrícula: {auth.profiles?.registration_number || '—'}</p>
                    <p>
                      Responsável: {auth.guardian_name || '—'} · {auth.guardian_phone || '—'}
                    </p>
                    {auth.signed_at ? (
                      <p>Assinado em {new Date(auth.signed_at).toLocaleString('pt-BR')}</p>
                    ) : null}
                    {auth.signature_data ? (
                      <img
                        src={auth.signature_data}
                        alt="Assinatura"
                        className="mt-2 max-h-24 rounded-md border border-white/10 bg-black"
                      />
                    ) : null}
                    {auth.status === 'signed' ? (
                      <Button size="sm" variant="outline" onClick={() => handleRevoke(auth.id)}>
                        Revogar
                      </Button>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
