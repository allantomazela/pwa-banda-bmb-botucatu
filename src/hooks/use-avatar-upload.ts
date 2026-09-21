import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'

function mimeFromFile(file: File): string {
  if (file.type && file.type.startsWith('image/')) return file.type
  const lower = file.name.toLowerCase()
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.webp')) return 'image/webp'
  return 'image/jpeg'
}

function extFromMime(mime: string): string {
  if (mime === 'image/png') return 'png'
  if (mime === 'image/webp') return 'webp'
  return 'jpg'
}

export function useAvatarUpload() {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const upload = useCallback(
    async (userId: string, file: File): Promise<{ url: string | null; error: string | null }> => {
      if (!userId) {
        const message = 'Usuário inválido para upload.'
        setError(message)
        return { url: null, error: message }
      }
      setUploading(true)
      setError(null)

      const contentType = mimeFromFile(file)
      const ext = extFromMime(contentType)
      const fileName = `${userId}/avatar.${ext}`

      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, {
        upsert: true,
        contentType,
        cacheControl: '3600',
      })

      if (uploadError) {
        const message = /row-level security|policy|not allowed|403|401|400/i.test(
          uploadError.message,
        )
          ? 'Sem permissão para enviar esta foto. Confirme que está logado como administrador ou dono do perfil.'
          : uploadError.message || 'Falha no envio da foto.'
        setError(message)
        setUploading(false)
        return { url: null, error: message }
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
      const publicUrl = `${data.publicUrl}?v=${Date.now()}`
      setUploading(false)
      return { url: publicUrl, error: null }
    },
    [],
  )

  return { uploading, error, upload }
}
