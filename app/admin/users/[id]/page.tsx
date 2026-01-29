"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { MarkerData, PhotoData, ReviewData, UserData, CommentData } from "@/app/types/index"
import { AuthImage } from "@/components/auth-image"
import { StarRating } from "@/components/star-rating"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserLink } from "@/components/user-link"
import Link from "next/link"
import { use } from "react"

interface AdminUserPageProps {
  params: Promise<{
    id: string
  }>
}

// Расширенный тип для фотографий в админке
interface AdminPhotoData extends PhotoData {
  geotag?: MarkerData
}

// Расширенный тип для комментариев в админке
interface AdminCommentData extends CommentData {
  photo?: PhotoData
}

export default function AdminUserPage({ params }: AdminUserPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [user, setUser] = useState<UserData | null>(null)
  const [userMarkers, setUserMarkers] = useState<MarkerData[]>([])
  const [userPhotos, setUserPhotos] = useState<AdminPhotoData[]>([])
  const [userReviews, setUserReviews] = useState<ReviewData[]>([])
  const [userComments, setUserComments] = useState<AdminCommentData[]>([])
  const [markerSearch, setMarkerSearch] = useState("")
  const [reviewSearch, setReviewSearch] = useState("")
  const [commentSearch, setCommentSearch] = useState("")

  // Проверка роли администратора
  const checkAdminRole = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      const response = await fetch("http://158.160.183.86:8080/api/profile/me", {
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
      fetchUserData()
    } catch (error) {
      console.error("Ошибка проверки роли:", error)
      router.push("/login")
    }
  }

  // Получение данных пользователя
  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("token")
      
      // Получаем все данные пользователя параллельно
      const [userResponse, markersResponse, photosResponse, reviewsResponse, commentsResponse] = await Promise.all([
        fetch(`http://158.160.183.86:8080/api/profile/id/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`http://158.160.183.86:8080/api/map/profile/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`http://158.160.183.86:8080/api/photos/profile/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`http://158.160.183.86:8080/api/map/reviews/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`http://158.160.183.86:8080/api/photos/comments/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])

      if (!userResponse.ok) throw new Error("Ошибка получения данных пользователя")

      const userData = await userResponse.json()
      const markersData = markersResponse.ok ? await markersResponse.json() : []
      const photosData = photosResponse.ok ? await photosResponse.json() : []
      const reviewsData = reviewsResponse.ok ? await reviewsResponse.json() : []
      const commentsData = commentsResponse.ok ? await commentsResponse.json() : []

      // Создаем Map для быстрого доступа к геометкам по ID
      const markersMap = new Map(markersData.map((marker: MarkerData) => [marker.id, marker]))

      // Добавляем информацию о геометках к фотографиям
      const photosWithGeotags = photosData.map((photo: PhotoData) => ({
        ...photo,
        geotag: markersMap.get(photo.geotagId)
      }))

      setUser(userData)
      setUserMarkers(markersData)
      setUserPhotos(photosWithGeotags as AdminPhotoData[])
      setUserReviews(reviewsData)
      setUserComments(commentsData as AdminCommentData[])
    } catch (error) {
      console.error("Ошибка загрузки данных:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные пользователя",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Удаление геометки
  const deleteMarker = async (markerId: string) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`http://158.160.183.86:8080/api/map/${markerId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) throw new Error("Ошибка удаления геометки")

      setUserMarkers(prev => prev.filter(marker => marker.id !== markerId))
      toast({
        title: "Успешно",
        description: "Геометка удалена",
      })
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить геометку",
        variant: "destructive",
      })
    }
  }

  // Удаление фотографии
  const handleDeletePhoto = async (photoId: string) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`http://158.160.183.86:8080/api/photos/${photoId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Не удалось удалить фотографию")
      }

      setUserPhotos(prev => prev.filter(photo => photo.id !== photoId))
      toast({
        title: "Успешно",
        description: "Фотография удалена",
      })
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить фотографию",
        variant: "destructive",
      })
    }
  }

  // Удаление комментария
  const handleDeleteComment = async (photoId: string, commentId: string) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`http://158.160.183.86:8080/api/photos/comments/${commentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Не удалось удалить комментарий")
      }

      setUserComments(prev => prev.filter(comment => comment.id !== commentId))
      toast({
        title: "Успешно",
        description: "Комментарий удален",
      })
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить комментарий",
        variant: "destructive",
      })
    }
  }

  // Удаление отзыва
  const handleDeleteReview = async (geotagId: string, reviewId: string) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`http://158.160.183.86:8080/api/map/${geotagId}/reviews/${reviewId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Не удалось удалить отзыв")
      }

      setUserReviews(prev => prev.filter(review => review.id !== reviewId))
      toast({
        title: "Успешно",
        description: "Отзыв удален",
      })
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить отзыв",
        variant: "destructive",
      })
    }
  }

  // Блокировка/разблокировка пользователя
  const toggleUserBlock = async (userId: string, blocked: boolean) => {
    try {
      const token = localStorage.getItem("token")
      console.log("Текущий статус блокировки:", blocked)
      
      const response = await fetch(`http://158.160.183.86:8080/api/profile/${userId}/${blocked ? 'unblock' : 'block'}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })

      if (!response.ok) {
        throw new Error("Ошибка изменения статуса блокировки")
      }

      const updatedUser = await response.json()
      console.log("Ответ сервера:", updatedUser)

      // Обновляем данные пользователя
      setUser(prevUser => {
        if (!prevUser) return null
        const newUser = {
          ...prevUser,
          blocked: !blocked
        }
        console.log("Обновленные данные пользователя:", newUser)
        return newUser
      })
      
      toast({
        title: "Успешно",
        description: `Пользователь ${!blocked ? "заблокирован" : "разблокирован"}`,
      })
    } catch (error) {
      console.error("Ошибка при изменении статуса блокировки:", error)
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
      const response = await fetch(`http://158.160.183.86:8080/api/profile/people/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error("Ошибка удаления пользователя")
      }

      toast({
        title: "Успешно",
        description: "Пользователь удален",
      })
      
      // Перенаправляем на страницу со списком пользователей
      router.push("/admin")
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить пользователя",
        variant: "destructive",
      })
    }
  }

  const filteredMarkers = userMarkers.filter(marker => 
    marker.title.toLowerCase().includes(markerSearch.toLowerCase()) ||
    (marker.description?.toLowerCase() || "").includes(markerSearch.toLowerCase())
  )

  const filteredReviews = userReviews.filter(review =>
    review.text.toLowerCase().includes(reviewSearch.toLowerCase())
  )

  const filteredComments = userComments.filter(comment =>
    comment.text.toLowerCase().includes(commentSearch.toLowerCase())
  )

  useEffect(() => {
    checkAdminRole()
  }, [])

  if (!isAdmin || loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  }

  if (!user) {
    return <div className="container mx-auto py-8">
      <Card>
        <CardContent className="p-8 text-center">
          Пользователь не найден
        </CardContent>
      </Card>
    </div>
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-semibold mb-2">Профиль пользователя</CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant={user.role === "ROLE_ADMIN" ? "default" : "secondary"}>
                {user.role === "ROLE_ADMIN" ? "Администратор" : "Пользователь"}
              </Badge>
              {user.blocked && (
                <Badge variant="destructive">
                  Заблокирован
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {user.blocked ? (
              <Button
                variant="outline"
                onClick={() => toggleUserBlock(user.id, user.blocked)}
              >
                Разблокировать
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={() => toggleUserBlock(user.id, user.blocked)}
              >
                Заблокировать
              </Button>
            )}
            <Button
              variant="destructive"
              onClick={() => deleteUser(user.id)}
            >
              Удалить аккаунт
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>ID:</strong> {user.id}</p>
              <p><strong>Имя пользователя:</strong> {user.username}</p>
              <p><strong>Имя:</strong> {user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>
            </div>
            <div>
              <p><strong>Дата регистрации:</strong> {new Date(user.createdAt || '').toLocaleDateString("ru-RU")}</p>
              <p>
                <strong>Статус: </strong>
                <span className={user.blocked ? "text-red-500" : "text-green-500"}>
                  {user.blocked ? "Заблокирован" : "Активен"}
                </span>
              </p>
              <p><strong>Геометок:</strong> {userMarkers.length}</p>
              <p><strong>Фотографий:</strong> {userPhotos.length}</p>
              <p><strong>Отзывов:</strong> {userReviews.length}</p>
              <p><strong>Комментариев:</strong> {userComments.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <Tabs defaultValue="markers" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="markers">
                Геометки ({userMarkers.length})
              </TabsTrigger>
              <TabsTrigger value="photos">
                Фотографии ({userPhotos.length})
              </TabsTrigger>
              <TabsTrigger value="reviews">
                Отзывы ({userReviews.length})
              </TabsTrigger>
              <TabsTrigger value="comments">
                Комментарии ({userComments.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="markers" className="space-y-6">
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Поиск по названию геометки..."
                  className="w-full p-2 border rounded"
                  value={markerSearch}
                  onChange={(e) => setMarkerSearch(e.target.value)}
                />
              </div>
              {filteredMarkers.map(marker => (
                <Card key={marker.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 mr-4">
                        <h3 className="font-medium">{marker.title}</h3>
                        <p className="text-sm text-gray-500 break-words whitespace-pre-wrap max-w-[600px]">{marker.description}</p>
                        <div className="text-xs text-gray-400 mt-2">
                          <p>Широта: {marker.latitude.toFixed(6)}</p>
                          <p>Долгота: {marker.longitude.toFixed(6)}</p>
                          <p>Создано: {new Date(marker.createdAt).toLocaleString("ru-RU")}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteMarker(marker.id)}
                        >
                          Удалить
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <Link href={`/map?lat=${marker.latitude}&lng=${marker.longitude}&marker=${marker.id}`}>
                            Показать на карте
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredMarkers.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  {markerSearch ? "Геометки не найдены" : "Нет геометок"}
                </div>
              )}
            </TabsContent>

            <TabsContent value="photos" className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {userPhotos.map(photo => (
                  <Card key={photo.id} className="overflow-hidden">
                    <div className="relative w-full aspect-square bg-white">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <AuthImage
                          url={photo.url}
                          alt="Фото"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            {photo.geotag && (
                              <p className="text-sm text-gray-500 truncate">
                                Геометка: {photo.geotag.title || "Без названия"}
                              </p>
                            )}
                            <p className="text-xs text-gray-400">
                              Добавлено: {new Date(photo.uploadedAt || photo.createdAt).toLocaleString("ru-RU")}
                            </p>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeletePhoto(photo.id)}
                          >
                            Удалить
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {userPhotos.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  Нет фотографий
                </div>
              )}
            </TabsContent>

            <TabsContent value="reviews" className="space-y-4">
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Поиск по содержанию отзыва..."
                  className="w-full p-2 border rounded"
                  value={reviewSearch}
                  onChange={(e) => setReviewSearch(e.target.value)}
                />
              </div>
              {filteredReviews.map(review => (
                <Card key={review.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= (review.mark || 0)
                                    ? "text-yellow-400"
                                    : "text-gray-300"
                                }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="text-sm text-gray-500">
                            {review.mark}/5
                          </span>
                        </div>
                        <p className="text-sm">{review.text}</p>
                        <p className="text-xs text-gray-400">
                          Создано: {new Date(review.createdAt).toLocaleString("ru-RU")}
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteReview(review.geotagId, review.id)}
                      >
                        Удалить
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredReviews.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  {reviewSearch ? "Отзывы не найдены" : "Нет отзывов"}
                </div>
              )}
            </TabsContent>

            <TabsContent value="comments" className="space-y-4">
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Поиск по содержанию комментария..."
                  className="w-full p-2 border rounded"
                  value={commentSearch}
                  onChange={(e) => setCommentSearch(e.target.value)}
                />
              </div>
              {filteredComments.map(comment => (
                <Card key={comment.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <p className="text-sm">{comment.text}</p>
                        <p className="text-xs text-gray-400">
                          Добавлено: {new Date(comment.createdAt).toLocaleString("ru-RU")}
                        </p>
                        
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteComment(comment.photo?.id || "", comment.id)}
                      >
                        Удалить
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredComments.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  {commentSearch ? "Комментарии не найдены" : "Нет комментариев"}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
} 