import { useEffect, useState } from 'react'
import { Download, PlusSquare, Share, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  dismissInstallPrompt,
  isIosDevice,
  isIosSafari,
  isStandaloneMode,
  PWA_OPEN_INSTALL_EVENT,
  wasInstallPromptDismissed,
} from '@/lib/pwa'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PwaInstallPrompt() {
  const [open, setOpen] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIos, setIsIos] = useState(false)
  const [iosSafari, setIosSafari] = useState(false)

  useEffect(() => {
    if (isStandaloneMode()) return

    const ios = isIosDevice()
    const safari = isIosSafari()
    setIsIos(ios)
    setIosSafari(safari)

    function openGuide() {
      if (isStandaloneMode()) return
      setOpen(true)
    }

    function onRequestOpen() {
      openGuide()
    }

    window.addEventListener(PWA_OPEN_INSTALL_EVENT, onRequestOpen)

    if (ios) {
      if (!wasInstallPromptDismissed()) {
        const timer = window.setTimeout(openGuide, 1800)
        return () => {
          window.clearTimeout(timer)
          window.removeEventListener(PWA_OPEN_INSTALL_EVENT, onRequestOpen)
        }
      }
      return () => window.removeEventListener(PWA_OPEN_INSTALL_EVENT, onRequestOpen)
    }

    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
      if (!wasInstallPromptDismissed()) {
        setOpen(true)
      }
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener(PWA_OPEN_INSTALL_EVENT, onRequestOpen)
    }
  }, [])

  function closePrompt(persistDismiss: boolean) {
    if (persistDismiss) dismissInstallPrompt()
    setOpen(false)
  }

  async function installAndroid() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
    closePrompt(true)
  }

  if (isStandaloneMode()) return null

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) closePrompt(true)
        else setOpen(true)
      }}
    >
      <DialogContent className="max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-md overflow-y-auto rounded-2xl border-primary/25 p-0 sm:w-full">
        <div className="relative px-5 pb-5 pt-6 pr-14 sm:px-6 sm:pr-14">
          <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-primary/15 blur-2xl" />
          <DialogHeader className="space-y-3 text-left">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
              {isIos ? <Smartphone className="h-5 w-5" /> : <Download className="h-5 w-5" />}
            </div>
            <DialogTitle className="text-xl font-bold leading-tight">
              Instalar o app da BMB
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
              {isIos
                ? 'No iPhone a Apple não permite instalação automática. Use o Safari e adicione à Tela de Início — fica como app.'
                : 'Instale na tela inicial para abrir mais rápido, como um aplicativo.'}
            </DialogDescription>
          </DialogHeader>

          {isIos ? (
            <ol className="mt-5 space-y-3 text-sm">
              {!iosSafari ? (
                <li className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-3 text-amber-50">
                  Abra este site no <strong className="text-white">Safari</strong> (ícone da bússola).
                  Pelo Chrome ou Instagram o iPhone não permite “Adicionar à Tela de Início”.
                </li>
              ) : null}
              <li className="flex gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                  1
                </span>
                <div className="min-w-0">
                  <p className="font-medium text-foreground">Toque em Compartilhar</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    O ícone <Share className="mx-0.5 inline h-3.5 w-3.5 align-text-bottom" /> na barra
                    inferior (ou superior) do Safari.
                  </p>
                </div>
              </li>
              <li className="flex gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                  2
                </span>
                <div className="min-w-0">
                  <p className="font-medium text-foreground">Adicionar à Tela de Início</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Role a lista e escolha a opção com o ícone{' '}
                    <PlusSquare className="mx-0.5 inline h-3.5 w-3.5 align-text-bottom" />.
                  </p>
                </div>
              </li>
              <li className="flex gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                  3
                </span>
                <div className="min-w-0">
                  <p className="font-medium text-foreground">Confirme em Adicionar</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    O ícone <strong className="text-foreground">BMB</strong> aparece na tela inicial,
                    como um app.
                  </p>
                </div>
              </li>
            </ol>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              Toque em <strong className="text-foreground">Instalar agora</strong> para confirmar no
              navegador.
            </p>
          )}

          <DialogFooter className="mt-6 flex-col gap-2 sm:flex-col">
            {!isIos && deferredPrompt ? (
              <Button className="h-11 w-full" onClick={installAndroid}>
                <Download className="mr-2 h-4 w-4" />
                Instalar agora
              </Button>
            ) : null}
            <Button variant="outline" className="h-11 w-full" onClick={() => closePrompt(true)}>
              Entendi
            </Button>
            <Button
              variant="ghost"
              className="h-11 w-full text-muted-foreground"
              onClick={() => closePrompt(true)}
            >
              Agora não
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
