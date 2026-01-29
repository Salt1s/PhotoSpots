"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Edit, Trash2, Star, ImageIcon } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { StarRating } from "@/components/star-rating"
import { MarkerData, UserData } from "@/app/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AuthImage } from "@/components/auth-image"
import { UserLink } from "@/components/user-link"

interface PersonalInfo extends UserData {
  email: string;
}

const calculateRating = (reviews: { rating?: number; mark: number }[] | undefined): number | undefined => {
  if (!reviews || reviews.length === 0) return undefined;
  
  const validReviews = reviews.filter(review => typeof review.mark === 'number' && review.mark > 0);
  if (validReviews.length === 0) return undefined;
  
  const sum = validReviews.reduce((acc, review) => acc + review.mark, 0);
  return sum / validReviews.length;
};

export default function MyMarkersPage() {
  const { toast } = useToast()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo | null>(null)
  const [markers, setMarkers] = useState<MarkerData[]>([])
  const [markerToDelete, setMarkerToDelete] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      window.location.href = "http://localhost:8080/login"
      return
    }

    const fetchUserData = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/profile/me", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error("Не удалось загрузить данные пользователя")
        }

        const userData = await response.json()
        setPersonalInfo(userData)
        setIsAuthenticated(true)
        fetchMyMarkers(userData)
      } catch (error) {
        console.error("Ошибка при загрузке данных пользователя:", error)
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить данные пользователя",
          variant: "destructive",
        })
        window.location.href = "http://localhost:8080/login"
      }
    }

    fetchUserData()
  }, [])

  const fetchMyMarkers = async (personalInfo: PersonalInfo) => {
    try {
      const token = localStorage.getItem("token")
      setIsLoading(true)

      const response = await fetch(`http://localhost:8080/api/map/profile/${personalInfo.id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Не удалось загрузить геометки")
      }

      const data = await response.json()
      console.log("Received markers data:", data)

      const markersWithDetails = await Promise.all(
          data.map(async (marker: MarkerData) => {
            try {
              const [photosResponse, reviewsResponse, markerDetails, ownerResponse] = await Promise.all([
                fetch(`http://localhost:8080/api/photos/${marker.id}/all`, {
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                }),
                fetch(`http://localhost:8080/api/map/${marker.id}/reviews`, {
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                }),
                fetch(`http://localhost:8080/api/map/${marker.id}`, {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }),
                marker.owner?.id ? fetch(`http://localhost:8080/api/profile/${marker.owner.id}`, {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }) : Promise.resolve(new Response(null, { status: 404 }))
              ])

              const photos = photosResponse.ok ? await photosResponse.json() : []
              const reviews = reviewsResponse.ok ? await reviewsResponse.json() : []
              const details = await markerDetails.json()
              
              let owner = marker.owner
              if (ownerResponse.ok) {
                const ownerData = await ownerResponse.json()
                owner = {
                  id: ownerData.id,
                  username: ownerData.username,
                  name: ownerData.name,
                  email: ownerData.email,
                  role: ownerData.role,
                  blocked: ownerData.blocked,
                  createdAt: ownerData.createdAt,
                  avatar: ownerData.avatar
                }
              }

              console.log("Marker details:", details)
              console.log("Owner data:", owner)

              const rating = calculateRating(reviews)

              return {
                ...marker,
                ...details,
                owner,
                photos,
                reviews,
                rating,
              }
            } catch (error) {
              console.error(`Ошибка при загрузке деталей для геометки ${marker.id}:`, error)
              return marker
            }
          })
      )

      setMarkers(markersWithDetails)
    } catch (error) {
      console.error("Ошибка при загрузке геометок:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить ваши геометки",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteMarker = async () => {
    if (markerToDelete) {
      try {
        const token = localStorage.getItem("token")

        const response = await fetch(`http://localhost:8080/api/map/${markerToDelete}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("Не удалось удалить геометку")
        }

        setMarkers(markers.filter((marker) => marker.id !== markerToDelete))
        toast({
          title: "Успешно",
          description: "Геометка успешно удалена",
        })
      } catch (error) {
        console.error("Ошибка при удалении геометки:", error)
        toast({
          title: "Ошибка",
          description: "Не удалось удалить геометку",
          variant: "destructive",
        })
      } finally {
        setMarkerToDelete(null)
      }
    }
  }

  // Удаление фотографии
  const handleDeletePhoto = async (markerId: string, photoId: string) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`http://localhost:8080/api/photos/${photoId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Не удалось удалить фотографию")
      }

      // Обновляем список фотографий в геометке
      setMarkers(prevMarkers =>
        prevMarkers.map(marker =>
          marker.id === markerId
            ? {
                ...marker,
                photos: marker.photos?.filter(photo => photo.id !== photoId) || []
              }
            : marker
        )
      )

      toast({
        title: "Успешно",
        description: "Фотография удалена",
      })
    } catch (error) {
      console.error("Ошибка при удалении фотографии:", error)
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
      const response = await fetch(`http://localhost:8080/api/photos/${photoId}/comments/${commentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Не удалось удалить комментарий")
      }

      // Обновляем список комментариев в фотографии
      setMarkers(prevMarkers =>
        prevMarkers.map(marker => ({
          ...marker,
          photos: marker.photos?.map(photo =>
            photo.id === photoId
              ? {
                  ...photo,
                  comments: photo.comments?.filter(comment => comment.id !== commentId) || []
                }
              : photo
          ) || []
        }))
      )

      toast({
        title: "Успешно",
        description: "Комментарий удален",
      })
    } catch (error) {
      console.error("Ошибка при удалении комментария:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось удалить комментарий",
        variant: "destructive",
      })
    }
  }

  // Удаление отзыва
  const handleDeleteReview = async (markerId: string, reviewId: string) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`http://localhost:8080/api/map/${markerId}/reviews/${reviewId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Не удалось удалить отзыв")
      }

      // Обновляем список отзывов в геометке
      setMarkers(prevMarkers =>
        prevMarkers.map(marker =>
          marker.id === markerId
            ? {
                ...marker,
                reviews: marker.reviews?.filter(review => review.id !== reviewId) || []
              }
            : marker
        )
      )

      toast({
        title: "Успешно",
        description: "Отзыв удален",
      })
    } catch (error) {
      console.error("Ошибка при удалении отзыва:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось удалить отзыв",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-8 max-w-[1400px]">
        <div className="w-full">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold">Мои геометки</h1>
            <Button asChild variant="default">
              <Link href="/map">
                <MapPin className="mr-2 h-4 w-4" />
                Добавить новую геометку
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-gray-600">Загрузка геометок...</p>
            </div>
          ) : markers.length === 0 ? (
            <Card className="w-full">
              <CardContent className="py-8">
                <div className="text-center space-y-4">
                  <MapPin className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="space-y-2">
                    <h3 className="text-xl font-medium">Нет геометок</h3>
                    <p className="text-muted-foreground">
                      Вы еще не создали ни одной геометки. Перейдите на карту, чтобы добавить свою первую геометку.
                    </p>
                  </div>
                  <Button asChild>
                    <Link href="/map">Перейти к карте</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 grid-cols-1">
              {markers.map((marker) => (
                <Card key={marker.id} className="w-full">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl font-semibold mb-2">{marker.title || "Без названия"}</CardTitle>
                        {marker.rating !== undefined && marker.rating > 0 && (
                          <div className="flex items-center space-x-1">
                            <StarRating value={marker.rating} readOnly size="sm" />
                            <span className="text-sm text-gray-500">
                              {marker.rating.toFixed(1)} ({marker.reviews?.length || 0})
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/markers/${marker.id}/edit`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Редактировать
                          </Link>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setMarkerToDelete(marker.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Удалить
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="photos" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="photos">
                          Фотографии ({marker.photos?.length || 0})
                        </TabsTrigger>
                        <TabsTrigger value="reviews">
                          Отзывы ({marker.reviews?.length || 0})
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="photos" className="space-y-6">
                        {marker.description && (
                          <div className="bg-muted/50 rounded-lg p-4">
                            <p className="text-muted-foreground break-words whitespace-pre-wrap">{marker.description}</p>
                          </div>
                        )}

                        {marker.photos && marker.photos.length > 0 ? (
                          <div className="grid grid-cols-1 gap-6">
                            {marker.photos.map((photo) => (
                              <Card key={photo.id} className="overflow-hidden">
                                <div className="relative w-full aspect-square bg-white">
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <AuthImage
                                      url={photo.url}
                                      alt="Фото геометки"
                                      className="max-h-full max-w-full object-contain"
                                    />
                                  </div>
                                </div>
                                <CardContent className="p-4">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="text-sm text-gray-500">
                                        Добавлено: {new Date(photo.createdAt).toLocaleString("ru-RU")}
                                      </p>
                                      {photo.comments && photo.comments.length > 0 && (
                                        <div className="mt-4 space-y-2">
                                          {photo.comments.map(comment => (
                                            <div key={comment.id} className="text-sm p-3 bg-gray-50 rounded">
                                              <div className="flex justify-between items-start">
                                                <div>
                                                  <div className="font-medium">
                                                    <UserLink username={comment.user?.username || ""} name={comment.user?.name} />
                                                  </div>
                                                  <p className="mt-1">{comment.text}</p>
                                                  <p className="text-xs text-gray-400 mt-1">
                                                    {new Date(comment.createdAt).toLocaleString("ru-RU")}
                                                  </p>
                                                </div>
                                                {personalInfo?.id === comment.user?.id && (
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-500 hover:text-red-700"
                                                    onClick={() => handleDeleteComment(photo.id, comment.id)}
                                                  >
                                                    Удалить
                                                  </Button>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      className="shrink-0"
                                      onClick={() => handleDeletePhoto(marker.id, photo.id)}
                                    >
                                      Удалить фото
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 bg-gray-50 rounded-md">
                            <p className="text-gray-500">Нет фотографий</p>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="reviews" className="space-y-4">
                        {marker.reviews && marker.reviews.length > 0 ? (
                          <div className="space-y-4">
                            {marker.reviews.map((review) => (
                              <Card key={review.id}>
                                <CardContent className="p-4">
                                  <div className="flex justify-between items-start">
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <StarRating value={review.mark || 0} readOnly size="sm" />
                                        <span className="text-sm text-gray-500">
                                          {review.mark}/5
                                        </span>
                                      </div>
                                      <p className="text-sm">{review.text}</p>
                                      <div className="flex items-center space-x-2">
                                        <UserLink username={review.user?.username || ""} name={review.user?.name} />
                                        <span className="text-xs text-gray-400">
                                          {new Date(review.createdAt).toLocaleString("ru-RU")}
                                        </span>
                                      </div>
                                    </div>
                                    {personalInfo?.id === review.user?.id && (
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleDeleteReview(marker.id, review.id)}
                                      >
                                        Удалить
                                      </Button>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 bg-gray-50 rounded-md">
                            <p className="text-gray-500">Нет отзывов</p>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-4 border-t">
                    <Button variant="outline" size="sm" asChild>
                      <Link 
                        href={`/map?lat=${marker.latitude}&lng=${marker.longitude}&marker=${marker.id}`}
                      >
                        <MapPin className="mr-2 h-4 w-4" />
                        Показать на карте
                      </Link>
                    </Button>
                    <div className="text-xs text-gray-400">
                      <p>Широта: {marker.latitude.toFixed(6)}</p>
                      <p>Долгота: {marker.longitude.toFixed(6)}</p>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!markerToDelete} onOpenChange={(open) => !open && setMarkerToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удаление геометки</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить эту геометку? Это действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkerToDelete(null)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDeleteMarker}>
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
