import { useEffect, useRef, useState } from 'react'
import {
  createGalleryPhotos,
  deleteGalleryPhoto,
  getGalleryPhotos,
  uploadGalleryImage,
  type GalleryPhoto,
} from '@/services/gallery'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, Plus, Trash2, Upload, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const CATEGORIES = ['Banner', 'Galeria', 'Eventos']
const MAX_FILES = 30

type PendingItem = {
  id: string
  file: File
  preview: string
  title: string
}

export function GalleryManager() {
  const { toast } = useToast()
  const [photos, setPhotos] = useState<GalleryPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [category, setCategory] = useState('Galeria')
  const [sharedTitle, setSharedTitle] = useState('')
  const [pending, setPending] = useState<PendingItem[]>([])
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

  useEffect(() => {
    return () => {
      pending.forEach((item) => URL.revokeObjectURL(item.preview))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const resetDialog = () => {
    pending.forEach((item) => URL.revokeObjectURL(item.preview))
    setPending([])
    setSharedTitle('')
    setCategory('Galeria')
    if (fileRef.current) fileRef.current.value = ''
  }

  const handlePickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    const room = MAX_FILES - pending.length
    if (room <= 0) {
      toast({
        title: 'Limite atingido',
        description: `Selecione no máximo ${MAX_FILES} imagens por vez.`,
        variant: 'destructive',
      })
      return
    }

    const selected = files.slice(0, room)
    const next: PendingItem[] = []
    for (const file of selected) {
      if (!file.type.startsWith('image/')) continue
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Arquivo ignorado',
          description: `${file.name} passa de 5MB.`,
          variant: 'destructive',
        })
        continue
      }
      next.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        preview: URL.createObjectURL(file),
        title: '',
      })
    }
    setPending((prev) => [...prev, ...next])
    if (fileRef.current) fileRef.current.value = ''
  }

  const removePending = (id: string) => {
    setPending((prev) => {
      const item = prev.find((p) => p.id === id)
      if (item) URL.revokeObjectURL(item.preview)
      return prev.filter((p) => p.id !== id)
    })
  }

  const handleSave = async () => {
    if (pending.length === 0) {
      toast({ title: 'Erro', description: 'Selecione ao menos uma imagem.', variant: 'destructive' })
      return
    }
    setSaving(true)
    const uploaded: Array<{ title: string; image_url: string; category: string }> = []
    const errors: string[] = []

    for (const item of pending) {
      const { url, error } = await uploadGalleryImage(item.file)
      if (error || !url) {
        errors.push(error || `${item.file.name}: falha no envio.`)
        continue
      }
      uploaded.push({
        title: item.title.trim() || sharedTitle.trim() || '',
        image_url: url,
        category,
      })
    }

    if (uploaded.length === 0) {
      setSaving(false)
      toast({
        title: 'Nenhuma imagem enviada',
        description: errors[0] || 'Tente novamente.',
        variant: 'destructive',
      })
      return
    }

    const { error, count } = await createGalleryPhotos(uploaded)
    setSaving(false)
    if (error) {
      toast({ title: 'Erro ao salvar', description: error, variant: 'destructive' })
      return
    }

    toast({
      title: count === 1 ? '1 foto publicada' : `${count} fotos publicadas`,
      description: errors.length ? `${errors.length} arquivo(s) falharam.` : undefined,
    })
    setOpen(false)
    resetDialog()
    fetchPhotos()
  }

  const handleDelete = async (id: string) => {
    const { error } = await deleteGalleryPhoto(id)
    if (error) {
      toast({ title: 'Erro', description: error, variant: 'destructive' })
      return
    }
    toast({ title: 'Foto excluída!' })
    setPhotos((prev) => prev.filter((photo) => photo.id !== id))
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Publique várias fotos de uma vez. O título é opcional.
        </p>
        <Button
          onClick={() => {
            resetDialog()
            setOpen(true)
          }}
          className="w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" /> Novas fotos
        </Button>
      </div>

      {photos.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">Nenhuma foto na galeria.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="group relative aspect-square overflow-hidden rounded-xl border border-white/5"
            >
              <img
                src={photo.image_url}
                alt={photo.title || 'Foto da galeria'}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-2">
                <span className="line-clamp-1 text-xs font-medium text-white">
                  {photo.title || photo.category}
                </span>
              </div>
              <Button
                size="icon"
                variant="destructive"
                className="absolute right-2 top-2 h-7 w-7"
                onClick={() => handleDelete(photo.id)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) resetDialog()
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Publicar fotos</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <Button
                    key={c}
                    size="sm"
                    type="button"
                    variant={category === c ? 'default' : 'outline'}
                    onClick={() => setCategory(c)}
                  >
                    {c}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="g-title">Título (opcional)</Label>
              <Input
                id="g-title"
                value={sharedTitle}
                onChange={(e) => setSharedTitle(e.target.value)}
                placeholder="Ex.: Apresentação 2026 — usado se a foto não tiver título próprio"
              />
            </div>

            <div className="space-y-2">
              <Label>Imagens</Label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handlePickFiles}
              />
              <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Selecionar várias imagens
              </Button>
              <p className="text-xs text-muted-foreground">
                Até {MAX_FILES} imagens por vez · WebP, PNG ou JPEG · máx. 5MB cada
              </p>
            </div>

            {pending.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {pending.map((item) => (
                  <div
                    key={item.id}
                    className="relative overflow-hidden rounded-lg border border-white/10"
                  >
                    <img src={item.preview} alt="" className="aspect-square w-full object-cover" />
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="absolute right-1 top-1 h-7 w-7"
                      onClick={() => removePending(item.id)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                    <div className="p-2">
                      <Input
                        value={item.title}
                        onChange={(e) =>
                          setPending((prev) =>
                            prev.map((p) =>
                              p.id === item.id ? { ...p, title: e.target.value } : p,
                            ),
                          )
                        }
                        placeholder="Título opcional"
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false)
                resetDialog()
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving || pending.length === 0}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Publicar {pending.length > 0 ? `(${pending.length})` : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
