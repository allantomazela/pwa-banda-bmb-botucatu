import { SiteSettingsManager } from '@/components/admin/SiteSettingsManager'

export default function AdminSiteSettings() {
  return (
    <div className="p-6 lg:p-10 max-w-3xl mx-auto space-y-6 animate-fade-in">
      <header>
        <h1 className="text-3xl font-bold font-display mb-2">Administração do Site</h1>
        <p className="text-muted-foreground">
          Gerencie textos, imagens e configurações do site público.
        </p>
      </header>
      <SiteSettingsManager />
    </div>
  )
}
