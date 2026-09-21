import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AppBottomBarProps {
  children: ReactNode
  /** Muitos itens (ex.: admin): largura fixa + scroll em vez de espremer na tela */
  scrollable?: boolean
}

export function AppBottomBar({ children, scrollable = false }: AppBottomBarProps) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 glass pb-safe lg:hidden"
      aria-label="Navegação principal"
    >
      {scrollable ? (
        <div className="scrollbar-none flex min-h-[4.5rem] touch-pan-x items-stretch overflow-x-auto overscroll-x-contain px-1 px-safe [-webkit-overflow-scrolling:touch]">
          <div className="mx-auto flex w-max min-w-full items-stretch justify-evenly">
            {children}
          </div>
        </div>
      ) : (
        <div className="grid min-h-[4.5rem] w-full grid-cols-[repeat(auto-fit,minmax(0,1fr))] items-stretch px-1 px-safe">
          {children}
        </div>
      )}
    </nav>
  )
}

interface BottomBarItemProps {
  to: string
  icon: LucideIcon
  label: string
  active?: boolean
  tone?: 'default' | 'danger'
  /** Par com AppBottomBar scrollable — item não encolhe (scroll horizontal) */
  scrollable?: boolean
}

export function BottomBarItem({
  to,
  icon: Icon,
  label,
  active = false,
  tone = 'default',
  scrollable = false,
}: BottomBarItemProps) {
  const activeClass = tone === 'danger' ? 'text-destructive' : 'text-primary'

  return (
    <Link
      to={to}
      className={cn(
        'group flex h-full min-h-[4.5rem] min-w-0 flex-col items-center justify-center gap-1 px-1 py-1.5 text-muted-foreground transition-colors',
        scrollable ? 'w-[4.85rem] shrink-0 sm:w-[5.25rem]' : 'w-full',
        active ? activeClass : 'hover:text-foreground',
      )}
    >
      <span className="flex h-6 w-6 items-center justify-center">
        <Icon
          className={cn('h-5 w-5', active && tone !== 'danger' && 'fill-primary/20')}
          aria-hidden
        />
      </span>
      <span className="w-full max-w-full truncate text-center text-[10px] font-medium leading-none tracking-wide">
        {label}
      </span>
    </Link>
  )
}
