import { useState } from 'react'
import { useFetch } from '@/hooks/use-fetch'
import { getMaterials, getMaterialDownloadUrl, type Material } from '@/services/materials'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Search, FileText, Download, Music, AlertCircle, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

export default function Library() {
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const { data: materials, loading } = useFetch<Material[]>(getMaterials)
  const { toast } = useToast()

  const categories = materials ? Array.from(new Set(materials.map((m) => m.category))) : []
  const filtered = (materials ?? []).filter((m) => {
    const matchesSearch = m.title.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = activeFilter ? m.category === activeFilter : true
    return matchesSearch && matchesFilter
  })

  const handleDownload = async (filePath: string, title: string) => {
    const url = await getMaterialDownloadUrl(filePath)
    if (url) {
      window.open(url, '_blank')
    } else {
      toast({
        title: 'Erro ao baixar',
        description: `Nao foi possivel baixar "${title}".`,
        variant: 'destructive',
      })
    }
  }

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
        <h1 className="text-3xl font-bold font-display mb-2">Biblioteca Didatica</h1>
        <p className="text-muted-foreground">Acesse partituras, metodos e comunicados oficiais.</p>
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

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((mat) => (
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
                <Button
                  size="icon"
                  variant="ghost"
                  className="shrink-0 hover:text-primary"
                  onClick={() => handleDownload(mat.file_path, mat.title)}
                >
                  <Download className="w-5 h-5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>Nenhum material encontrado.</p>
        </div>
      )}
    </div>
  )
}
