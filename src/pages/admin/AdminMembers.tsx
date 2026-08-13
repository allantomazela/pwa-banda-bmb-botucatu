import { MembersManager } from '@/components/admin/MembersManager'

export default function AdminMembers() {
  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-6 animate-fade-in">
      <header>
        <h1 className="mb-2 font-display text-3xl font-bold">Gestão de Membros</h1>
        <p className="text-muted-foreground">
          Aprove cadastros, gerencie perfis e libere o acesso ao portal.
        </p>
      </header>
      <MembersManager />
    </div>
  )
}
