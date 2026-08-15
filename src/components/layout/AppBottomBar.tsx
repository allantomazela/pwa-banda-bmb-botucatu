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
      <div className="scrollbar-none flex h-[3.85rem] items-stretch gap-1 overflow-x-auto px-1.5">
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
        'flex min-w-[4.35rem] flex-1 flex-col items-center justify-center gap-0.5 px-2 text-muted-foreground transition-colors',
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
