import { useEffect, useMemo, useState } from 'react'
import {
  deleteSponsorInquiry,
  getSponsorInquiries,
  updateSponsorInquiryStatus,
  type SponsorInquiry,
} from '@/services/sponsors'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Search, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const STATUS_OPTIONS = [
  { value: 'new', label: 'Novo' },
  { value: 'contacted', label: 'Contatado' },
  { value: 'closed', label: 'Encerrado' },
]

export function SponsorInquiriesManager() {
  const { toast } = useToast()
  const [items, setItems] = useState<SponsorInquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchItems = async () => {
    setLoading(true)
    try {
      setItems(await getSponsorInquiries())
    } catch {
      setItems([])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchItems()
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.phone.toLowerCase().includes(q) ||
        item.company.toLowerCase().includes(q) ||
        item.message.toLowerCase().includes(q),
    )
  }, [items, search])

  const handleStatus = async (id: string, status: string) => {
    const { error } = await updateSponsorInquiryStatus(id, status)
    if (error) {
      toast({ title: 'Erro', description: error, variant: 'destructive' })
      return
    }
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)))
  }

  const handleDelete = async (id: string) => {
    const { error } = await deleteSponsorInquiry(id)
    if (error) {
      toast({ title: 'Erro', description: error, variant: 'destructive' })
      return
    }
    toast({ title: 'Interesse removido' })
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Pedidos enviados pelo formulário da página de patrocínio.
      </p>
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, empresa, e-mail..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          Nenhum interesse de patrocínio ainda.
        </p>
      ) : (
        <div className="rounded-lg border border-white/5 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Mensagem</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.company || '—'}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <a href={`mailto:${item.email}`} className="text-primary hover:underline">
                        {item.email}
                      </a>
                      <a
                        href={`https://wa.me/55${item.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        {item.phone}
                      </a>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[220px] truncate text-muted-foreground">
                    {item.message || '—'}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={item.status}
                      onValueChange={(value) => handleStatus(item.id, value)}
                    >
                      <SelectTrigger className="h-8 w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {new Date(item.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(item.id)}
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
