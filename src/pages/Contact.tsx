import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Loader2, Send } from 'lucide-react'
import { createContactInquiry } from '@/services/contact-inquiries'
import { CmsSections } from '@/components/cms/CmsSections'

const formSchema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  phone: z.string().min(10, 'Telefone inválido'),
  instrument: z.string().min(1, 'Selecione um instrumento de interesse'),
  message: z.string().optional(),
})

export default function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone: '',
      instrument: '',
      message: '',
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    const { error } = await createContactInquiry(values)
    setIsSubmitting(false)

    if (error) {
      toast({
        title: 'Não foi possível enviar',
        description: 'Tente novamente em instantes.',
        variant: 'destructive',
      })
      return
    }

    toast({
      title: 'Mensagem enviada!',
      description: 'Recebemos seu interesse. Em breve entraremos em contato.',
    })
    form.reset()
  }

  return (
    <div className="container py-12 lg:py-20 animate-fade-in space-y-16">
      <div className="flex justify-center">
        <Card className="w-full max-w-xl bg-card border-white/10 shadow-2xl">
        <CardHeader className="text-center pb-8">
          <CardTitle className="text-3xl font-display font-bold text-primary">
            Junte-se a Nós
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground mt-2">
            Preencha o formulário abaixo para registrar seu interesse em ingressar na Banda BMB.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: João da Silva"
                        className="bg-background/50 border-white/10"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>WhatsApp / Telefone</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="(14) 99999-9999"
                          className="bg-background/50 border-white/10"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="instrument"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instrumento de Interesse</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background/50 border-white/10">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="trompete">Trompete</SelectItem>
                          <SelectItem value="trombone">Trombone</SelectItem>
                          <SelectItem value="trompa">Trompa</SelectItem>
                          <SelectItem value="tuba">Tuba</SelectItem>
                          <SelectItem value="percussao">Percussão</SelectItem>
                          <SelectItem value="linha_frente">
                            Linha de Frente (Baliza/Corpo Coreográfico)
                          </SelectItem>
                          <SelectItem value="nao_sei">Ainda não sei / Quero aprender</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mensagem (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Conte-nos um pouco sobre você ou se já tem experiência..."
                        className="resize-none bg-background/50 border-white/10 h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold shadow-glow"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Enviar Interesse <Send className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        </Card>
      </div>
      <CmsSections slug="contato" />
    </div>
  )
}
