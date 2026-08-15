import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Download, Music, AlertCircle, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { getMaterialDownloadUrl, type Material } from '@/services/materials'

export function MaterialList({ materials }: { materials: Material[] }) {
  const { toast } = useToast()
  const [downloading, setDownloading] = useState<string | null>(null)

  const handleDownload = async (filePath: string, title: string) => {
    setDownloading(title)
    const url = await getMaterialDownloadUrl(filePath)
    if (url) {
      window.open(url, '_blank')
    } else {
      toast({
        title: 'Erro ao baixar',
        description: `Não foi possível baixar "${title}".`,
        variant: 'destructive',
      })
    }
    setDownloading(null)
  }

  const getIcon = (cat: string) => {
    switch (cat) {
      case 'Partituras':
        return <Music className="w-5 h-5" />
      case 'Avisos':
        return <AlertCircle className="w-5 h-5" />
      default:
        return <FileText className="w-5 h-5" />
    }
  }

  if (materials.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
        <p>Nenhum material encontrado nesta categoria.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {materials.map((mat) => (
        <Card key={mat.id} className="bg-card/50 border-white/5 hover:bg-card transition-colors">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
                {getIcon(mat.category)}
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-white truncate">{mat.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {mat.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground hidden sm:inline-block">
                    {new Date(mat.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="shrink-0 hover:text-primary"
              onClick={() => handleDownload(mat.file_path, mat.title)}
              disabled={downloading === mat.title}
            >
              {downloading === mat.title ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Download className="w-5 h-5" />
              )}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
