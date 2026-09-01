import { cn } from '@/lib/utils'
import {
  BRAND_CITY,
  BRAND_LOGO_SRC,
  BRAND_MOTTO,
  BRAND_NAME,
  BRAND_NAME_TITLE,
  BRAND_SHORT,
} from '@/lib/brand'

type BrandMarkVariant = 'header' | 'hero' | 'footer' | 'login' | 'crest'

interface BrandMarkProps {
  variant?: BrandMarkVariant
  className?: string
}

export function BrandCrest({ className }: { className?: string }) {
  return (
    <img
      src={BRAND_LOGO_SRC}
      alt={BRAND_NAME_TITLE}
      width={800}
      height={800}
      className={cn('h-full w-full object-contain', className)}
    />
  )
}

export function BrandMark({ variant = 'header', className }: BrandMarkProps) {
  if (variant === 'crest') {
    return (
      <div className={cn('relative', className)}>
        <BrandCrest />
      </div>
    )
  }

  if (variant === 'hero') {
    return (
      <div className={cn('flex flex-col items-center text-center', className)}>
        <div className="relative mb-6">
          <div className="crest-halo absolute inset-0" />
          <div className="crest-ring absolute -inset-3 rounded-full" />
          <div className="relative h-28 w-28 sm:h-44 sm:w-44 lg:h-52 lg:w-52">
            <BrandCrest className="crest-glow drop-shadow-2xl" />
          </div>
        </div>

        <p className="mb-3 font-crest text-[10px] font-semibold uppercase tracking-[0.35em] text-primary/90 sm:tracking-[0.55em] sm:text-xs">
          {BRAND_CITY}
        </p>

        {/* clamp(): legível em 320px sem estourar largura por tracking */}
        <h1 className="text-fluid-hero px-2 font-crest font-bold leading-[1.12] tracking-[0.08em] text-white sm:tracking-[0.14em] md:tracking-[0.18em]">
          <span className="block">BANDA MARCIAL</span>
          <span className="mt-1 block bg-gradient-to-b from-amber-200 via-primary to-amber-600 bg-clip-text text-transparent">
            DE BOTUCATU
          </span>
        </h1>

        <div className="ornate-rule mt-5 max-w-md">
          <span className="font-crest text-[10px] uppercase tracking-[0.35em] text-primary/80">
            {BRAND_SHORT}
          </span>
        </div>

        <p className="mt-4 max-w-xl font-crest text-sm italic tracking-wide text-amber-100/70 sm:text-base">
          {BRAND_MOTTO}
        </p>
      </div>
    )
  }

  if (variant === 'login') {
    return (
      <div className={cn('flex flex-col items-center gap-3 text-center', className)}>
        <div className="relative h-20 w-20">
          <div className="crest-halo absolute inset-0 opacity-70" />
          <BrandCrest className="relative crest-glow" />
        </div>
        <p className="font-crest text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
          {BRAND_NAME}
        </p>
      </div>
    )
  }

  if (variant === 'footer') {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <div className="h-12 w-12 shrink-0">
          <BrandCrest />
        </div>
        <div className="min-w-0 leading-tight">
          <p className="font-crest text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
            Banda Marcial
          </p>
          <p className="font-display text-lg font-bold tracking-wide text-white">de Botucatu</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="h-10 w-10 shrink-0 md:h-11 md:w-11">
        <BrandCrest />
      </div>
      <div className="min-w-0 leading-tight">
        <p className="hidden font-crest text-[9px] font-semibold uppercase tracking-[0.28em] text-primary sm:block">
          Banda Marcial
        </p>
        <p className="truncate font-display text-sm font-bold tracking-wide text-white sm:text-base">
          <span className="sm:hidden">{BRAND_SHORT}</span>
          <span className="hidden sm:inline">de Botucatu</span>
        </p>
      </div>
    </div>
  )
}
