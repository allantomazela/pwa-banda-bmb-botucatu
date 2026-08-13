import { InquiriesManager } from '@/components/admin/InquiriesManager'

export default function AdminInquiries() {
  return (
    <div className="p-6 lg:p-10 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Interesses</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Leads enviados pelo formulário público de ingresso na banda.
        </p>
      </div>
      <InquiriesManager />
    </div>
  )
}
