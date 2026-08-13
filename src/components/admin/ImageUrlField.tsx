import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Upload } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { uploadSiteImage } from '@/services/gallery'

type Props = {
  id: string
  label: string
  hint: string
  value: string
  kind: 'logo' | 'hero'
  accept: string
  onChange: (url: string) => void
}

export function ImageUrlField({ id, label, hint, value, kind, accept, onChange }: Props) {
  const { toast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const { url, error } = await uploadSiteImage(file, kind)
    setUploading(false)
    if (error || !url) {
      toast({ title: 'Erro', description: error || 'Falha no envio.', variant: 'destructive' })
    } else {
      onChange(url)
      toast({ title: 'Imagem enviada!', description: 'Clique em Salvar Configurações para aplicar.' })
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <p className="text-xs text-muted-foreground">{hint}</p>
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ou cole uma URL"
        />
        <input ref={fileRef} type="file" accept={accept} className="hidden" onChange={handleUpload} />
        <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
          Importar
        </Button>
      </div>
      {value ? (
        <img
          src={value}
          alt=""
          className={kind === 'logo' ? 'h-16 w-16 rounded-lg object-cover border border-white/10' : 'h-28 w-full max-w-md rounded-lg object-cover border border-white/10'}
        />
      ) : null}
    </div>
  )
}
