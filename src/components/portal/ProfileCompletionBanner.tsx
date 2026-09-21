import { Link } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { getProfileCompletion, type ProfileCompletionInput } from '@/lib/profile-completion'

export function ProfileCompletionBanner({
  profile,
}: {
  profile: ProfileCompletionInput | null | undefined
}) {
  const { isComplete, percent, missingLabels } = getProfileCompletion(profile)
  if (isComplete) return null

  return (
    <Alert className="mb-4 border-amber-500/35 bg-amber-500/10 text-amber-50 [&>svg]:text-amber-300">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="text-amber-100">Complete seu perfil ({percent}%)</AlertTitle>
      <AlertDescription className="mt-1 flex flex-col gap-3 text-amber-100/85 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm">
          Faltam: {missingLabels.join(', ')}. Mantenha os dados atualizados para a carteirinha e
          autorizações.
        </span>
        <Button
          asChild
          size="sm"
          variant="outline"
          className="h-9 shrink-0 border-amber-400/50 bg-amber-500/10 text-amber-100 hover:bg-amber-500/20 hover:text-white"
        >
          <Link to="/portal/perfil">Preencher perfil</Link>
        </Button>
      </AlertDescription>
    </Alert>
  )
}
