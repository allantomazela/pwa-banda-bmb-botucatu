import { CmsSections } from '@/components/cms/CmsSections'
import { SponsorInquiryForm } from '@/components/sponsors/SponsorInquiryForm'
import { SponsorLogos } from '@/components/sponsors/SponsorLogos'

export default function Sponsors() {
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
