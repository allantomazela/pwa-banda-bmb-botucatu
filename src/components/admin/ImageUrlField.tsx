import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Upload } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { uploadSiteImage } from '@/services/gallery'
import {
  ImageAdjustDialog,
  type ImageAdjustAspect,
} from '@/components/media/ImageAdjustDialog'

type Props = {
  id: string
  label: string
  hint: string
  value: string
  kind: 'logo' | 'hero' | 'sponsor' | 'event'
  accept: string
  successDescription?: string
  defaultAspect?: ImageAdjustAspect
  onChange: (url: string) => void
}

function defaultAspectFor(kind: Props['kind']): ImageAdjustAspect {
  if (kind === 'logo' || kind === 'sponsor') return '1:1'
  if (kind === 'event') return '3:4'
  return 'free'
}

export function ImageUrlField({
  id,
  label,
  hint,
  value,
  kind,
  accept,
  successDescription = 'Clique em Salvar Configurações para aplicar.',
  defaultAspect,
  onChange,
}: Props) {
  const { toast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [adjustFile, setAdjustFile] = useState<File | null>(null)

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAdjustFile(file)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleAdjusted = async (file: File) => {
    setAdjustFile(null)
    setUploading(true)
    const { url, error } = await uploadSiteImage(file, kind)
    setUploading(false)
    if (error || !url) {
      toast({ title: 'Erro', description: error || 'Falha no envio.', variant: 'destructive' })
      return
    }
    onChange(url)
    toast({ title: 'Imagem enviada!', description: successDescription })
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <p className="text-xs text-muted-foreground">{hint}</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ou cole uma URL"
        />
        <input
          ref={fileRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handlePick}
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
          Importar
        </Button>
      </div>
      {value ? (
        <div className="relative inline-block">
          <img
            src={value}
            alt=""
            className={
              kind === 'hero'
                ? 'h-28 w-full max-w-md rounded-lg border border-white/10 object-cover'
                : kind === 'event'
                  ? 'h-40 w-auto max-w-[12rem] rounded-lg border border-white/10 object-cover'
                  : 'h-16 w-auto max-w-[160px] rounded-lg border border-white/10 bg-white/5 object-contain p-2'
            }
          />
        </div>
      ) : null}

      <ImageAdjustDialog
        open={!!adjustFile}
        file={adjustFile}
        title="Ajustar imagem antes de publicar"
        defaultAspect={defaultAspect ?? defaultAspectFor(kind)}
        onCancel={() => setAdjustFile(null)}
        onConfirm={handleAdjusted}
      />
    </div>
  )
}
