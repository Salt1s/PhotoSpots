"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MapPin, ImageIcon, Star } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { MarkerData, PhotoData } from "@/app/types"
import Link from "next/link"
import { StarRating } from "@/components/star-rating"
import { AuthImage } from "@/components/auth-image"
import { ProfileHeader } from "@/components/profile-header"

interface UserProfile {
  id: string
  username: string
  email: string
  name: string
  description?: string
  avatar?: string
}

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

const getImageUrl = (photo: PhotoData): string => {
  if (photo.url.startsWith('data:') || photo.url.startsWith('http')) {
    return photo.url;
  }
  
  if (photo.url.startsWith('/uploads/photos/')) {
    const fileName = photo.url.split('/').pop();
    if (fileName) {
      return `${apiBaseUrl}/api/photos/data/${fileName}`;
    }
  }
  
  const fileName = photo.url.split('/').pop();
  return fileName ? `${apiBaseUrl}/api/photos/data/${fileName}` : photo.url;
};

export default function UserProfilePage() {
  const { username } = useParams()
  const { toast } = useToast()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [markers, setMarkers] = useState<MarkerData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchUserProfile()
  }, [username])

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("token")
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }
      
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const response = await fetch(`${apiBaseUrl}/api/profile/${username}`, {
        headers
      })

      if (!response.ok) {
        throw new Error("Не удалось загрузить данные профиля")
      }

      const data = await response.json()
      setUserProfile(data)

      // Загружаем геометки пользователя
      const markersResponse = await fetch(`${apiBaseUrl}/api/map/profile/${data.id}`, {
        headers
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
      console.error("Error fetching profile:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные профиля",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
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

  if (!userProfile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p>Пользователь не найден</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      <ProfileHeader
        name={userProfile.name}
        username={userProfile.username}
        email={userProfile.email}
        description={userProfile.description}
        isOwnProfile={false}
      />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Геометки пользователя</h2>
        </div>

        {markers.length === 0 ? (
          <Card className="w-full">
            <CardContent className="py-8">
              <div className="text-center space-y-4">
                <MapPin className="mx-auto h-12 w-12 text-gray-400" />
                <div className="space-y-2">
                  <h3 className="text-xl font-medium">Нет геометок</h3>
                  <p className="text-muted-foreground">
                    Пользователь еще не создал ни одной геометки.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {markers.map((marker) => (
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
                <div className="p-4 border-t">
                  <Button variant="outline" asChild className="w-full">
                    <Link href={`/map?marker=${marker.id}&lat=${marker.latitude}&lng=${marker.longitude}`}>
                      <MapPin className="w-4 h-4 mr-2" />
                      Показать на карте
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
 