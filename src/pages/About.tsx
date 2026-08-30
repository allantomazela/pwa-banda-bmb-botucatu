import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import Autoplay from 'embla-carousel-autoplay'
import { useMemo, useRef } from 'react'
import { CmsSections } from '@/components/cms/CmsSections'
import { BrandCrest } from '@/components/BrandMark'
import { BRAND_NAME } from '@/lib/brand'
import { useSiteSettings } from '@/hooks/use-site-settings'

const FALLBACK_ABOUT_IMAGES = [
  'https://img.usecurling.com/p/800/500?q=marching%20band%20parade&color=blue',
  'https://img.usecurling.com/p/800/500?q=brass%20instruments&color=yellow',
  'https://img.usecurling.com/p/800/500?q=drumline&color=black',
]

export default function About() {
  const plugin = useRef(Autoplay({ delay: 4000, stopOnInteraction: true }))
  const { settings } = useSiteSettings()

  const historyImages = useMemo(() => {
    const custom = [
      settings.about_image_1_url,
      settings.about_image_2_url,
      settings.about_image_3_url,
    ]
      .map((url) => url?.trim())
      .filter((url): url is string => Boolean(url))
    return custom.length > 0 ? custom : FALLBACK_ABOUT_IMAGES
  }, [settings.about_image_1_url, settings.about_image_2_url, settings.about_image_3_url])

  const caption = settings.about_carousel_caption || 'Apresentações Inesquecíveis'
  const intro =
    settings.about_text ||
    'Fundada com o propósito de levar cultura e disciplina aos jovens de Botucatu, a Banda Marcial de Botucatu se consolidou como um dos principais corpos musicais do interior paulista.'

  return (
    <div className="container animate-fade-in-up px-4 py-8 sm:py-12 lg:py-20">
      <div className="mx-auto mb-16 max-w-3xl text-center">
        <div className="mx-auto mb-6 h-24 w-24">
          <BrandCrest className="crest-glow" />
        </div>
        <p className="mb-3 font-crest text-[11px] font-semibold uppercase tracking-[0.4em] text-primary">
          {BRAND_NAME}
        </p>
        <h1 className="mb-6 font-crest text-4xl font-bold text-primary md:text-5xl">
          Nossa História
        </h1>
        <p className="text-lg text-muted-foreground">{intro}</p>
      </div>

      <div className="mb-20">
        <Carousel
          plugins={[plugin.current]}
          className="mx-auto w-full max-w-5xl overflow-hidden rounded-xl border border-white/10 shadow-2xl"
        >
          <CarouselContent>
            {historyImages.map((src, index) => (
              <CarouselItem key={`${src}-${index}`}>
                <div className="relative aspect-[16/9]">
                  <img
                    src={src}
                    alt={`Momento histórico ${index + 1}`}
                    className="h-full w-full object-cover object-center"
                  />
                  <div className="absolute inset-0 flex items-end bg-gradient-to-t from-background/80 to-transparent p-8">
                    <p className="text-lg font-medium text-white">{caption}</p>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="hidden md:block">
            <CarouselPrevious className="left-4" />
            <CarouselNext className="right-4" />
          </div>
        </Carousel>
      </div>

      <div className="relative mx-auto max-w-4xl space-y-12 border-l-2 border-primary/30 pl-8 md:pl-12">
        <div className="relative">
          <div className="absolute -left-[41px] top-1 h-6 w-6 rounded-full bg-primary ring-4 ring-background md:-left-[57px]" />
          <h3 className="mb-2 text-2xl font-bold text-white">Fundação</h3>
          <p className="leading-relaxed text-muted-foreground">
            Nascida do sonho de educadores locais, a banda começou pequena, com instrumentos doados
            e muita força de vontade. O primeiro ensaio ocorreu no pátio de uma escola pública,
            marcando o início de uma longa jornada.
          </p>
        </div>
        <div className="relative">
          <div className="absolute -left-[41px] top-1 h-6 w-6 rounded-full bg-primary ring-4 ring-background md:-left-[57px]" />
          <h3 className="mb-2 text-2xl font-bold text-white">O Primeiro Título</h3>
          <p className="leading-relaxed text-muted-foreground">
            Após anos de dedicação intensiva, a BMB conquistou seu primeiro título estadual. Esse
            marco atraiu novos talentos e consolidou a reputação do grupo em todo o estado de São
            Paulo.
          </p>
        </div>
        <div className="relative">
          <div className="absolute -left-[41px] top-1 h-6 w-6 rounded-full bg-primary ring-4 ring-background md:-left-[57px]" />
          <h3 className="mb-2 text-2xl font-bold text-white">A BMB Hoje</h3>
          <p className="leading-relaxed text-muted-foreground">
            Atualmente, somos mais de 100 integrantes divididos entre corpo musical, linha de frente
            e comissão técnica. Mantemos nosso compromisso com a excelência, ensinando não apenas
            música, mas valores para a vida toda.
          </p>
        </div>
      </div>

      <div className="mt-20">
        <CmsSections slug="sobre" />
      </div>
    </div>
  )
}
