import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { formatPhoneBR, isMinor } from '@/lib/formatters'
import { isGuardian } from '@/lib/roles'
import { isGovBrSigningEnabled, signatureMethodLabel, startGovBrSign } from '@/services/govbr'
import {
  authorizationStatusBadgeClass,
  authorizationStatusMeta,
  listGuardianAuthorizations,
  listMyAuthorizations,
  signTravelAuthorization,
  summarizeStudentAuthOverview,
  type TravelAuthorizationWithTrip,
} from '@/services/travel'
import { listMyLinkedStudents } from '@/services/guardian-links'
import { SignaturePad, type SignaturePadHandle } from '@/components/portal/SignaturePad'
import { TravelAuthorizationPrintDoc } from '@/components/portal/TravelAuthorizationPrintDoc'
import { Badge } from '@/components/ui/badge'
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
import { AlertCircle, BadgeCheck, Bus, Clock3, FilePenLine, Loader2, Printer, ShieldCheck } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

const GOVBR_ERROR_MESSAGES: Record<string, string> = {
  not_configured: 'Integração Gov.br ainda não configurada no servidor.',
  invalid_state: 'Sessão Gov.br inválida. Tente assinar novamente.',
  expired: 'O prazo para concluir o login Gov.br expirou.',
  forbidden: 'Sem permissão para assinar esta autorização.',
  authorization_invalid: 'Autorização indisponível ou já processada.',
  update_failed: 'Não foi possível registrar a assinatura.',
  token_failed: 'Falha ao validar login Gov.br.',
  missing_code: 'Retorno Gov.br incompleto.',
}

export default function PortalAuthorizations() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [items, setItems] = useState<TravelAuthorizationWithTrip[]>([])
  const [loading, setLoading] = useState(true)
  const [modeReady, setModeReady] = useState(false)
  const [asGuardian, setAsGuardian] = useState(false)
  const [govbrEnabled, setGovbrEnabled] = useState(false)
  const [selected, setSelected] = useState<TravelAuthorizationWithTrip | null>(null)
  const [guardianName, setGuardianName] = useState('')
  const [guardianPhone, setGuardianPhone] = useState('')
  const [guardianDocument, setGuardianDocument] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [startingGovbr, setStartingGovbr] = useState(false)
  const [printAuth, setPrintAuth] = useState<TravelAuthorizationWithTrip | null>(null)
  const padRef = useRef<SignaturePadHandle>(null)
  const callbackHandled = useRef(false)

  const minor = isMinor(profile?.birth_date)
  const canSign = asGuardian

  useEffect(() => {
    let cancelled = false
    async function resolveGuardianMode() {
      if (!profile) return
      if (isGuardian(profile.role)) {
        if (!cancelled) {
          setAsGuardian(true)
          setModeReady(true)
        }
        return
      }
      try {
        const links = await listMyLinkedStudents()
        if (!cancelled) {
          setAsGuardian(links.length > 0)
          setModeReady(true)
        }
      } catch {
        if (!cancelled) {
          setAsGuardian(false)
          setModeReady(true)
        }
      }
    }
    setModeReady(false)
    void resolveGuardianMode()
    return () => {
      cancelled = true
    }
  }, [profile?.id, profile?.role])

  const refresh = async (guardianMode = asGuardian) => {
    setLoading(true)
    try {
      const rows = guardianMode
        ? await listGuardianAuthorizations()
        : await listMyAuthorizations()
      setItems(rows)
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
    if (profile && modeReady) void refresh(asGuardian)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, asGuardian, modeReady])

  useEffect(() => {
    isGovBrSigningEnabled()
      .then(setGovbrEnabled)
      .catch(() => setGovbrEnabled(false))
  }, [])

  useEffect(() => {
    const result = searchParams.get('govbr')
    if (!result || callbackHandled.current) return
    callbackHandled.current = true

    if (result === 'ok') {
      toast({
        title: 'Autorização assinada via Gov.br',
        description: 'Identidade verificada pelo Login Único.',
      })
      if (modeReady) void refresh(asGuardian)
    } else {
      const reason = searchParams.get('reason') || 'unknown'
      toast({
        title: 'Assinatura Gov.br não concluída',
        description: GOVBR_ERROR_MESSAGES[reason] || reason,
        variant: 'destructive',
      })
    }

    navigate('/portal/autorizacoes', { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, modeReady, asGuardian])

  const openSign = (item: TravelAuthorizationWithTrip) => {
    setSelected(item)
    setGuardianName(profile?.full_name || item.guardian_name || '')
    setGuardianPhone(profile?.phone || item.guardian_phone || profile?.guardian_phone || '')
    setGuardianDocument(item.guardian_document || profile?.cpf || '')
    setAccepted(false)
    padRef.current?.clear()
  }

  const handleGovBrSign = async () => {
    if (!selected) return
    if (!accepted) {
      toast({
        title: 'Confirmação necessária',
        description: 'Marque a ciência da autorização antes de continuar.',
        variant: 'destructive',
      })
      return
    }
    setStartingGovbr(true)
    const { error } = await startGovBrSign(selected.id)
    setStartingGovbr(false)
    if (error) {
      toast({ title: 'Gov.br indisponível', description: error, variant: 'destructive' })
    }
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

  if (!modeReady || loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!asGuardian && !minor) {
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

  const studentName = (item: TravelAuthorizationWithTrip) =>
    item.profiles?.full_name || 'Aluno vinculado'

  const studentOverview =
    !asGuardian && minor ? summarizeStudentAuthOverview(items.map((i) => i.status)) : null

  const overviewIcon =
    studentOverview?.tone === 'success' ? (
      <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
    ) : studentOverview?.tone === 'danger' ? (
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
    ) : studentOverview?.tone === 'warning' ? (
      <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
    ) : (
      <Bus className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
    )

  const overviewCardClass =
    studentOverview?.tone === 'success'
      ? 'border-emerald-500/30 bg-emerald-500/10'
      : studentOverview?.tone === 'danger'
        ? 'border-destructive/30 bg-destructive/10'
        : studentOverview?.tone === 'warning'
          ? 'border-amber-500/30 bg-amber-500/10'
          : 'border-white/10 bg-card/50'

  return (
    <div className="mx-auto max-w-3xl animate-fade-in space-y-6 p-4 sm:p-6 lg:p-10">
      <header>
        <h1 className="font-display text-3xl font-bold">Autorizações de viagem</h1>
        <p className="mt-1 text-muted-foreground">
          {asGuardian
            ? govbrEnabled
              ? 'Assine com Gov.br (identidade verificada) ou no aparelho com assinatura manuscrita.'
              : 'Assine as viagens dos alunos vinculados. A assinatura Gov.br será habilitada pela administração.'
            : 'Acompanhe o status. A assinatura é feita por um responsável legal vinculado (basta um).'}
        </p>
      </header>

      {studentOverview ? (
        <Card className={overviewCardClass}>
          <CardContent className="flex gap-3 py-4 text-sm">
            {overviewIcon}
            <div className="min-w-0 space-y-1">
              <p className="font-semibold text-foreground">{studentOverview.title}</p>
              <p className="text-muted-foreground">{studentOverview.description}</p>
              <p className="text-xs text-muted-foreground/90">
                Uso dos dados: somente para organizar e comprovar a autorização de viagem da BMB
                (LGPD).
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {items.length === 0 ? (
        <Card className="border-dashed border-white/15 bg-card/40">
          <CardContent className="space-y-2 py-14 text-center text-muted-foreground">
            <Bus className="mx-auto mb-3 h-10 w-10 opacity-40" />
            <p>Nenhuma autorização disponível no momento.</p>
            {asGuardian ? (
              <p className="text-xs">
                No painel admin, abra a viagem e use &quot;Gerar para menores aprovados&quot; para
                criar as pendências de assinatura.
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const trip = item.travel_trips
            const statusMeta = authorizationStatusMeta(item.status)
            return (
              <Card key={item.id} className="border-white/10 bg-card/50">
                <CardHeader className="pb-2">
                  <CardTitle className="flex min-w-0 flex-wrap items-center justify-between gap-2 text-lg">
                    <span className="min-w-0 break-words">{trip?.title || 'Viagem'}</span>
                    <Badge
                      variant="outline"
                      className={`shrink-0 text-[10px] font-bold uppercase tracking-wide ${authorizationStatusBadgeClass(statusMeta.tone)}`}
                    >
                      {statusMeta.label}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {asGuardian ? `${studentName(item)} · ` : ''}
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
                  {item.status === 'pending' && canSign ? (
                    <Button onClick={() => openSign(item)} className="min-h-11 w-full sm:w-auto">
                      <FilePenLine className="mr-2 h-4 w-4" />
                      Assinar autorização
                    </Button>
                  ) : null}
                  {item.status === 'pending' && !canSign ? (
                    <div className="rounded-md border border-amber-500/25 bg-amber-500/10 p-3 text-sm text-amber-50/90">
                      <p className="font-medium text-amber-100">Aguardando responsável</p>
                      <p className="mt-1 text-muted-foreground">{statusMeta.studentHint}</p>
                    </div>
                  ) : null}
                  {item.status === 'signed' ? (
                    <div className="space-y-3 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">
                      <div className="flex items-start gap-2">
                        <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                        <div className="min-w-0 space-y-1">
                          <p className="font-medium text-foreground">
                            {asGuardian
                              ? `Assinada${item.signature_method === 'govbr' ? ` via ${signatureMethodLabel(item.signature_method)}` : ''}`
                              : 'Autorizada — assinatura registrada'}
                          </p>
                          {!asGuardian ? (
                            <p className="text-muted-foreground">{statusMeta.studentHint}</p>
                          ) : null}
                          {!asGuardian && item.guardian_name ? (
                            <p className="text-foreground">
                              Assinado por: <strong>{item.guardian_name}</strong>
                            </p>
                          ) : null}
                          {asGuardian && item.govbr_name ? (
                            <p className="text-muted-foreground">{item.govbr_name}</p>
                          ) : null}
                          {item.signed_at ? (
                            <p className="text-xs text-muted-foreground">
                              Em {new Date(item.signed_at).toLocaleString('pt-BR')}
                            </p>
                          ) : null}
                          {trip?.destination ? (
                            <p className="text-xs text-muted-foreground">
                              Local da viagem: {trip.destination}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      {item.signature_data ? (
                        <img
                          src={item.signature_data}
                          alt="Assinatura registrada"
                          className="max-h-28 max-w-full rounded-md border border-white/10 bg-black object-contain"
                        />
                      ) : null}
                      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="min-h-11 w-full sm:w-auto"
                          onClick={() => setPrintAuth(item)}
                        >
                          <Printer className="mr-2 h-4 w-4" />
                          Documento / PDF
                        </Button>
                      </div>
                    </div>
                  ) : null}
                  {item.status === 'revoked' ? (
                    <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                      {statusMeta.studentHint}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <TravelAuthorizationPrintDoc
        open={!!printAuth}
        onOpenChange={(v) => !v && setPrintAuth(null)}
        auth={printAuth}
        student={
          asGuardian
            ? printAuth?.profiles
            : {
                full_name: profile?.full_name,
                registration_number: profile?.registration_number,
                birth_date: profile?.birth_date,
                cpf: profile?.cpf,
              }
        }
      />

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="max-h-[92dvh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assinar — {selected?.travel_trips?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Autorizo a participação do(a) aluno(a){' '}
              <strong className="text-foreground">
                {selected ? studentName(selected) : ''}
              </strong>{' '}
              na viagem indicada, sob responsabilidade do responsável abaixo.
            </p>

            <label className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-3 text-sm">
              <Checkbox checked={accepted} onCheckedChange={(v) => setAccepted(v === true)} />
              <span>
                Declaro que sou o responsável legal e autorizo a viagem nas condições informadas
                pela Banda Marcial de Botucatu.
              </span>
            </label>

            {govbrEnabled ? (
              <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-4">
                <p className="text-sm font-medium">Opção recomendada</p>
                <p className="text-xs text-muted-foreground">
                  Você será redirecionado ao Login Único Gov.br para confirmar sua identidade.
                </p>
                <Button
                  className="w-full"
                  onClick={handleGovBrSign}
                  disabled={startingGovbr || saving}
                >
                  {startingGovbr ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="mr-2 h-4 w-4" />
                  )}
                  Assinar com Gov.br
                </Button>
              </div>
            ) : null}

            <div className="space-y-3 border-t border-white/10 pt-4">
              <p className="text-sm font-medium">Assinar no aparelho</p>
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
                <Label>Assinatura manuscrita</Label>
                <SignaturePad ref={padRef} />
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button variant="outline" onClick={() => setSelected(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSign} disabled={saving || startingGovbr} variant="secondary">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirmar assinatura no aparelho
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

