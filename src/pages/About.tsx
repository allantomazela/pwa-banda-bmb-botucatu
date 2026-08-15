import { Card, CardContent } from '@/components/ui/card'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import Autoplay from 'embla-carousel-autoplay'
import { useRef } from 'react'
import { CmsSections } from '@/components/cms/CmsSections'
import { BrandCrest } from '@/components/BrandMark'
import { BRAND_NAME } from '@/lib/brand'

export default function About() {
  const plugin = useRef(Autoplay({ delay: 4000, stopOnInteraction: true }))

  const historyImages = [
    'https://img.usecurling.com/p/800/500?q=marching%20band%20parade&color=blue',
    'https://img.usecurling.com/p/800/500?q=brass%20instruments&color=yellow',
    'https://img.usecurling.com/p/800/500?q=drumline&color=black',
  ]

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
        <p className="text-lg text-muted-foreground">
          Fundada com o propósito de levar cultura e disciplina aos jovens de Botucatu, a Banda
          Marcial de Botucatu se consolidou como um dos principais corpos musicais do interior
          paulista.
        </p>
      </div>

      <div className="mb-20">
        <Carousel
          plugins={[plugin.current]}
          className="w-full max-w-5xl mx-auto rounded-xl overflow-hidden shadow-2xl border border-white/10"
        >
          <CarouselContent>
            {historyImages.map((src, index) => (
              <CarouselItem key={index}>
                <div className="aspect-[16/9] relative">
                  <img
                    src={src}
                    alt={`Momento Histórico ${index + 1}`}
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent flex items-end p-8">
                    <p className="text-white font-medium text-lg">Apresentações Inesquecíveis</p>
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

      <div className="max-w-4xl mx-auto relative border-l-2 border-primary/30 pl-8 md:pl-12 space-y-12">
        <div className="relative">
          <div className="absolute -left-[41px] md:-left-[57px] top-1 w-6 h-6 rounded-full bg-primary ring-4 ring-background" />
          <h3 className="text-2xl font-bold text-white mb-2">Fundação</h3>
          <p className="text-muted-foreground leading-relaxed">
            Nascida do sonho de educadores locais, a banda começou pequena, com instrumentos doados
            e muita força de vontade. O primeiro ensaio ocorreu no pátio de uma escola pública,
            marcando o início de uma longa jornada.
          </p>
        </div>
        <div className="relative">
          <div className="absolute -left-[41px] md:-left-[57px] top-1 w-6 h-6 rounded-full bg-primary ring-4 ring-background" />
          <h3 className="text-2xl font-bold text-white mb-2">O Primeiro Título</h3>
          <p className="text-muted-foreground leading-relaxed">
            Após anos de dedicação intensiva, a BMB conquistou seu primeiro título estadual. Esse
            marco atraiu novos talentos e consolidou a reputação do grupo em todo o estado de São
            Paulo.
          </p>
        </div>
        <div className="relative">
          <div className="absolute -left-[41px] md:-left-[57px] top-1 w-6 h-6 rounded-full bg-primary ring-4 ring-background" />
          <h3 className="text-2xl font-bold text-white mb-2">A BMB Hoje</h3>
          <p className="text-muted-foreground leading-relaxed">
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
