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
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 glass pb-safe lg:hidden">
      <div
        className={cn(
          'scrollbar-none flex items-stretch overflow-x-auto px-safe',
          scrollable
            ? 'min-h-[4.75rem] snap-x snap-mandatory gap-1 px-2'
            : 'min-h-[4.25rem] gap-0.5 sm:gap-1 sm:px-1.5',
        )}
      >
        {children}
      </div>
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
        'touch-target flex min-h-[4.25rem] flex-col items-center justify-center gap-1 text-muted-foreground transition-colors',
        scrollable
          ? 'min-w-[5.25rem] shrink-0 snap-start px-2 sm:min-w-[5.5rem]'
          : 'min-w-[4.5rem] flex-1 px-1.5 sm:min-w-[4.75rem] sm:px-2',
        active ? activeClass : 'hover:text-foreground',
      )}
    >
      <Icon className={cn('h-5 w-5 shrink-0', active && tone !== 'danger' && 'fill-primary/20')} />
      <span
        className={cn(
          'text-center font-medium',
          scrollable
            ? 'max-w-[5.25rem] text-[11px] leading-snug sm:max-w-[5.5rem]'
            : 'max-w-[4.5rem] truncate text-[10px] leading-tight',
        )}
      >
        {label}
      </span>
    </Link>
  )
}
