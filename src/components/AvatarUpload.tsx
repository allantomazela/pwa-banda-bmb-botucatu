import { useRef, useState } from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Camera, Loader2, User } from 'lucide-react'
import { useAvatarUpload } from '@/hooks/use-avatar-upload'
import { useToast } from '@/hooks/use-toast'
import { ImageAdjustDialog } from '@/components/media/ImageAdjustDialog'

interface AvatarUploadProps {
  userId: string
  currentUrl: string
  name: string
  onUploaded: (url: string) => void
}

export function AvatarUpload({ userId, currentUrl, name, onUploaded }: AvatarUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const { upload, uploading } = useAvatarUpload()
  const { toast } = useToast()
  const [adjustFile, setAdjustFile] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O arquivo é muito grande. O tamanho máximo permitido é 5MB.',
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
    const url = await upload(userId, file)
    if (url) {
      onUploaded(url)
      toast({ title: 'Avatar atualizado!', description: 'Sua foto foi atualizada com sucesso.' })
    } else {
      toast({
        title: 'Erro no upload',
        description: 'Não foi possível enviar a imagem.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-20 w-20 border-2 border-primary">
        <AvatarImage
          src={
            currentUrl || `https://img.usecurling.com/ppl/medium?gender=male&seed=${userId}&dpr=2`
          }
          alt={name || 'Avatar'}
        />
        <AvatarFallback>
          <User className="h-8 w-8 text-muted-foreground" />
        </AvatarFallback>
      </Avatar>
      <div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
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
            <Camera className="mr-2 h-4 w-4" />
          )}
          {uploading ? 'Enviando...' : 'Alterar foto'}
        </Button>
        <p className="mt-1 text-xs text-muted-foreground">
          JPG, PNG ou WebP. Máx. 5MB. Você pode ajustar o enquadramento antes de enviar.
        </p>
      </div>

      <ImageAdjustDialog
        open={!!adjustFile}
        file={adjustFile}
        title="Ajustar foto de perfil"
        defaultAspect="1:1"
        onCancel={() => setAdjustFile(null)}
        onConfirm={handleAdjusted}
      />
    </div>
  )
}
