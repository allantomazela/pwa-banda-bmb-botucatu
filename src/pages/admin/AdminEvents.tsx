import { EventsManager } from '@/components/admin/EventsManager'

export default function AdminEvents() {
  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-5xl mx-auto space-y-6 animate-fade-in">
      <header>
        <h1 className="text-3xl font-bold font-display mb-2">Gestão de Eventos</h1>
        <p className="text-muted-foreground">Crie, edite e remova eventos da agenda.</p>
      </header>
      <EventsManager />
    </div>
  )
}
