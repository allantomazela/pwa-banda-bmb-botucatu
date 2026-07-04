import { MOCK_EVENTS } from '@/lib/mock-data'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar as CalendarIcon, MapPin, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Agenda() {
  return (
    <div className="container py-12 lg:py-20 animate-fade-in">
      <div className="max-w-3xl mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Agenda de <span className="text-primary">Eventos</span>
        </h1>
        <p className="text-muted-foreground text-lg">
          Acompanhe nossas próximas apresentações, ensaios abertos e compromissos oficiais.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_EVENTS.map((event, i) => {
          const date = new Date(event.date)
          const day = date.getDate().toString().padStart(2, '0')
          const month = date.toLocaleString('pt-BR', { month: 'short' }).toUpperCase()
          const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

          return (
            <Card
              key={event.id}
              className="bg-card border-white/5 overflow-hidden group hover:border-primary/30 transition-colors animate-slide-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="h-2 w-full bg-primary/20 group-hover:bg-primary transition-colors" />
              <CardContent className="p-6">
                <div className="flex gap-6 items-start mb-4">
                  <div className="bg-background border border-white/10 rounded-lg p-3 text-center min-w-[70px] shadow-sm">
                    <span className="block text-xs text-primary font-bold">{month}</span>
                    <span className="block text-2xl font-display font-bold text-white leading-none mt-1">
                      {day}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg leading-tight mb-2 text-white">
                      {event.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {event.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="w-4 h-4 mr-3 text-primary" />
                    {time}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 mr-3 text-primary shrink-0" />
                    <span className="truncate">{event.location_name}</span>
                  </div>
                </div>

                <Button variant="secondary" className="w-full" asChild>
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(event.location_name)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Ver no Mapa
                  </a>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
