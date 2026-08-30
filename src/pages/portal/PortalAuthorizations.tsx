import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { formatPhoneBR, isMinor } from '@/lib/formatters'
import {
  authorizationStatusLabel,
  listMyAuthorizations,
  signTravelAuthorization,
  type TravelAuthorizationWithTrip,
} from '@/services/travel'
import { SignaturePad, type SignaturePadHandle } from '@/components/portal/SignaturePad'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { Bus, FilePenLine, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function PortalAuthorizations() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [items, setItems] = useState<TravelAuthorizationWithTrip[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<TravelAuthorizationWithTrip | null>(null)
  const [guardianName, setGuardianName] = useState('')
  const [guardianPhone, setGuardianPhone] = useState('')
  const [guardianDocument, setGuardianDocument] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [saving, setSaving] = useState(false)
  const padRef = useRef<SignaturePadHandle>(null)

  const minor = isMinor(profile?.birth_date)

  const refresh = async () => {
    setLoading(true)
    try {
      setItems(await listMyAuthorizations())
    } catch {
      setItems([])
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as autorizações.',
        variant: 'destructive',
      })
    }
    setLoading(false)
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openSign = (item: TravelAuthorizationWithTrip) => {
    setSelected(item)
    setGuardianName(item.guardian_name || profile?.guardian_name || '')
    setGuardianPhone(item.guardian_phone || profile?.guardian_phone || '')
    setGuardianDocument(item.guardian_document || '')
    setAccepted(false)
    padRef.current?.clear()
  }

  const handleSign = async () => {
    if (!selected) return
    if (!guardianName.trim() || !guardianPhone.trim() || !guardianDocument.trim()) {
      toast({
        title: 'Dados incompletos',
        description: 'Preencha nome, telefone e documento do responsável.',
        variant: 'destructive',
      })
      return
    }
    if (!accepted) {
      toast({
        title: 'Confirmação necessária',
        description: 'Marque a ciência da autorização.',
        variant: 'destructive',
      })
      return
    }
    const signature = padRef.current?.toDataUrl()
    if (!signature) {
      toast({
        title: 'Assinatura ausente',
        description: 'Desenhe a assinatura no quadro.',
        variant: 'destructive',
      })
      return
    }
    setSaving(true)
    const { error } = await signTravelAuthorization({
      authorizationId: selected.id,
      guardianName,
      guardianPhone,
      guardianDocument,
      signatureData: signature,
    })
    setSaving(false)
    if (error) {
      toast({ title: 'Erro ao assinar', description: error, variant: 'destructive' })
      return
    }
    toast({ title: 'Autorização assinada!' })
    setSelected(null)
    refresh()
  }

  if (!minor) {
    return (
      <div className="mx-auto max-w-2xl animate-fade-in space-y-4 p-4 sm:p-6 lg:p-10">
        <h1 className="font-display text-3xl font-bold">Autorizações de viagem</h1>
        <Card className="border-white/10 bg-card/50">
          <CardContent className="py-10 text-center text-muted-foreground">
            Autorizações de viagem são exigidas apenas para alunos menores de 18 anos.
            {profile?.birth_date ? null : (
              <p className="mt-3 text-sm">
                Complete sua{' '}
                <Link to="/portal/perfil" className="text-primary underline">
                  data de nascimento no perfil
                </Link>
                .
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl animate-fade-in space-y-6 p-4 sm:p-6 lg:p-10">
      <header>
        <h1 className="font-display text-3xl font-bold">Autorizações de viagem</h1>
        <p className="mt-1 text-muted-foreground">
          O responsável deve assinar cada viagem. Nesta fase a assinatura é manuscrita no aparelho;
          em seguida poderemos integrar Gov.br.
        </p>
      </header>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <Card className="border-dashed border-white/15 bg-card/40">
          <CardContent className="py-14 text-center text-muted-foreground">
            <Bus className="mx-auto mb-3 h-10 w-10 opacity-40" />
            Nenhuma autorização disponível no momento.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const trip = item.travel_trips
            return (
              <Card key={item.id} className="border-white/10 bg-card/50">
                <CardHeader className="pb-2">
                  <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-lg">
                    <span>{trip?.title || 'Viagem'}</span>
                    <span className="text-xs font-bold uppercase tracking-wide text-primary">
                      {authorizationStatusLabel(item.status)}
                    </span>
                  </CardTitle>
                  <CardDescription>
                    {trip?.destination || 'Destino a definir'}
                    {trip?.departure_at
                      ? ` · ${new Date(trip.departure_at).toLocaleString('pt-BR')}`
                      : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {trip?.description ? (
                    <p className="text-sm text-muted-foreground">{trip.description}</p>
                  ) : null}
                  {item.status === 'pending' ? (
                    <Button onClick={() => openSign(item)}>
                      <FilePenLine className="mr-2 h-4 w-4" />
                      Assinar autorização
                    </Button>
                  ) : null}
                  {item.status === 'signed' && item.signature_data ? (
                    <img
                      src={item.signature_data}
                      alt="Assinatura registrada"
                      className="max-h-28 rounded-md border border-white/10 bg-black"
                    />
                  ) : null}
                  {item.status === 'revoked' ? (
                    <p className="text-sm text-destructive">
                      Esta autorização foi revogada pela administração.
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="max-h-[92dvh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assinar — {selected?.travel_trips?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Autorizo a participação do(a) aluno(a){' '}
              <strong className="text-foreground">{profile?.full_name}</strong> na viagem indicada,
              sob responsabilidade do responsável abaixo.
            </p>
            <div className="space-y-2">
              <Label>Nome do responsável</Label>
              <Input value={guardianName} onChange={(e) => setGuardianName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Telefone do responsável</Label>
              <Input
                value={guardianPhone}
                onChange={(e) => setGuardianPhone(formatPhoneBR(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Documento do responsável (CPF ou RG)</Label>
              <Input
                value={guardianDocument}
                onChange={(e) => setGuardianDocument(e.target.value)}
                placeholder="CPF ou RG"
              />
            </div>
            <div className="space-y-2">
              <Label>Assinatura do responsável</Label>
              <SignaturePad ref={padRef} />
            </div>
            <label className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-3 text-sm">
              <Checkbox checked={accepted} onCheckedChange={(v) => setAccepted(v === true)} />
              <span>
                Declaro que sou o responsável legal e autorizo a viagem nas condições informadas
                pela Banda Marcial de Botucatu.
              </span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSign} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirmar assinatura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
