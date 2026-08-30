import { useEffect, useRef, useState } from 'react'
import {
  createGalleryPhotos,
  deleteGalleryPhoto,
  getGalleryPhotos,
  getShowcasePhotoIds,
  MAX_HOME_SHOWCASE,
  setShowcasePhotoIds,
  toggleShowcasePhoto,
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
import { Loader2, Crop, Plus, Star, Trash2, Upload, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { ImageAdjustDialog } from '@/components/media/ImageAdjustDialog'

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
  const [showcaseIds, setShowcaseIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [category, setCategory] = useState('Galeria')
  const [sharedTitle, setSharedTitle] = useState('')
  const [addToHome, setAddToHome] = useState(false)
  const [pending, setPending] = useState<PendingItem[]>([])
  const [adjustingId, setAdjustingId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const fetchPhotos = async () => {
    setLoading(true)
    try {
      const [list, ids] = await Promise.all([getGalleryPhotos(), getShowcasePhotoIds()])
      setPhotos(list)
      setShowcaseIds(ids)
    } catch {
      setPhotos([])
      setShowcaseIds([])
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
    setAddToHome(false)
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
    if (next.length === 1) setAdjustingId(next[0].id)
  }

  const adjustingItem = pending.find((item) => item.id === adjustingId) ?? null

  const handleAdjustedPending = (file: File) => {
    if (!adjustingId) return
    setPending((prev) =>
      prev.map((item) => {
        if (item.id !== adjustingId) return item
        URL.revokeObjectURL(item.preview)
        return {
          ...item,
          file,
          preview: URL.createObjectURL(file),
        }
      }),
    )
    setAdjustingId(null)
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

    const { error, count, ids } = await createGalleryPhotos(uploaded)
    if (error) {
      setSaving(false)
      toast({ title: 'Erro ao salvar', description: error, variant: 'destructive' })
      return
    }

    if (addToHome && ids.length > 0) {
      const room = MAX_HOME_SHOWCASE - showcaseIds.length
      const toAdd = ids.slice(0, Math.max(0, room))
      if (toAdd.length) {
        const next = [...showcaseIds, ...toAdd]
        const { error: showcaseError } = await setShowcasePhotoIds(next)
        if (!showcaseError) setShowcaseIds(next)
      }
    }

    setSaving(false)
    toast({
      title: count === 1 ? '1 foto publicada' : `${count} fotos publicadas`,
      description: errors.length ? `${errors.length} arquivo(s) falharam.` : undefined,
    })
    setOpen(false)
    resetDialog()
    fetchPhotos()
  }

  const handleToggleHome = async (id: string) => {
    setTogglingId(id)
    const { error, ids } = await toggleShowcasePhoto(id)
    setTogglingId(null)
    if (error) {
      toast({ title: 'Atenção', description: error, variant: 'destructive' })
      return
    }
    setShowcaseIds(ids)
    toast({
      title: ids.includes(id) ? 'Foto no destaque da home' : 'Removida do destaque',
    })
  }

  const handleDelete = async (id: string) => {
    const { error } = await deleteGalleryPhoto(id)
    if (error) {
      toast({ title: 'Erro', description: error, variant: 'destructive' })
      return
    }
    toast({ title: 'Foto excluída!' })
    setPhotos((prev) => prev.filter((photo) => photo.id !== id))
    setShowcaseIds((prev) => prev.filter((item) => item !== id))
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            Publique várias fotos de uma vez. O título é opcional.
          </p>
          <p className="text-xs text-muted-foreground">
            Toque na estrela para escolher quais passam no card da home ({showcaseIds.length}/
            {MAX_HOME_SHOWCASE}). Clique na foto da home abre a galeria completa.
          </p>
        </div>
        <Button
          onClick={() => {
            resetDialog()
            setOpen(true)
          }}
          className="w-full sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" /> Novas fotos
        </Button>
      </div>

      {photos.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">Nenhuma foto na galeria.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((photo) => {
            const onHome = showcaseIds.includes(photo.id)
            return (
              <div
                key={photo.id}
                className={cn(
                  'group relative aspect-square overflow-hidden rounded-xl border',
                  onHome ? 'border-primary/60' : 'border-white/5',
                )}
              >
                <img
                  src={photo.image_url}
                  alt={photo.title || 'Foto da galeria'}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-2">
                  <span className="line-clamp-1 text-xs font-medium text-white">
                    {photo.title || photo.category}
                    {onHome ? ' · Home' : ''}
                  </span>
                </div>
                <Button
                  size="icon"
                  type="button"
                  variant="secondary"
                  className={cn(
                    'absolute left-2 top-2 h-7 w-7',
                    onHome
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'bg-black/50 text-white hover:bg-black/70',
                  )}
                  disabled={togglingId === photo.id}
                  onClick={() => handleToggleHome(photo.id)}
                  aria-label={onHome ? 'Remover do destaque da home' : 'Exibir na home'}
                  title={onHome ? 'Remover do destaque da home' : 'Exibir na home'}
                >
                  {togglingId === photo.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Star className={cn('h-3.5 w-3.5', onHome && 'fill-current')} />
                  )}
                </Button>
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute right-2 top-2 h-7 w-7"
                  onClick={() => handleDelete(photo.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )
          })}
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

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
              <input
                type="checkbox"
                className="mt-1"
                checked={addToHome}
                onChange={(e) => setAddToHome(e.target.checked)}
              />
              <span className="text-sm">
                <span className="font-medium text-white">Exibir no destaque da home</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  As fotos publicadas entram no carrossel principal (até {MAX_HOME_SHOWCASE}).
                </span>
              </span>
            </label>

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
                      className="absolute left-1 top-1 h-7 w-7"
                      onClick={() => setAdjustingId(item.id)}
                      title="Ajustar enquadramento"
                    >
                      <Crop className="h-3.5 w-3.5" />
                    </Button>
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

      <ImageAdjustDialog
        open={!!adjustingItem}
        file={adjustingItem?.file ?? null}
        title="Ajustar foto da galeria"
        defaultAspect="free"
        onCancel={() => setAdjustingId(null)}
        onConfirm={handleAdjustedPending}
      />
    </div>
  )
}
