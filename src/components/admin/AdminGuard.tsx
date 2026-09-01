import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { isSystemAdmin } from '@/lib/roles'

export function AdminGuard() {
  const { profile, loading, profileLoading } = useAuth()

  if (loading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (!profile || profile.approval_status !== 'approved' || !isSystemAdmin(profile.role)) {
    return <Navigate to="/portal" replace />
  }

  return <Outlet />
}
