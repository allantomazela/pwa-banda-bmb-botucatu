import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { Switch } from '@/components/ui/switch'
import { Loader2, Upload } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { SECTION_TYPE_LABELS, SECTION_TYPES, toEmbedUrl, type SectionType } from '@/lib/cms'
import { createSection, updateSection, type SiteSection } from '@/services/site-cms'
import { uploadGalleryImage } from '@/services/gallery'
import { ImageAdjustDialog } from '@/components/media/ImageAdjustDialog'

const EMPTY = {
  section_type: 'text' as SectionType,
  title: '',
  body: '',
  media_url: '',
  link_url: '',
  link_label: '',
  is_visible: true,
}

type Props = {
  open: boolean
  pageId: string
  nextOrder: number
  editing: SiteSection | null
  onClose: () => void
  onSaved: () => void
}

export function SectionFormDialog({ open, pageId, nextOrder, editing, onClose, onSaved }: Props) {
  const { toast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [adjustFile, setAdjustFile] = useState<File | null>(null)
  const [form, setForm] = useState(EMPTY)

  useEffect(() => {
    if (!open) return
    if (editing) {
      setForm({
        section_type: editing.section_type as SectionType,
        title: editing.title,
        body: editing.body,
        media_url: editing.media_url,
        link_url: editing.link_url,
        link_label: editing.link_label,
        is_visible: editing.is_visible,
      })
    } else {
      setForm(EMPTY)
    }
  }, [open, editing])

  const set = (key: keyof typeof EMPTY) => (value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Erro',
        description: 'Arquivo muito grande (máx 5MB).',
        variant: 'destructive',
      })
      if (fileRef.current) fileRef.current.value = ''
      return
    }
    setAdjustFile(file)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleAdjusted = async (file: File) => {
    setAdjustFile(null)
    setUploading(true)
    const { url, error } = await uploadGalleryImage(file)
    setUploading(false)
    if (url) {
      setForm((prev) => ({ ...prev, media_url: url }))
      toast({ title: 'Imagem enviada!' })
    } else {
      toast({
        title: 'Erro',
        description: error || 'Falha no upload.',
        variant: 'destructive',
      })
    }
  }

  const handleSave = async () => {
    if (form.section_type === 'image' && !form.media_url) {
      toast({ title: 'Erro', description: 'Envie ou informe a imagem.', variant: 'destructive' })
      return
    }
    if (form.section_type === 'video' && !form.media_url.trim()) {
      toast({ title: 'Erro', description: 'Informe a URL do vídeo.', variant: 'destructive' })
      return
    }
    setSaving(true)
    const payload = {
      ...form,
      media_url: form.section_type === 'video' ? toEmbedUrl(form.media_url) : form.media_url,
    }
    const { error } = editing
      ? await updateSection(editing.id, payload)
      : await createSection({ ...payload, page_id: pageId, sort_order: nextOrder })
    setSaving(false)
    if (error) {
      toast({ title: 'Erro', description: error, variant: 'destructive' })
      return
    }
    toast({ title: editing ? 'Seção atualizada!' : 'Seção criada!' })
    onSaved()
    onClose()
  }

  return (
    <>
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar seção' : 'Nova seção'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={form.section_type} onValueChange={(v) => set('section_type')(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SECTION_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {SECTION_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Título</Label>
            <Input value={form.title} onChange={(e) => set('title')(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Texto</Label>
            <Textarea rows={4} value={form.body} onChange={(e) => set('body')(e.target.value)} />
          </div>
          {form.section_type === 'image' ? (
            <div className="space-y-2">
              <Label>Imagem</Label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                {uploading ? 'Enviando...' : 'Enviar imagem'}
              </Button>
              {form.media_url ? (
                <img src={form.media_url} alt="" className="h-24 rounded-md object-cover" />
              ) : null}
            </div>
          ) : null}
          {form.section_type === 'video' ? (
            <div className="space-y-2">
              <Label>URL do vídeo (YouTube ou Vimeo)</Label>
              <Input
                value={form.media_url}
                onChange={(e) => set('media_url')(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>
          ) : null}
          {form.section_type === 'cta' ? (
            <>
              <div className="space-y-2">
                <Label>Link do botão</Label>
                <Input
                  value={form.link_url}
                  onChange={(e) => set('link_url')(e.target.value)}
                  placeholder="/contato"
                />
              </div>
              <div className="space-y-2">
                <Label>Texto do botão</Label>
                <Input
                  value={form.link_label}
                  onChange={(e) => set('link_label')(e.target.value)}
                  placeholder="Saiba mais"
                />
              </div>
            </>
          ) : null}
          <div className="flex items-center justify-between">
            <Label htmlFor="visible">Visível no site</Label>
            <Switch
              id="visible"
              checked={form.is_visible}
              onCheckedChange={(checked) => set('is_visible')(checked)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <ImageAdjustDialog
      open={!!adjustFile}
      file={adjustFile}
      title="Ajustar imagem da seção"
      defaultAspect="16:9"
      onCancel={() => setAdjustFile(null)}
      onConfirm={handleAdjusted}
    />
    </>
  )
}
