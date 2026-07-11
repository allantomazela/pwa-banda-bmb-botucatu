import { useAuth } from '@/hooks/use-auth'
import { DigitalIdCard } from '@/components/portal/DigitalIdCard'

export default function DigitalId() {
  const { profile } = useAuth()

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Carregando perfil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-3 sm:px-4 py-8 animate-fade-in">
      <div className="text-center mb-6 no-print w-full max-w-[340px]">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1">Carteirinha Digital</h1>
        <p className="text-sm text-muted-foreground">Toque no cartão para ver o verso</p>
      </div>
      <div className="w-full max-w-[340px] flex justify-center">
        <DigitalIdCard profile={profile} />
      </div>
    </div>
  )
}
