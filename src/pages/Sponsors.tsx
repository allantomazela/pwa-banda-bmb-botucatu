import { CmsSections } from '@/components/cms/CmsSections'
import { SponsorInquiryForm } from '@/components/sponsors/SponsorInquiryForm'
import { SponsorLogos } from '@/components/sponsors/SponsorLogos'

export default function Sponsors() {
  return (
    <div className="container py-12 lg:py-20 animate-fade-in space-y-16">
      <SponsorLogos />

      <div id="formulario" className="flex justify-center scroll-mt-24">
        <SponsorInquiryForm />
      </div>

      <CmsSections slug="patrocinadores" />
    </div>
  )
}
