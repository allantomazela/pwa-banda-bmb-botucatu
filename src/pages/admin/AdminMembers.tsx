import { MembersManager } from '@/components/admin/MembersManager'

export default function AdminMembers() {
  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-6 animate-fade-in">
      <header>
        <h1 className="text-3xl font-bold font-display mb-2">Gestão de Membros</h1>
        <p className="text-muted-foreground">Gerencie perfis, funções e dados dos membros.</p>
      </header>
      <MembersManager />
    </div>
  )
}
