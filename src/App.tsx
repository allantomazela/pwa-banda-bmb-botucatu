import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/hooks/use-auth'

import Layout from '@/components/Layout'
import PortalLayout from '@/pages/portal/PortalLayout'
import AdminLayout from '@/pages/admin/AdminLayout'
import { AdminGuard } from '@/components/admin/AdminGuard'
import NotFound from '@/pages/NotFound'

// Public Pages
import Index from '@/pages/Index'
import About from '@/pages/About'
import Agenda from '@/pages/Agenda'
import Media from '@/pages/Media'
import Contact from '@/pages/Contact'
import Login from '@/pages/Login'
import ResetPassword from '@/pages/ResetPassword'
import CmsPage from '@/pages/CmsPage'
import VerifyIdCard from '@/pages/VerifyIdCard'

// Restricted Pages
import Dashboard from '@/pages/portal/Dashboard'
import DigitalId from '@/pages/portal/DigitalId'
import ProfileSettings from '@/pages/portal/ProfileSettings'
import Library from '@/pages/portal/Library'
import Videos from '@/pages/portal/Videos'

// Admin Pages
import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminMembers from '@/pages/admin/AdminMembers'
import AdminEvents from '@/pages/admin/AdminEvents'
import AdminMaterials from '@/pages/admin/AdminMaterials'
import AdminVideos from '@/pages/admin/AdminVideos'
import AdminSiteSettings from '@/pages/admin/AdminSiteSettings'
import AdminGallery from '@/pages/admin/AdminGallery'
import AdminInquiries from '@/pages/admin/AdminInquiries'
import { SiteSettingsProvider } from '@/hooks/use-site-settings'
import { SitePagesProvider } from '@/hooks/use-site-pages'

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <SiteSettingsProvider>
        <SitePagesProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            {/* Public Routes with standard Layout */}
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
              <Route path="/sobre" element={<About />} />
              <Route path="/agenda" element={<Agenda />} />
              <Route path="/media" element={<Media />} />
              <Route path="/contato" element={<Contact />} />
              <Route path="/login" element={<Login />} />
              <Route path="/redefinir-senha" element={<ResetPassword />} />
              <Route path="/pagina/:slug" element={<CmsPage />} />
              <Route path="/verify" element={<VerifyIdCard />} />
            </Route>

            {/* Restricted Routes with Portal Layout */}
            <Route path="/portal" element={<PortalLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="id" element={<DigitalId />} />
              <Route path="perfil" element={<ProfileSettings />} />
              <Route path="biblioteca" element={<Library />} />
              <Route path="videos" element={<Videos />} />
            </Route>

            {/* Admin Routes */}
            <Route element={<AdminGuard />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="members" element={<AdminMembers />} />
                <Route path="events" element={<AdminEvents />} />
                <Route path="materials" element={<AdminMaterials />} />
                <Route path="videos" element={<AdminVideos />} />
                <Route path="site" element={<AdminSiteSettings />} />
                <Route path="gallery" element={<AdminGallery />} />
                <Route path="inquiries" element={<AdminInquiries />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
        </SitePagesProvider>
      </SiteSettingsProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
