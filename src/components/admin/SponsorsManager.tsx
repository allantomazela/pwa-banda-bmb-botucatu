import { useEffect, useState } from 'react'
import {
  createSponsor,
  deleteSponsor,
  getSponsors,
  updateSponsor,
  type Sponsor,
  type SponsorKind,
} from '@/services/sponsors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ImageUrlField } from '@/components/admin/ImageUrlField'
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const EMPTY_FORM = {
  name: '',
  logo_url: '',
  website_url: '',
  kind: 'patrocinador' as SponsorKind,
  is_visible: true,
  sort_order: 0,
}

export function SponsorsManager() {
  const { toast } = useToast()
  const [items, setItems] = useState<Sponsor[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<Sponsor | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const fetchItems = async () => {
    setLoading(true)
    try {
      setItems(await getSponsors())
    } catch {
      setItems([])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchItems()
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setOpen(true)
  }

  const openEdit = (item: Sponsor) => {
    setEditing(item)
    setForm({
      name: item.name,
      logo_url: item.logo_url,
      website_url: item.website_url,
      kind: item.kind as SponsorKind,
      is_visible: item.is_visible,
      sort_order: item.sort_order,
    })
    setOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Erro', description: 'Informe o nome da empresa.', variant: 'destructive' })
      return
    }
    if (!form.logo_url.trim()) {
      toast({ title: 'Erro', description: 'Envie ou informe a URL da logo.', variant: 'destructive' })
      return
    }
    setSaving(true)
    const payload = {
      name: form.name.trim(),
      logo_url: form.logo_url.trim(),
      website_url: form.website_url.trim(),
      kind: form.kind,
      is_visible: form.is_visible,
      sort_order: Number(form.sort_order) || 0,
    }
    const { error } = editing
      ? await updateSponsor(editing.id, payload)
      : await createSponsor(payload)
    setSaving(false)
    if (error) {
      toast({ title: 'Erro', description: error, variant: 'destructive' })
      return
    }
    toast({ title: editing ? 'Patrocinador atualizado' : 'Patrocinador adicionado' })
    setOpen(false)
    fetchItems()
  }

  const handleDelete = async (id: string) => {
    const { error } = await deleteSponsor(id)
    if (error) {
      toast({ title: 'Erro', description: error, variant: 'destructive' })
      return
    }
    toast({ title: 'Removido' })
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-4">
        <p className="text-sm text-muted-foreground">
          Cadastre as logos que aparecem na página pública de patrocínio.
        </p>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" /> Nova logo
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">Nenhum patrocinador cadastrado.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 rounded-lg border border-white/10 p-4"
            >
              <img
                src={item.logo_url}
                alt={item.name}
                className="h-12 w-24 object-contain bg-white/5 rounded"
              />
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {item.kind === 'apoiador' ? 'Apoiador' : 'Patrocinador'}
                  {item.is_visible ? '' : ' · oculto'}
                </p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => openEdit(item)} title="Editar">
                <Pencil className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => handleDelete(item.id)} title="Excluir">
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar patrocinador' : 'Novo patrocinador'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="sp-name">Nome</Label>
              <Input
                id="sp-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <ImageUrlField
              id="sp-logo"
              label="Logo"
              hint="WebP, PNG, SVG ou JPEG (máx. 2MB)."
              value={form.logo_url}
              kind="sponsor"
              accept="image/webp,image/png,image/svg+xml,image/jpeg"
              successDescription="Confirme o cadastro para publicar no site."
              onChange={(logo_url) => setForm({ ...form, logo_url })}
            />
            <div className="space-y-2">
              <Label htmlFor="sp-url">Site (opcional)</Label>
              <Input
                id="sp-url"
                value={form.website_url}
                onChange={(e) => setForm({ ...form, website_url: e.target.value })}
                placeholder="https://empresa.com.br"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={form.kind}
                  onValueChange={(kind) => setForm({ ...form, kind: kind as SponsorKind })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="patrocinador">Patrocinador</SelectItem>
                    <SelectItem value="apoiador">Apoiador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sp-order">Ordem</Label>
                <Input
                  id="sp-order"
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_visible}
                onCheckedChange={(is_visible) => setForm({ ...form, is_visible })}
              />
              <Label>Visível no site</Label>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
