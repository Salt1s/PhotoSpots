"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'

interface AuthContextType {
  isAuthenticated: boolean
  setIsAuthenticated: (value: boolean) => void
  checkAuth: () => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const logout = () => {
    localStorage.removeItem("token")
    setIsAuthenticated(false)
    router.push('/login')
  }

  const checkAuth = async () => {
    const token = localStorage.getItem("token")
    
    if (!token) {
      setIsAuthenticated(false)
      return
    }

    try {
      // Проверяем валидность токена через API
      const response = await fetch("http://localhost:8080/api/profile/me", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error("Токен недействителен")
      }

      setIsAuthenticated(true)
    } catch (error) {
      console.error("Ошибка проверки авторизации:", error)
      localStorage.removeItem("token")
      setIsAuthenticated(false)
      
      toast({
        title: "Ошибка авторизации",
        description: "Пожалуйста, войдите снова",
        variant: "destructive",
      })
      
      router.push('/login')
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, checkAuth, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 