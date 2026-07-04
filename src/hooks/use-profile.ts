import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { getProfile, Profile } from '@/services/profiles'

export function useProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }

    let mounted = true
    setLoading(true)

    const fetchProfile = async () => {
      const data = await getProfile(user.id)
      if (mounted) {
        setProfile(data)
        setLoading(false)
      }
    }

    fetchProfile()

    return () => {
      mounted = false
    }
  }, [user])

  return { profile, loading }
}
