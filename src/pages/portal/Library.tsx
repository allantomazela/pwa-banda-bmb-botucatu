import { useState } from 'react'
import { MOCK_MATERIALS } from '@/lib/mock-data'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Search, FileText, Download, Music, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function Library() {
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<string | null>(null)

  const categories = Array.from(new Set(MOCK_MATERIALS.map((m) => m.category)))

  const filtered = MOCK_MATERIALS.filter((m) => {
    const matchesSearch = m.title.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = activeFilter ? m.category === activeFilter : true
    return matchesSearch && matchesFilter
  })

  const getIconForCategory = (cat: string) => {
    switch (cat) {
      case 'Partituras':
        return <Music className="w-5 h-5" />
      case 'Avisos':
        return <AlertCircle className="w-5 h-5" />
      default:
        return <FileText className="w-5 h-5" />
    }
  }

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8 animate-fade-in">
      <header>
        <h1 className="text-3xl font-bold font-display mb-2">Biblioteca Didática</h1>
        <p className="text-muted-foreground">Acesse partituras, métodos e comunicados oficiais.</p>
      </header>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar arquivo..."
            className="pl-10 bg-card border-white/10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
          <Badge
            variant={activeFilter === null ? 'default' : 'outline'}
            className="cursor-pointer whitespace-nowrap"
            onClick={() => setActiveFilter(null)}
          >
            Todos
          </Badge>
          {categories.map((cat) => (
            <Badge
              key={cat}
              variant={activeFilter === cat ? 'default' : 'outline'}
              className="cursor-pointer whitespace-nowrap"
              onClick={() => setActiveFilter(cat)}
            >
              {cat}
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length > 0 ? (
          filtered.map((mat) => (
            <Card
              key={mat.id}
              className="bg-card/50 border-white/5 hover:bg-card transition-colors"
            >
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    {getIconForCategory(mat.category)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white truncate">{mat.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded">
                        {mat.category}
                      </span>
                      <span className="text-xs text-muted-foreground hidden sm:inline-block">
                        Adicionado em {new Date(mat.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>
                <Button size="icon" variant="ghost" className="shrink-0 hover:text-primary" asChild>
                  <a href={mat.file_url} download>
                    <Download className="w-5 h-5" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>Nenhum material encontrado.</p>
          </div>
        )}
      </div>
    </div>
  )
}
