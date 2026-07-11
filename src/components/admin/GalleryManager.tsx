import { useState, useEffect, useRef } from 'react'
import {
  getGalleryPhotos,
  createGalleryPhoto,
  deleteGalleryPhoto,
  uploadGalleryImage,
  type GalleryPhoto,
} from '@/services/gallery'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Plus, Trash2, Loader2, Upload } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const CATEGORIES = ['Banner', 'Galeria', 'Eventos']

export function GalleryManager() {
  const { toast } = useToast()
  const [photos, setPhotos] = useState<GalleryPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', image_url: '', category: 'Galeria' })
  const fileRef = useRef<HTMLInputElement>(null)

  const fetchPhotos = async () => {
    setLoading(true)
    try {
      setPhotos(await getGalleryPhotos())
    } catch {
      setPhotos([])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchPhotos()
  }, [])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Erro',
        description: 'Arquivo muito grande (máx 5MB).',
        variant: 'destructive',
      })
      return
    }
    const url = await uploadGalleryImage(file)
    if (url) {
      setForm((prev) => ({ ...prev, image_url: url }))
      toast({ title: 'Imagem enviada!' })
    } else {
      toast({ title: 'Erro', description: 'Falha no upload.', variant: 'destructive' })
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ title: 'Erro', description: 'O título é obrigatório.', variant: 'destructive' })
      return
    }
    if (!form.image_url) {
      toast({ title: 'Erro', description: 'Selecione uma imagem.', variant: 'destructive' })
      return
    }
    setSaving(true)
    const { error } = await createGalleryPhoto(form)
    setSaving(false)
    if (error) {
      toast({ title: 'Erro', description: error, variant: 'destructive' })
    } else {
      toast({ title: 'Foto adicionada!' })
      setOpen(false)
      setForm({ title: '', image_url: '', category: 'Galeria' })
      fetchPhotos()
    }
  }

  const handleDelete = async (id: string) => {
    const { error } = await deleteGalleryPhoto(id)
    if (error) {
      toast({ title: 'Erro', description: error, variant: 'destructive' })
    } else {
      toast({ title: 'Foto excluída!' })
      fetchPhotos()
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
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Nova Foto
        </Button>
      </div>
      {photos.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">Nenhuma foto na galeria.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative group rounded-lg overflow-hidden border border-white/5 aspect-square"
            >
              <img src={photo.image_url} alt={photo.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                <span className="text-xs text-white font-medium truncate">{photo.title}</span>
                <Button
                  size="icon"
                  variant="destructive"
                  className="h-7 w-7 self-end"
                  onClick={() => handleDelete(photo.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Foto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="g-title">Título</Label>
              <Input
                id="g-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <div className="flex gap-2">
                {CATEGORIES.map((c) => (
                  <Button
                    key={c}
                    size="sm"
                    variant={form.category === c ? 'default' : 'outline'}
                    onClick={() => setForm({ ...form, category: c })}
                  >
                    {c}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Imagem</Label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
              />
              <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" /> Enviar Imagem
              </Button>
              {form.image_url && (
                <img
                  src={form.image_url}
                  alt="Preview"
                  className="w-full h-40 object-cover rounded-lg"
                />
              )}
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
