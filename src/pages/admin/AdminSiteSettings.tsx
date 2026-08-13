import { SiteSettingsManager } from '@/components/admin/SiteSettingsManager'
import { PagesManager } from '@/components/admin/PagesManager'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function AdminSiteSettings() {
  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-6 animate-fade-in">
      <header>
        <h1 className="text-3xl font-bold font-display mb-2">Administração do Site</h1>
        <p className="text-muted-foreground">
          Edite textos da identidade e acrescente seções, imagens e vídeos nas páginas públicas.
        </p>
      </header>
      <Tabs defaultValue="textos">
        <TabsList>
          <TabsTrigger value="textos">Textos e identidade</TabsTrigger>
          <TabsTrigger value="paginas">Páginas e seções</TabsTrigger>
        </TabsList>
        <TabsContent value="textos" className="mt-6 max-w-3xl">
          <SiteSettingsManager />
        </TabsContent>
        <TabsContent value="paginas" className="mt-6">
          <PagesManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}
