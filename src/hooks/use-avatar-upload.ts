import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'

export function useAvatarUpload() {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const upload = useCallback(async (userId: string, file: File): Promise<string | null> => {
    if (!userId) return null
    setUploading(true)
    setError(null)

    const ext = file.name.split('.').pop() || 'jpg'
    const fileName = `${userId}/avatar-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true })

    if (uploadError) {
      setError(uploadError.message)
      setUploading(false)
      return null
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
    setUploading(false)
    return data.publicUrl
  }, [])

  return { uploading, error, upload }
}
