import { useState, useEffect, useMemo } from 'react'
import { getAllEvents, createEvent, updateEvent, deleteEvent } from '@/services/admin'
import type { EventItem } from '@/services/events'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ImageUrlField } from '@/components/admin/ImageUrlField'
import { Pencil, Plus, Trash2, Search, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const EMPTY_FORM = {
  title: '',
  description: '',
  event_date: '',
  location: '',
  image_url: '',
}

export function EventsManager() {
  const { toast } = useToast()
  const [items, setItems] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<EventItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const fetchEvents = async () => {
    setLoading(true)
    try {
      setItems(await getAllEvents())
    } catch {
      setItems([])
    }
    setLoading(false)
  }
  useEffect(() => {
    fetchEvents()
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return items.filter(
      (e) => e.title.toLowerCase().includes(q) || e.location?.toLowerCase().includes(q),
    )
  }, [items, search])

  const handleNew = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setOpen(true)
  }
  const handleEdit = (e: EventItem) => {
    setEditing(e)
    setForm({
      title: e.title,
      description: e.description || '',
      event_date: e.event_date.slice(0, 16),
      location: e.location || '',
      image_url: e.image_url || '',
    })
    setOpen(true)
  }
  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ title: 'Erro', description: 'O título é obrigatório.', variant: 'destructive' })
      return
    }
    if (!form.event_date) {
      toast({
        title: 'Erro',
        description: 'A data do evento é obrigatória.',
        variant: 'destructive',
      })
      return
    }
    setSaving(true)
    const payload = {
      title: form.title,
      description: form.description || null,
      event_date: new Date(form.event_date).toISOString(),
      location: form.location || null,
      image_url: form.image_url.trim() || '',
    }
    const { error } = editing ? await updateEvent(editing.id, payload) : await createEvent(payload)
    setSaving(false)
    if (error) {
      toast({ title: 'Erro', description: error, variant: 'destructive' })
    } else {
      toast({ title: editing ? 'Evento atualizado!' : 'Evento criado!' })
      setOpen(false)
      fetchEvents()
    }
  }
  const handleDelete = async (id: string) => {
    const { error } = await deleteEvent(id)
    if (error) {
      toast({ title: 'Erro', description: error, variant: 'destructive' })
    } else {
      toast({ title: 'Evento excluído!' })
      fetchEvents()
    }
  }

  if (loading)
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar eventos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={handleNew}>
          <Plus className="w-4 h-4 mr-2" /> Novo Evento
        </Button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-white/5">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14">Flyer</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Local</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((e) => (
              <TableRow key={e.id}>
                <TableCell>
                  {e.image_url ? (
                    <img
                      src={e.image_url}
                      alt=""
                      className="h-10 w-8 rounded object-cover border border-white/10"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="font-medium">{e.title}</TableCell>
                <TableCell>{new Date(e.event_date).toLocaleDateString('pt-BR')}</TableCell>
                <TableCell className="max-w-[200px] truncate">{e.location || '—'}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => handleEdit(e)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="hover:text-destructive"
                      onClick={() => handleDelete(e.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Evento' : 'Novo Evento'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ev-title">Título</Label>
              <Input
                id="ev-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ev-desc">Descrição</Label>
              <Textarea
                id="ev-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ev-date">Data e Hora</Label>
                <Input
                  id="ev-date"
                  type="datetime-local"
                  value={form.event_date}
                  onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ev-loc">Local</Label>
                <Input
                  id="ev-loc"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </div>
            </div>
            <ImageUrlField
              id="ev-flyer"
              label="Flyer / cartaz"
              hint="Imagem de divulgação do evento (opcional). Ideal em formato vertical."
              value={form.image_url}
              kind="event"
              accept="image/webp,image/jpeg,image/png,.webp,.jpg,.jpeg,.png"
              successDescription="Clique em Salvar para gravar o evento com o flyer."
              onChange={(url) => setForm({ ...form, image_url: url })}
            />
            {form.image_url ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => setForm({ ...form, image_url: '' })}
              >
                Remover flyer
              </Button>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
