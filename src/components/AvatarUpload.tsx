import { useRef } from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Camera, Loader2, User } from 'lucide-react'
import { useAvatarUpload } from '@/hooks/use-avatar-upload'
import { useToast } from '@/hooks/use-toast'

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Arquivo muito grande', description: 'Máximo 2MB.', variant: 'destructive' })
      return
    }
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
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-20 w-20 border-2 border-primary">
        <AvatarImage
          src={currentUrl || `https://img.usecurling.com/ppl/medium?gender=male&seed=${userId}`}
        />
        <AvatarFallback>
          <User className="w-8 h-8 text-muted-foreground" />
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
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Camera className="w-4 h-4 mr-2" />
          )}
          {uploading ? 'Enviando...' : 'Alterar foto'}
        </Button>
        <p className="text-xs text-muted-foreground mt-1">JPG, PNG ou WebP. Máx 2MB.</p>
      </div>
    </div>
  )
}
