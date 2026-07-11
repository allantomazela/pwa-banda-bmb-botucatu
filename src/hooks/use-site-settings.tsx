import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { getSiteSettings } from '@/services/site-settings'

interface SiteSettingsContextType {
  settings: Record<string, string>
  loading: boolean
  refresh: () => Promise<void>
}

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined)

const DEFAULTS: Record<string, string> = {
  header_title: 'Banda BMB',
  header_subtitle: 'A Tradição Musical de Botucatu',
  hero_title: 'A Tradição Musical de Botucatu',
  hero_subtitle:
    'Mais que uma banda marcial, uma família unida pela paixão à música, disciplina e arte.',
  hero_image_url: '',
  contact_email: 'contato@bandabmb.com.br',
  about_text: 'Décadas de dedicação à cultura e educação musical na nossa região.',
  join_cta_title: 'Quer fazer parte da banda?',
  join_cta_text:
    'Não é necessário ter experiência prévia. Nós oferecemos aulas práticas e teóricas para que você aprenda do zero. Venha construir essa história com a gente.',
  tile_history_title: 'Nossa História',
  tile_history_text: 'Décadas de dedicação à cultura e educação musical na nossa região.',
  tile_agenda_title: 'Agenda de Eventos',
  tile_agenda_text: 'Confira onde será nossa próxima apresentação e junte-se a nós.',
  tile_values_title: 'Nossos Valores',
  tile_values_text: 'Disciplina, respeito, trabalho em equipe e excelência musical.',
  footer_about:
    'A tradição musical de Botucatu-SP, transformando vidas através da música e da disciplina.',
}

export const useSiteSettings = () => {
  const context = useContext(SiteSettingsContext)
  if (!context) throw new Error('useSiteSettings must be used within SiteSettingsProvider')
  return context
}

export const SiteSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<Record<string, string>>(DEFAULTS)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const data = await getSiteSettings()
      setSettings({ ...DEFAULTS, ...data })
    } catch {
      setSettings(DEFAULTS)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <SiteSettingsContext.Provider value={{ settings, loading, refresh }}>
      {children}
    </SiteSettingsContext.Provider>
  )
}
