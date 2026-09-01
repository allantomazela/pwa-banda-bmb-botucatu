import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AppBottomBarProps {
  children: ReactNode
}

export function AppBottomBar({ children }: AppBottomBarProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 glass pb-safe lg:hidden">
      {/* min-h 44px+ por item; scroll horizontal só se muitos links (admin) */}
      <div className="scrollbar-none flex min-h-[4.25rem] items-stretch gap-0.5 overflow-x-auto px-safe sm:gap-1 sm:px-1.5">
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
}

export function BottomBarItem({
  to,
  icon: Icon,
  label,
  active = false,
  tone = 'default',
}: BottomBarItemProps) {
  const activeClass =
    tone === 'danger'
      ? 'text-destructive'
      : 'text-primary'
  return (
    <Link
      to={to}
      className={cn(
        'touch-target flex min-h-[4.25rem] min-w-[4.5rem] flex-1 flex-col items-center justify-center gap-0.5 px-1.5 text-muted-foreground transition-colors sm:min-w-[4.75rem] sm:px-2',
        active ? activeClass : 'hover:text-foreground',
      )}
    >
      <Icon className={cn('h-5 w-5', active && tone !== 'danger' && 'fill-primary/20')} />
      <span className="max-w-[4.5rem] truncate text-center text-[10px] font-medium leading-tight">
        {label}
      </span>
    </Link>
  )
}
