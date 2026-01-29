"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import Link from "next/link"

interface User {
  id: string
  username: string
  name: string
  email: string
  role: string
  blocked: boolean
  createdAt: string
}

export default function AdminPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  // Проверка роли администратора
  const checkAdminRole = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      const response = await fetch("http://localhost:8080/api/profile/me", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error("Ошибка получения данных профиля")
      }

      const userData = await response.json()
      
      if (userData.role !== "ROLE_ADMIN") {
        toast({
          title: "Доступ запрещен",
          description: "У вас нет прав администратора",
          variant: "destructive",
        })
        router.push("/")
        return
      }

      setIsAdmin(true)
      fetchUsers()
    } catch (error) {
      console.error("Ошибка проверки роли:", error)
      router.push("/login")
    }
  }

  // Получение списка пользователей
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("http://localhost:8080/api/profile", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error("Ошибка получения списка пользователей")
      }

      const data = await response.json()
      setUsers(data)
      setFilteredUsers(data)
    } catch (error) {
      console.error("Ошибка загрузки пользователей:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить список пользователей",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Фильтрация пользователей
  const filterUsers = (query: string) => {
    setSearchQuery(query)
    const lowercaseQuery = query.toLowerCase()
    const filtered = users.filter(user => 
      user.username.toLowerCase().includes(lowercaseQuery)
    )
    setFilteredUsers(filtered)
  }

  // Блокировка/разблокировка пользователя
  const toggleUserBlock = async (userId: string, blocked: boolean) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`http://localhost:8080/api/profile/${userId}/${blocked ? 'unblock' : 'block'}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })

      if (!response.ok) {
        throw new Error("Ошибка изменения статуса блокировки")
      }

      // Обновляем список пользователей
      fetchUsers()
      
      toast({
        title: "Успешно",
        description: `Пользователь ${blocked ? "разблокирован" : "заблокирован"}`,
      })
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось изменить статус блокировки",
        variant: "destructive",
      })
    }
  }

  // Удаление пользователя
  const deleteUser = async (userId: string) => {
    if (!confirm("Вы уверены, что хотите удалить этого пользователя?")) {
      return
    }

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`http://localhost:8080/api/profile/people/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error("Ошибка удаления пользователя")
      }

      // Обновляем список пользователей
      fetchUsers()
      
      toast({
        title: "Успешно",
        description: "Пользователь удален",
      })
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить пользователя",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    checkAdminRole()
  }, [])

  if (!isAdmin || loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Панель администратора</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Поиск по имени пользователя..."
              value={searchQuery}
              onChange={(e) => filterUsers(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Имя пользователя</TableHead>
                <TableHead>Имя</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Роль</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Дата регистрации</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell>
                      <Link href={`/admin/users/${user.id}`} className="text-blue-600 hover:underline">
                        {user.username}
                      </Link>
                    </TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === "ROLE_ADMIN" ? "default" : "secondary"}>
                        {user.role === "ROLE_ADMIN" ? "Администратор" : "Пользователь"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.blocked && (
                        <Badge variant="destructive">
                          Заблокирован
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString("ru-RU")}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {user.blocked ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleUserBlock(user.id, user.blocked)}
                          >
                            Разблокировать
                          </Button>
                        ) : (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => toggleUserBlock(user.id, user.blocked)}
                          >
                            Заблокировать
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteUser(user.id)}
                        >
                          Удалить
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4 text-gray-500">
                    {searchQuery ? "Пользователи не найдены" : "Список пользователей пуст"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
} 