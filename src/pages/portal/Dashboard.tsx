import { useAuth } from '@/hooks/use-auth'
import { useFetch } from '@/hooks/use-fetch'
import { getNextEvent, type EventItem } from '@/services/events'
import { getMaterials, type Material } from '@/services/materials'
import { listMyLinkedStudents } from '@/services/guardian-links'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, FileText, ChevronRight, FilePenLine, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { isMinor } from '@/lib/formatters'
import { isGuardian } from '@/lib/roles'

export default function Dashboard() {
  const { profile } = useAuth()
  const guardian = isGuardian(profile?.role)
  const { data: nextEvent } = useFetch<EventItem | null>(getNextEvent, [guardian])
  const { data: materials } = useFetch<Material[]>(
    () => (guardian ? Promise.resolve([]) : getMaterials().then((m) => m.slice(0, 3))),
    [guardian],
  )
  const { data: linkedStudents } = useFetch(
    () => (guardian ? listMyLinkedStudents() : Promise.resolve([])),
    [guardian, profile?.id],
  )

  const firstName = profile?.full_name?.split(' ')[0] || (guardian ? 'responsável' : 'membro')
  const showTravel = !guardian && isMinor(profile?.birth_date)

  if (guardian) {
    return (
      <div className="mx-auto max-w-5xl animate-fade-in space-y-8 p-4 sm:p-6 lg:p-10">
        <header>
          <h1 className="font-display text-3xl font-bold">Olá, {firstName}!</h1>
          <p className="text-muted-foreground">
            Portal do responsável — acompanhe e assine autorizações dos alunos vinculados.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/20 to-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-primary" /> Alunos vinculados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {linkedStudents && linkedStudents.length > 0 ? (
                <ul className="space-y-2">
                  {linkedStudents.map((link) => (
                    <li
                      key={link.id}
                      className="rounded-md border border-white/10 bg-background/40 px-3 py-2 text-sm"
                    >
                      <p className="font-medium">{link.profiles?.full_name || 'Aluno'}</p>
                      <p className="text-xs text-muted-foreground">
                        {link.relationship}
                        {link.profiles?.registration_number
                          ? ` · Matrícula ${link.profiles.registration_number}`
                          : ''}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhum aluno vinculado ainda. Se você recebeu um convite, faça login com o e-mail
                  convidado ou aguarde a administração.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-amber-500/25 bg-gradient-to-br from-amber-500/10 to-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FilePenLine className="h-5 w-5 text-primary" /> Autorizações de viagem
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Somente você assina as autorizações dos menores vinculados.
              </p>
              <Button asChild variant="outline">
                <Link to="/portal/autorizacoes">Ver e assinar</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="border-white/5 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-primary" /> Próximo compromisso da banda
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nextEvent ? (
              <div>
                <h4 className="mb-1 font-bold text-white">{nextEvent.title}</h4>
                <p className="mb-3 text-sm text-muted-foreground">
                  {new Date(nextEvent.event_date).toLocaleDateString('pt-BR')} às{' '}
                  {new Date(nextEvent.event_date).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                <div className="inline-block rounded bg-background/50 px-2 py-1 text-xs text-muted-foreground">
                  {nextEvent.location}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum evento próximo.</p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl animate-fade-in space-y-8 p-4 sm:p-6 lg:p-10">
      <header>
        <h1 className="font-display text-3xl font-bold">Ola, {firstName}!</h1>
        <p className="text-muted-foreground">Bem-vindo de volta ao Portal do Aluno BMB.</p>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/20 to-card">
          <div className="-mr-10 -mt-10 absolute right-0 top-0 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2">Identidade Digital</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-primary">
                <AvatarImage
                  src={
                    profile?.avatar_url ||
                    `https://img.usecurling.com/ppl/medium?gender=male&seed=${profile?.id || 'default'}&dpr=2`
                  }
                />
                <AvatarFallback>{firstName.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-semibold text-white">{profile?.full_name || '—'}</p>
                <p className="text-sm text-muted-foreground">{profile?.instrument || '—'}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Matrícula: {profile?.registration_number || '—'}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button asChild className="w-full shadow-glow sm:w-auto">
                <Link to="/portal/id">Ver Minha Identidade</Link>
              </Button>
              <Link to="/portal/perfil" className="text-sm text-primary hover:underline">
                Editar Perfil
              </Link>
            </div>
          </CardContent>
        </Card>

        {showTravel ? (
          <Card className="border-amber-500/25 bg-gradient-to-br from-amber-500/10 to-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FilePenLine className="h-5 w-5 text-primary" /> Autorizações de viagem
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Viagens da banda exigem assinatura do responsável digital. Aqui você acompanha o
                status.
              </p>
              <Button asChild variant="outline">
                <Link to="/portal/autorizacoes">Ver autorizações</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-white/5 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-primary" /> Proximo Compromisso
              </CardTitle>
            </CardHeader>
            <CardContent>
              {nextEvent ? (
                <div>
                  <h4 className="mb-1 font-bold text-white">{nextEvent.title}</h4>
                  <p className="mb-3 text-sm text-muted-foreground">
                    {new Date(nextEvent.event_date).toLocaleDateString('pt-BR')} as{' '}
                    {new Date(nextEvent.event_date).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  <div className="inline-block rounded bg-background/50 px-2 py-1 text-xs text-muted-foreground">
                    {nextEvent.location}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum evento proximo.</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {showTravel ? (
        <Card className="border-white/5 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-primary" /> Proximo Compromisso
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nextEvent ? (
              <div>
                <h4 className="mb-1 font-bold text-white">{nextEvent.title}</h4>
                <p className="mb-3 text-sm text-muted-foreground">
                  {new Date(nextEvent.event_date).toLocaleDateString('pt-BR')} as{' '}
                  {new Date(nextEvent.event_date).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                <div className="inline-block rounded bg-background/50 px-2 py-1 text-xs text-muted-foreground">
                  {nextEvent.location}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum evento proximo.</p>
            )}
          </CardContent>
        </Card>
      ) : null}

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Adicionados Recentemente</h2>
          <Link
            to="/portal/biblioteca"
            className="flex items-center text-sm text-primary hover:underline"
          >
            Ver tudo <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {materials && materials.length > 0 ? (
            materials.map((mat) => (
              <Card
                key={mat.id}
                className="border-white/5 bg-card/50 transition-colors hover:border-white/10"
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-red-500/10 text-red-500">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="truncate text-sm font-semibold text-white">{mat.title}</h4>
                    <p className="text-xs text-muted-foreground">{mat.category}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="col-span-full text-sm text-muted-foreground">
              Nenhum material disponivel.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
