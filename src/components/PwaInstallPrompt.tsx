import { useEffect, useState } from 'react'
import { Share, X, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  dismissInstallPrompt,
  isIosSafari,
  isStandaloneMode,
  wasInstallPromptDismissed,
} from '@/lib/pwa'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PwaInstallPrompt() {
  const [visible, setVisible] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIos, setIsIos] = useState(false)

  useEffect(() => {
    if (isStandaloneMode() || wasInstallPromptDismissed()) return

    const ios = isIosSafari()
    setIsIos(ios)

    if (ios) {
      const timer = window.setTimeout(() => setVisible(true), 2500)
      return () => window.clearTimeout(timer)
    }

    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  }, [])

  function closePrompt() {
    dismissInstallPrompt()
    setVisible(false)
    setDeferredPrompt(null)
  }

  async function installAndroid() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    closePrompt()
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Instalar aplicativo"
      className="fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] z-[60] px-3 pb-2 sm:bottom-4 sm:px-4 lg:bottom-6"
    >
      <div className="mx-auto max-w-lg rounded-xl border border-primary/30 bg-card/95 p-4 shadow-lg backdrop-blur-md">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            {isIos ? <Share className="h-5 w-5" /> : <Download className="h-5 w-5" />}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-sm font-semibold leading-snug">Instale o app da BMB</p>
            {isIos ? (
              <p className="text-xs leading-relaxed text-muted-foreground">
                No iPhone, toque em <strong className="text-foreground">Compartilhar</strong> na barra
                do Safari e escolha <strong className="text-foreground">Adicionar à Tela de Início</strong>.
              </p>
            ) : (
              <p className="text-xs leading-relaxed text-muted-foreground">
                Acesse mais rápido com o app instalado na tela inicial do seu celular.
              </p>
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              {!isIos && deferredPrompt ? (
                <Button size="sm" className="h-8 text-xs" onClick={installAndroid}>
                  Instalar agora
                </Button>
              ) : null}
              <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={closePrompt}>
                Agora não
              </Button>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground"
            aria-label="Fechar"
            onClick={closePrompt}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
