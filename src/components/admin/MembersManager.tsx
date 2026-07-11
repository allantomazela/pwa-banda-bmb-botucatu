import { useState, useEffect, useMemo } from 'react'
import { getAllProfiles } from '@/services/admin'
import type { Profile } from '@/services/profiles'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Pencil, Search, Loader2, Eye } from 'lucide-react'
import { MemberEditDialog } from '@/components/admin/MemberEditDialog'
import { DigitalIdCard } from '@/components/portal/DigitalIdCard'

export function MembersManager() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editProfile, setEditProfile] = useState<Profile | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [cardProfile, setCardProfile] = useState<Profile | null>(null)

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
    setEditProfile(p)
    setEditOpen(true)
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
              <TableHead className="w-24" />
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
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setCardProfile(p)}
                      title="Ver carteirinha"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(p)}
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <MemberEditDialog
        profile={editProfile}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={fetchProfiles}
      />

      <Dialog open={!!cardProfile} onOpenChange={(open) => !open && setCardProfile(null)}>
        <DialogContent className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Carteirinha Digital</DialogTitle>
          </DialogHeader>
          {cardProfile && (
            <div className="flex justify-center py-4 max-h-[70vh] overflow-y-auto">
              <DigitalIdCard profile={cardProfile} showActions={false} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
