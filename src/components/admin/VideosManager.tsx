import { useState, useEffect, useMemo } from 'react'
import { getAllVideos, createVideo, updateVideo, deleteVideo } from '@/services/admin'
import type { VideoItem } from '@/services/videos'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Pencil, Plus, Trash2, Search, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'

const CATEGORIES = [
  'Apresentação',
  'Ensaio',
  'Método I',
  'Método II',
  'Marcha',
  'Coreografia',
  'Instrumento',
  'Geral',
]
const EMPTY_FORM = {
  title: '',
  video_url: '',
  description: '',
  category: 'Geral',
  is_public: false,
}

export function VideosManager() {
  const { toast } = useToast()
  const [items, setItems] = useState<VideoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<VideoItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const fetchVideos = async () => {
    setLoading(true)
    try {
      setItems(await getAllVideos())
    } catch {
      setItems([])
    }
    setLoading(false)
  }
  useEffect(() => {
    fetchVideos()
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return items.filter(
      (v) => v.title.toLowerCase().includes(q) || v.category.toLowerCase().includes(q),
    )
  }, [items, search])

  const handleNew = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setOpen(true)
  }
  const handleEdit = (v: VideoItem) => {
    setEditing(v)
    setForm({
      title: v.title,
      video_url: v.video_url,
      description: v.description,
      category: v.category,
      is_public: Boolean(v.is_public),
    })
    setOpen(true)
  }
  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ title: 'Erro', description: 'O título é obrigatório.', variant: 'destructive' })
      return
    }
    if (!form.video_url.trim()) {
      toast({ title: 'Erro', description: 'A URL do vídeo é obrigatória.', variant: 'destructive' })
      return
    }
    try {
      new URL(form.video_url)
    } catch {
      toast({ title: 'Erro', description: 'A URL do vídeo é inválida.', variant: 'destructive' })
      return
    }
    setSaving(true)
    const { error } = editing ? await updateVideo(editing.id, form) : await createVideo(form)
    setSaving(false)
    if (error) {
      toast({ title: 'Erro', description: error, variant: 'destructive' })
    } else {
      toast({ title: editing ? 'Vídeo atualizado!' : 'Vídeo criado!' })
      setOpen(false)
      fetchVideos()
    }
  }
  const handleDelete = async (id: string) => {
    const { error } = await deleteVideo(id)
    if (error) {
      toast({ title: 'Erro', description: error, variant: 'destructive' })
    } else {
      toast({ title: 'Vídeo excluído!' })
      fetchVideos()
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar vídeos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={handleNew} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" /> Novo Vídeo
        </Button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-white/5">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Visibilidade</TableHead>
              <TableHead className="hidden md:table-cell">URL</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="font-medium">{v.title}</TableCell>
                <TableCell>{v.category}</TableCell>
                <TableCell>
                  <Badge variant={v.is_public ? 'default' : 'secondary'}>
                    {v.is_public ? 'Público' : 'Exclusivo'}
                  </Badge>
                </TableCell>
                <TableCell className="hidden max-w-[200px] truncate text-muted-foreground md:table-cell">
                  {v.video_url}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => handleEdit(v)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="hover:text-destructive"
                      onClick={() => handleDelete(v.id)}
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
        <DialogContent className="w-[calc(100%-1.25rem)] max-h-[90dvh] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Vídeo' : 'Novo Vídeo'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="v-title">Título</Label>
              <Input
                id="v-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="v-cat">Categoria</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v })}
              >
                <SelectTrigger id="v-cat">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="v-url">URL do Vídeo</Label>
              <Input
                id="v-url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={form.video_url}
                onChange={(e) => setForm({ ...form, video_url: e.target.value })}
              />
            </div>
            <div className="flex items-start justify-between gap-4 rounded-lg border border-white/10 p-3">
              <div className="space-y-1">
                <Label htmlFor="v-public">Vídeo público</Label>
                <p className="text-xs text-muted-foreground">
                  Ligado: aparece na galeria de mídia do site. Desligado: exclusivo do portal dos
                  membros.
                </p>
              </div>
              <Switch
                id="v-public"
                checked={form.is_public}
                onCheckedChange={(checked) => setForm({ ...form, is_public: checked })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="v-desc">Descrição</Label>
              <Textarea
                id="v-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
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
