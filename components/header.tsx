"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { MapPin, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

interface HeaderProps {
  isAuthenticated: boolean
}

export default function Header({ isAuthenticated }: HeaderProps) {
  const router = useRouter()
  const { toast } = useToast()

  const handleLogout = () => {
    // Очищаем данные сессии
    localStorage.removeItem("token")
    
    // Показываем уведомление
    toast({
      title: "Успешно",
      description: "Вы вышли из системы",
    })
    
    // Перенаправляем на страницу входа
    router.push("/login")
    
    // Перезагружаем страницу для сброса всех состояний
    window.location.reload()
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 flex h-16 items-center justify-between max-w-[1400px]">
        <Link href="/map" className="flex items-center space-x-2">
          <MapPin className="h-6 w-6" />
          <span className="font-bold">PhotoSpots</span>
        </Link>

        {isAuthenticated ? (
          <Link href="/profile">
          <Button variant="ghost" size="icon" className="rounded-full">
            <User className="h-5 w-5" />
          </Button>
        </Link>
        ) : (
          <div className="flex items-center space-x-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Войти</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Регистрация</Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}
