import { Link } from 'react-router-dom'
import { useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Home } from 'lucide-react'

const NotFound = () => {
  const location = useLocation()

  useEffect(() => {
    console.error('404 Error: User attempted to access non-existent route:', location.pathname)
  }, [location.pathname])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center px-6">
        <h1 className="text-8xl md:text-9xl font-display font-black text-primary/20 mb-4">404</h1>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Página não encontrada</h2>
        <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
          A página que você procura não existe ou foi movida para outro endereço.
        </p>
        <Button asChild size="lg" className="shadow-glow">
          <Link to="/">
            <Home className="w-5 h-5 mr-2" />
            Voltar ao Início
          </Link>
        </Button>
      </div>
    </div>
  )
}

export default NotFound
