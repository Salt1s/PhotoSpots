"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { checkAuth } = useAuth()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("http://localhost:8080/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Неверные учетные данные")
      }

      if (!data["jwt-token"]) {
        throw new Error("Неверный логин или пароль")
      }

      localStorage.setItem("token", data["jwt-token"])
      
      // Проверяем валидность токена и обновляем состояние авторизации
      await checkAuth()

      toast({
        title: "Успешно",
        description: "Вы успешно вошли в систему",
      })

      router.push("/map")
    } catch (err) {
      console.error("Ошибка входа:", err)
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : "Не удалось войти в систему",
        variant: "destructive",
      })
      // Очищаем токен при ошибке
      localStorage.removeItem("token")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <MapPin className="h-12 w-12 text-gray-600" />
          </div>
          <CardTitle className="text-2xl text-center">Вход в PhotoSpots</CardTitle>
          <CardDescription className="text-center">Введите свои учетные данные для входа</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Имя пользователя</Label>
              <Input
                id="username"
                type="text"
                placeholder="Введите имя пользователя"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Пароль</Label>
                <Link href="/forgot-password" className="text-sm text-gray-500 hover:text-gray-700">
                  Забыли пароль?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Введите пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full bg-gray-800 hover:bg-gray-700" disabled={loading}>
              {loading ? "Вход..." : "Войти"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-500">
            Нет аккаунта?{" "}
            <Link href="/register" className="text-gray-700 hover:underline">
              Зарегистрироваться
            </Link>
          </p>

        </CardFooter>
        
      </Card>
    </div>
  )
}
