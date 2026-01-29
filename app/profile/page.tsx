"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Edit, LogOut, MapPin, ImageIcon, Star, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { MarkerData, PhotoData } from "@/app/types"
import Link from "next/link"
import { StarRating } from "@/components/star-rating"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AuthImage } from "@/components/auth-image"
import { ProfileHeader } from "@/components/profile-header"

interface PersonalInfo {
  id: string
  username: string
  email: string
  name: string
  password: string
  description?: string
  avatar?: string
}

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

const getImageUrl = (photo: PhotoData): string => {
  // Если это уже готовый data URL или полный URL
  if (photo.url.startsWith('data:') || photo.url.startsWith('http')) {
    return photo.url;
  }
  
  // Если URL начинается с /uploads/photos/, извлекаем только имя файла
  if (photo.url.startsWith('/uploads/photos/')) {
    const fileName = photo.url.split('/').pop();
    if (fileName) {
      return `${apiBaseUrl}/api/photos/data/${fileName}`;
    }
  }
  
  // Для всех остальных случаев
  const fileName = photo.url.split('/').pop();
  return fileName ? `${apiBaseUrl}/api/photos/data/${fileName}` : photo.url;
};

export default function ProfilePage() {
  const { toast } = useToast()
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    id: "",
    username: "",
    email: "",
    name: "",
    description: "",
    password: "",
  })
  const [markers, setMarkers] = useState<MarkerData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [markerToDelete, setMarkerToDelete] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }

    setIsAuthenticated(true)
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${apiBaseUrl}/api/profile/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Не удалось загрузить данные профиля")
      }

      const data = await response.json()
      setPersonalInfo(data)

      // Загружаем геометки пользователя
      const markersResponse = await fetch(`${apiBaseUrl}/api/map/profile/${data.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!markersResponse.ok) {
        throw new Error("Не удалось загрузить геометки")
      }

      const markersData = await markersResponse.json()
      
      // Загружаем фотографии и отзывы для каждой геометки
      const markersWithDetails = await Promise.all(markersData.map(async (marker: MarkerData) => {
        try {
          const [photosResponse, reviewsResponse] = await Promise.all([
            fetch(`${apiBaseUrl}/api/photos/${marker.id}/all`),
            fetch(`${apiBaseUrl}/api/map/${marker.id}/reviews`)
          ]);

          const photos = photosResponse.ok ? await photosResponse.json() : [];
          const reviews = reviewsResponse.ok ? await reviewsResponse.json() : [];

          // Вычисляем рейтинг
          const rating = reviews.length > 0
            ? reviews.reduce((acc: number, review: any) => acc + (review.mark || 0), 0) / reviews.length
            : undefined;

          return {
            ...marker,
            photos,
            reviews,
            rating
          };
        } catch (error) {
          console.error(`Ошибка при загрузке данных для геометки ${marker.id}:`, error);
          return marker;
        }
      }));

      setMarkers(markersWithDetails);
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные профиля",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token")
    router.push("/login")
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const token = localStorage.getItem("token")
      
      // Отправляем только измененные поля
      const profileData = {
        username: personalInfo.username,
        name: personalInfo.name,
        email: personalInfo.email,
        description: personalInfo.description || "",
        password: personalInfo.password || ""

      }

      const response = await fetch(`${apiBaseUrl}/api/profile/${personalInfo.username}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Не удалось обновить профиль")
      }

      toast({
        title: "Успешно",
        description: "Профиль обновлен",
      })

      setIsEditing(false)
      fetchUserProfile()
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось обновить профиль",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteMarker = async () => {
    if (markerToDelete) {
    try {
      const token = localStorage.getItem("token")

        const response = await fetch(`${apiBaseUrl}/api/map/${markerToDelete}`, {
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

  if (isLoading) {
  return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
              <p>Загрузка профиля...</p>
            </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      <ProfileHeader
        name={personalInfo.name}
        username={personalInfo.username}
        email={personalInfo.email}
        description={personalInfo.description}
        isOwnProfile={true}
        onEdit={() => setIsEditing(true)}
        onLogout={handleLogout}
      />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Мои геометки</h2>
          <Button variant="default" onClick={() => router.push("/map")}>
            <MapPin className="w-4 h-4 mr-2" />
            Добавить новую геометку
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {markers.length === 0 ? (
            <Card className="w-full">
              <CardContent className="py-8">
                <div className="text-center space-y-4">
                  <MapPin className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="space-y-2">
                    <h3 className="text-xl font-medium">Нет геометок</h3>
                    <p className="text-muted-foreground">
                      У вас пока нет ни одной геометки.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            markers.map((marker) => (
              <Card key={marker.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-start justify-between gap-2">
                    <span className="truncate">{marker.title || "Без названия"}</span>
                    {marker.rating !== undefined && marker.rating > 0 && (
                      <div className="flex items-center shrink-0">
                        <StarRating value={marker.rating} readOnly size="sm" />
                        <span className="ml-2 text-sm text-gray-500">
                          ({marker.reviews?.length || 0})
                        </span>
                      </div>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-2 text-sm text-gray-500">
                    <div className="truncate">
                      <span className="font-medium">Широта:</span> {marker.latitude}
                    </div>
                    <div className="truncate">
                      <span className="font-medium">Долгота:</span> {marker.longitude}
                    </div>
                    {marker.description && (
                      <p className="line-clamp-2">{marker.description}</p>
                    )}
                    {marker.photos && marker.photos.length > 0 && (
                      <div className="mt-4">
                        <div className="relative w-full aspect-square rounded-md overflow-hidden bg-white">
                          <AuthImage
                            url={getImageUrl(marker.photos[0])}
                            alt={marker.title || "Фото геометки"}
                            className="object-cover w-full h-full"
                          />
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-4 mt-4">
                      <div className="flex items-center">
                        <ImageIcon className="w-4 h-4 mr-1" />
                        {marker.photos?.length || 0} фото
                      </div>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 mr-1" />
                        {marker.reviews?.length || 0} отзывов
                      </div>
                    </div>
                  </div>
                </CardContent>
                <div className="p-4 border-t flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => router.push(`/map?marker=${marker.id}&lat=${marker.latitude}&lng=${marker.longitude}`)}>
                    <MapPin className="w-4 h-4 mr-2" />
                    Показать на карте
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => setMarkerToDelete(marker.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактирование профиля</DialogTitle>
            <DialogDescription>
              Вы можете изменить свои данные здесь.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="flex items-start space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={personalInfo.avatar} />
                <AvatarFallback>{personalInfo.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-4">
                <div>
                  <Label htmlFor="username">Имя пользователя</Label>
                  <Input
                    id="username"
                    value={personalInfo.username}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                <div>
                  <Label htmlFor="name">Имя</Label>
                  <Input
                    id="name"
                    value={personalInfo.name}
                    onChange={(e) =>
                      setPersonalInfo((prev) => ({ 
                        ...prev, 
                        name: e.target.value.slice(0, 50) 
                      }))
                    }
                    maxLength={50}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={personalInfo.email}
                    onChange={(e) =>
                      setPersonalInfo((prev) => ({ ...prev, email: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center">
                    <Label htmlFor="description">О себе</Label>
                    <span className="text-xs text-gray-500">
                      {(personalInfo.description || "").length}/200
                    </span>
                  </div>
                  <Textarea
                    id="description"
                    value={personalInfo.description || ""}
                    onChange={(e) =>
                      setPersonalInfo((prev) => ({ 
                        ...prev, 
                        description: e.target.value.slice(0, 200) 
                      }))
                    }
                    maxLength={200}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                Отмена
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Сохранение..." : "Сохранить"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!markerToDelete} onOpenChange={() => setMarkerToDelete(null)}>
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
