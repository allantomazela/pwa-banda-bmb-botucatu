import { useState, useEffect, useMemo } from 'react'
import { getAllMaterials, createMaterial, updateMaterial, deleteMaterial } from '@/services/admin'
import type { Material } from '@/services/materials'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Pencil, Plus, Trash2, Search, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { MATERIAL_CATEGORIES } from '@/lib/library'

const EMPTY_FORM = { title: '', file_path: '', category: 'Geral' }

export function MaterialsManager() {
  const { toast } = useToast()
  const [items, setItems] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Material | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const fetchMaterials = async () => {
    setLoading(true)
    try {
      setItems(await getAllMaterials())
    } catch {
      setItems([])
    }
    setLoading(false)
  }
  useEffect(() => {
    fetchMaterials()
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return items.filter(
      (m) => m.title.toLowerCase().includes(q) || m.category.toLowerCase().includes(q),
    )
  }, [items, search])

  const handleNew = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setOpen(true)
  }
  const handleEdit = (m: Material) => {
    setEditing(m)
    setForm({ title: m.title, file_path: m.file_path, category: m.category })
    setOpen(true)
  }
  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ title: 'Erro', description: 'O título é obrigatório.', variant: 'destructive' })
      return
    }
    if (!form.file_path.trim()) {
      toast({
        title: 'Erro',
        description: 'O caminho do arquivo é obrigatório.',
        variant: 'destructive',
      })
      return
    }
    setSaving(true)
    const { error } = editing ? await updateMaterial(editing.id, form) : await createMaterial(form)
    setSaving(false)
    if (error) {
      toast({ title: 'Erro', description: error, variant: 'destructive' })
    } else {
      toast({ title: editing ? 'Material atualizado!' : 'Material criado!' })
      setOpen(false)
      fetchMaterials()
    }
  }
  const handleDelete = async (id: string) => {
    const { error } = await deleteMaterial(id)
    if (error) {
      toast({ title: 'Erro', description: error, variant: 'destructive' })
    } else {
      toast({ title: 'Material excluído!' })
      fetchMaterials()
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
            placeholder="Buscar materiais..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={handleNew} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" /> Novo Material
        </Button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-white/5">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Caminho</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.title}</TableCell>
                <TableCell>{m.category}</TableCell>
                <TableCell className="max-w-[200px] truncate text-muted-foreground">
                  {m.file_path}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => handleEdit(m)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="hover:text-destructive"
                      onClick={() => handleDelete(m.id)}
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
            <DialogTitle>{editing ? 'Editar Material' : 'Novo Material'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="m-title">Título</Label>
              <Input
                id="m-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="m-cat">Categoria</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v })}
              >
                <SelectTrigger id="m-cat">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MATERIAL_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="m-path">Caminho do Arquivo</Label>
              <Input
                id="m-path"
                placeholder="scores/arquivo.pdf"
                value={form.file_path}
                onChange={(e) => setForm({ ...form, file_path: e.target.value })}
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
