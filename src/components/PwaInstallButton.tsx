import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { isStandaloneMode, requestPwaInstallPrompt } from '@/lib/pwa'

type PwaInstallButtonProps = {
  className?: string
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  label?: string
}

/** Botão para reabrir o guia de instalação (útil no iPhone). */
export function PwaInstallButton({
  className,
  variant = 'outline',
  size = 'sm',
  label = 'Instalar app',
}: PwaInstallButtonProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    setShow(!isStandaloneMode())
  }, [])

  if (!show) return null

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn('min-h-11 gap-2', className)}
      onClick={() => requestPwaInstallPrompt()}
    >
      <Download className="h-4 w-4" />
      {label}
    </Button>
  )
}
