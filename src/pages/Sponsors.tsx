import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { CmsSections } from '@/components/cms/CmsSections'
import { SponsorInquiryForm } from '@/components/sponsors/SponsorInquiryForm'
import { SponsorLogos } from '@/components/sponsors/SponsorLogos'

function scrollToSponsorForm() {
  const el = document.getElementById('formulario')
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default function Sponsors() {
  const location = useLocation()

  useEffect(() => {
    if (location.hash !== '#formulario') return
    const timer = window.setTimeout(scrollToSponsorForm, 80)
    return () => window.clearTimeout(timer)
  }, [location.hash, location.pathname])

  return (
    <div className="animate-fade-in">
      <SponsorLogos />

      <div className="container px-4 pb-16 lg:pb-24">
        <div id="formulario" className="flex justify-center scroll-mt-24">
          <SponsorInquiryForm />
        </div>
        <div className="mt-16">
          <CmsSections slug="patrocinadores" />
        </div>
      </div>
    </div>
  )
}
