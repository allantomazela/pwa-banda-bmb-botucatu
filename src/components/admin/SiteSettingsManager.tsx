import { useState, useEffect } from 'react'
import { useSiteSettings } from '@/hooks/use-site-settings'
import { updateSiteSettings } from '@/services/site-settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

function Field({
  id,
  label,
  value,
  onChange,
  textarea,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  textarea?: boolean
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {textarea ? (
        <Textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} rows={3} />
      ) : (
        <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  )
}

export function SiteSettingsManager() {
  const { toast } = useToast()
  const { settings, refresh } = useSiteSettings()
  const [form, setForm] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm(settings)
  }, [settings])

  const set = (key: string) => (v: string) => setForm((prev) => ({ ...prev, [key]: v }))

  const handleSave = async () => {
    if (!form.header_title?.trim()) {
      toast({
        title: 'Erro',
        description: 'O título do cabeçalho é obrigatório.',
        variant: 'destructive',
      })
      return
    }
    setSaving(true)
    const { error } = await updateSiteSettings(form)
    setSaving(false)
    if (error) {
      toast({ title: 'Erro', description: error, variant: 'destructive' })
    } else {
      toast({ title: 'Configurações salvas!' })
      refresh()
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card/50 border-white/5">
        <CardHeader>
          <CardTitle className="text-base">Cabeçalho & Hero</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field
            id="header_title"
            label="Título do Cabeçalho"
            value={form.header_title || ''}
            onChange={set('header_title')}
          />
          <Field
            id="header_subtitle"
            label="Subtítulo do Cabeçalho"
            value={form.header_subtitle || ''}
            onChange={set('header_subtitle')}
          />
          <Field
            id="hero_title"
            label="Título do Hero"
            value={form.hero_title || ''}
            onChange={set('hero_title')}
          />
          <Field
            id="hero_subtitle"
            label="Subtítulo do Hero"
            value={form.hero_subtitle || ''}
            onChange={set('hero_subtitle')}
            textarea
          />
          <Field
            id="header_logo_url"
            label="URL do Logo do Cabeçalho (vazio = letra B)"
            value={form.header_logo_url || ''}
            onChange={set('header_logo_url')}
          />
          <Field
            id="hero_image_url"
            label="URL da Imagem do Hero (vazio = padrão)"
            value={form.hero_image_url || ''}
            onChange={set('hero_image_url')}
          />
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-white/5">
        <CardHeader>
          <CardTitle className="text-base">Textos & CTAs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field
            id="about_text"
            label="Texto Sobre"
            value={form.about_text || ''}
            onChange={set('about_text')}
            textarea
          />
          <Field
            id="join_cta_title"
            label="Título do CTA"
            value={form.join_cta_title || ''}
            onChange={set('join_cta_title')}
          />
          <Field
            id="join_cta_text"
            label="Texto do CTA"
            value={form.join_cta_text || ''}
            onChange={set('join_cta_text')}
            textarea
          />
          <Field
            id="footer_about"
            label="Texto do Rodapé"
            value={form.footer_about || ''}
            onChange={set('footer_about')}
            textarea
          />
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-white/5">
        <CardHeader>
          <CardTitle className="text-base">Blocos da Página Inicial</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field
            id="tile_history_title"
            label="Título - História"
            value={form.tile_history_title || ''}
            onChange={set('tile_history_title')}
          />
          <Field
            id="tile_history_text"
            label="Texto - História"
            value={form.tile_history_text || ''}
            onChange={set('tile_history_text')}
            textarea
          />
          <Field
            id="tile_agenda_title"
            label="Título - Agenda"
            value={form.tile_agenda_title || ''}
            onChange={set('tile_agenda_title')}
          />
          <Field
            id="tile_agenda_text"
            label="Texto - Agenda"
            value={form.tile_agenda_text || ''}
            onChange={set('tile_agenda_text')}
            textarea
          />
          <Field
            id="tile_values_title"
            label="Título - Valores"
            value={form.tile_values_title || ''}
            onChange={set('tile_values_title')}
          />
          <Field
            id="tile_values_text"
            label="Texto - Valores"
            value={form.tile_values_text || ''}
            onChange={set('tile_values_text')}
            textarea
          />
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-white/5">
        <CardHeader>
          <CardTitle className="text-base">Contato</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field
            id="contact_email"
            label="E-mail de Contato"
            value={form.contact_email || ''}
            onChange={set('contact_email')}
          />
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Salvar Configurações
      </Button>
    </div>
  )
}
