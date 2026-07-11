import { MaterialsManager } from '@/components/admin/MaterialsManager'

export default function AdminMaterials() {
  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-6 animate-fade-in">
      <header>
        <h1 className="text-3xl font-bold font-display mb-2">Gestão de Materiais</h1>
        <p className="text-muted-foreground">Gerencie partituras, métodos e documentos.</p>
      </header>
      <MaterialsManager />
    </div>
  )
}
