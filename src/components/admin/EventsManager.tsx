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
import { Pencil, Plus, Trash2, Search, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const EMPTY_FORM = { title: '', description: '', event_date: '', location: '' }

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
      <div className="rounded-lg border border-white/5 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Local</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((e) => (
              <TableRow key={e.id}>
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
        <DialogContent>
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
            <div className="grid grid-cols-2 gap-4">
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
