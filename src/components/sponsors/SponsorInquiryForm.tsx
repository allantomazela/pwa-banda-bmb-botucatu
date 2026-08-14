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
import { Button } from '@/components/ui/button'
import { Loader2, Send } from 'lucide-react'
import { createSponsorInquiry } from '@/services/sponsors'

const formSchema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
  company: z.string().optional(),
  message: z.string().optional(),
})

export function SponsorInquiryForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      company: '',
      message: '',
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    const { error } = await createSponsorInquiry(values)
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
      description: 'Recebemos seu interesse. Em breve a Banda BMB entrará em contato.',
    })
    form.reset()
  }

  return (
    <Card className="w-full max-w-xl bg-card border-white/10 shadow-2xl">
      <CardHeader className="text-center pb-8">
        <CardTitle className="text-3xl font-display font-bold text-primary">
          Quero patrocinar
        </CardTitle>
        <CardDescription className="text-base text-muted-foreground mt-2">
          Empresas e pessoas que desejam apoiar a Banda BMB com doações ao caixa podem
          deixar os dados abaixo. Retornamos para conversar sobre a parceria.
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
                  <FormLabel>Nome completo</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Maria Silva"
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
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empresa ou marca (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Comércio Silva Ltda."
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="contato@empresa.com"
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
            </div>

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mensagem (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Conte como gostaria de apoiar a banda..."
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
                  Enviar interesse <Send className="ml-2 w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
