import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Play } from 'lucide-react'

export default function Media() {
  const [activeTab, setActiveTab] = useState('fotos')

  const fotos = [
    'https://img.usecurling.com/p/600/400?q=marching%20band%20instruments&color=blue',
    'https://img.usecurling.com/p/600/400?q=trumpet&color=yellow',
    'https://img.usecurling.com/p/600/400?q=snare%20drum&color=black',
    'https://img.usecurling.com/p/600/400?q=parade&color=blue',
    'https://img.usecurling.com/p/600/400?q=brass&color=yellow',
    'https://img.usecurling.com/p/600/400?q=marching&color=black',
  ]

  return (
    <div className="container py-12 lg:py-20 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Galeria de <span className="text-primary">Mídia</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Reviva os melhores momentos de nossas apresentações e ensaios.
          </p>
        </div>

        <Tabs defaultValue="fotos" className="w-full md:w-auto" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 md:w-[300px]">
            <TabsTrigger value="fotos">Fotos</TabsTrigger>
            <TabsTrigger value="videos">Vídeos</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className={activeTab === 'fotos' ? 'block' : 'hidden'}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {fotos.map((src, i) => (
            <div key={i} className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-card">
              <img
                src={src}
                alt={`Galeria ${i}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <span className="text-white font-medium">Ampliar</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={activeTab === 'videos' ? 'block' : 'hidden'}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-card rounded-xl border border-white/5 overflow-hidden shadow-lg"
            >
              <div className="aspect-video relative bg-background/50 flex items-center justify-center group cursor-pointer">
                <img
                  src={`https://img.usecurling.com/p/800/450?q=concert&color=blue&seed=${i}`}
                  alt="Video thumbnail"
                  className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity"
                />
                <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center z-10 group-hover:scale-110 transition-transform">
                  <Play className="w-8 h-8 text-primary-foreground ml-1" />
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold mb-2">
                  Apresentação Campeonato Estadual {2025 - i}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Assista na íntegra nossa performance premiada.
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
