import React, { createContext, useContext, useState, useEffect } from 'react'
import { MOCK_USER } from './mock-data'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'

type User = typeof MOCK_USER

interface AuthContextType {
  user: User | null
  login: (email: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    // Simulate initial check
    const stored = localStorage.getItem('@bmb_user')
    if (stored) {
      setUser(JSON.parse(stored))
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string) => {
    setIsLoading(true)
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000))
    if (email) {
      setUser(MOCK_USER)
      localStorage.setItem('@bmb_user', JSON.stringify(MOCK_USER))
      toast({
        title: 'Bem-vindo de volta!',
        description: 'Login realizado com sucesso.',
      })
      navigate('/portal')
    }
    setIsLoading(false)
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('@bmb_user')
    toast({
      title: 'Sessão encerrada',
      description: 'Você saiu da sua conta.',
    })
    navigate('/login')
  }

  return React.createElement(
    AuthContext.Provider,
    { value: { user, login, logout, isLoading } },
    children,
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
