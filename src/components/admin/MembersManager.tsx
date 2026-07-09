import { useState, useEffect, useMemo } from 'react'
import { getAllProfiles, updateProfileAdmin } from '@/services/admin'
import type { Profile } from '@/services/profiles'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Pencil, Search, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function MembersManager() {
  const { toast } = useToast()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Profile | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ registration_number: '', valid_until: '', role: 'member' })

  const fetchProfiles = async () => {
    setLoading(true)
    try {
      setProfiles(await getAllProfiles())
    } catch {
      setProfiles([])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchProfiles()
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return profiles.filter(
      (p) =>
        p.full_name.toLowerCase().includes(q) ||
        p.registration_number.toLowerCase().includes(q) ||
        p.instrument.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q),
    )
  }, [profiles, search])

  const handleEdit = (p: Profile) => {
    setEditing(p)
    setForm({
      registration_number: p.registration_number,
      valid_until: p.valid_until ? p.valid_until.split('T')[0] : '',
      role: p.role || 'member',
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!editing) return
    setSaving(true)
    const { error } = await updateProfileAdmin(editing.id, {
      registration_number: form.registration_number,
      valid_until: form.valid_until || null,
      role: form.role,
    })
    setSaving(false)
    if (error) {
      toast({ title: 'Erro', description: error, variant: 'destructive' })
    } else {
      toast({ title: 'Membro atualizado!', description: 'Dados administrativos salvos.' })
      setDialogOpen(false)
      fetchProfiles()
    }
  }

  if (loading)
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, instrumento, cidade..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="rounded-lg border border-white/5 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Matrícula</TableHead>
              <TableHead>Instrumento</TableHead>
              <TableHead>Cidade</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.full_name}</TableCell>
                <TableCell>{p.registration_number || '—'}</TableCell>
                <TableCell>{p.instrument || '—'}</TableCell>
                <TableCell>{p.city || '—'}</TableCell>
                <TableCell>
                  <Button size="icon" variant="ghost" onClick={() => handleEdit(p)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Membro: {editing?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reg_number">Matrícula</Label>
              <Input
                id="reg_number"
                value={form.registration_number}
                onChange={(e) => setForm({ ...form, registration_number: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valid_until">Validade da Carteirinha</Label>
              <Input
                id="valid_until"
                type="date"
                value={form.valid_until}
                onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Função</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Membro</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
