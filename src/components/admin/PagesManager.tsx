import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { SECTION_TYPE_LABELS, publicPagePath, type SectionType } from '@/lib/cms'
import {
  createSitePage,
  deleteSection,
  deleteSitePage,
  getAllSections,
  getSitePages,
  updateSitePage,
  type SitePage,
  type SiteSection,
} from '@/services/site-cms'
import { SectionFormDialog } from '@/components/admin/SectionFormDialog'
import { useSitePages } from '@/hooks/use-site-pages'

export function PagesManager() {
  const { toast } = useToast()
  const { refresh: refreshNav } = useSitePages()
  const [pages, setPages] = useState<SitePage[]>([])
  const [sections, setSections] = useState<SiteSection[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<SiteSection | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [showInNav, setShowInNav] = useState(true)
  const [creating, setCreating] = useState(false)

  const selected = pages.find((page) => page.id === selectedId) ?? null

  const loadPages = async (keepId?: string) => {
    setLoading(true)
    try {
      const list = await getSitePages()
      setPages(list)
      const nextId = keepId && list.some((p) => p.id === keepId) ? keepId : list[0]?.id
      setSelectedId(nextId ?? null)
    } catch {
      setPages([])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadPages()
  }, [])

  useEffect(() => {
    if (!selectedId) {
      setSections([])
      return
    }
    getAllSections(selectedId)
      .then(setSections)
      .catch(() => setSections([]))
  }, [selectedId])

  const handleCreatePage = async () => {
    if (!newTitle.trim()) {
      toast({ title: 'Erro', description: 'Informe o título da página.', variant: 'destructive' })
      return
    }
    setCreating(true)
    const { error, page } = await createSitePage({
      title: newTitle,
      nav_label: newTitle,
      show_in_nav: showInNav,
    })
    setCreating(false)
    if (error) {
      toast({ title: 'Erro', description: error, variant: 'destructive' })
      return
    }
    setNewTitle('')
    toast({ title: 'Página criada!' })
    await loadPages(page?.id)
    refreshNav()
  }

  const handleToggleNav = async (page: SitePage, checked: boolean) => {
    const { error } = await updateSitePage(page.id, { show_in_nav: checked })
    if (error) {
      toast({ title: 'Erro', description: error, variant: 'destructive' })
      return
    }
    setPages((prev) => prev.map((item) => (item.id === page.id ? { ...item, show_in_nav: checked } : item)))
    refreshNav()
  }

  const handleDeletePage = async (page: SitePage) => {
    if (page.is_system) return
    if (!window.confirm(`Excluir a página "${page.title}" e todas as seções?`)) return
    const { error } = await deleteSitePage(page.id)
    if (error) {
      toast({ title: 'Erro', description: error, variant: 'destructive' })
      return
    }
    toast({ title: 'Página excluída' })
    await loadPages()
    refreshNav()
  }

  const handleDeleteSection = async (section: SiteSection) => {
    if (!window.confirm('Excluir esta seção?')) return
    const { error } = await deleteSection(section.id)
    if (error) {
      toast({ title: 'Erro', description: error, variant: 'destructive' })
      return
    }
    setSections((prev) => prev.filter((item) => item.id !== section.id))
    toast({ title: 'Seção excluída' })
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <Card className="bg-card/50 border-white/5 h-fit">
        <CardHeader>
          <CardTitle className="text-base">Páginas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {pages.map((page) => (
            <button
              key={page.id}
              type="button"
              onClick={() => setSelectedId(page.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                page.id === selectedId ? 'bg-primary/15 text-primary' : 'hover:bg-white/5'
              }`}
            >
              {page.title}
              {page.is_system ? (
                <span className="block text-[10px] text-muted-foreground">Página atual do site</span>
              ) : null}
            </button>
          ))}
          <div className="pt-4 space-y-2 border-t border-white/5">
            <Label>Nova página</Label>
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Ex: Patrocinadores"
            />
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="nav" className="text-xs">
                Mostrar no menu
              </Label>
              <Switch id="nav" checked={showInNav} onCheckedChange={setShowInNav} />
            </div>
            <Button onClick={handleCreatePage} disabled={creating} className="w-full" size="sm">
              {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Criar página
            </Button>
          </div>
        </CardContent>
      </Card>

      {selected ? (
        <Card className="bg-card/50 border-white/5">
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">{selected.title}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Endereço: {publicPagePath(selected.slug)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {!selected.is_system ? (
                <>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Menu</Label>
                    <Switch
                      checked={selected.show_in_nav}
                      onCheckedChange={(checked) => handleToggleNav(selected, checked)}
                    />
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => handleDeletePage(selected)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              ) : null}
              <Button
                size="sm"
                onClick={() => {
                  setEditing(null)
                  setDialogOpen(true)
                }}
              >
                <Plus className="w-4 h-4 mr-1" />
                Seção
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {sections.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma seção extra. O conteúdo original da página continua no ar. Adicione texto,
                imagem, vídeo ou galeria abaixo dele.
              </p>
            ) : (
              sections.map((section) => (
                <div
                  key={section.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-white/5 p-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {section.title || SECTION_TYPE_LABELS[section.section_type as SectionType]}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {SECTION_TYPE_LABELS[section.section_type as SectionType]}
                      {section.is_visible ? '' : ' · oculta'}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setEditing(section)
                        setDialogOpen(true)
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDeleteSection(section)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      ) : null}

      {selected ? (
        <SectionFormDialog
          open={dialogOpen}
          pageId={selected.id}
          nextOrder={sections.length}
          editing={editing}
          onClose={() => setDialogOpen(false)}
          onSaved={() =>
            getAllSections(selected.id)
              .then(setSections)
              .catch(() => undefined)
          }
        />
      ) : null}
    </div>
  )
}
