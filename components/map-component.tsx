"use client"

import { Input } from "@/components/ui/input"
import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { StarRating } from "@/components/star-rating"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {AlertCircle, UploadIcon, Copy} from "lucide-react"
import Image from "next/image"
import { memo } from "react"
import { UserLink } from "@/components/user-link"
import type { MarkerData, PhotoData, ReviewData, UserData, CommentData } from "@/app/types/index"
import Link from "next/link"

interface AuthImageProps {
  url: string;
  alt: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNFNUU3RUIiLz48cGF0aCBkPSJNODAgOTBDODAgOTkuOTQxMSA3MS45NDExIDEwOCA2MiAxMDhDNTIuMDU4OSAxMDggNDQgOTkuOTQxMSA0NCA5MEM0NCA4MC4wNTg5IDUyLjA1ODkgNzIgNjIgNzJDNzEuOTQxMSA3MiA4MCA4MC4wNTg5IDgwIDkwWiIgZmlsbD0iI0QxRDVEQiIvPjxwYXRoIGQ9Ik0xNTAgNzJDMTU5Ljk0MSA3MiAxNjggODAuMDU4OSAxNjggOTBDMTY4IDk5Ljk0MTEgMTU5Ljk0MSAxMDggMTUwIDEwOEMxNDAuMDU5IDEwOCAxMzIgOTkuOTQxMSAxMzIgOTBDMTMyIDgwLjA1ODkgMTQwLjA1OSA3MiAxNTAgNzJaIiBmaWxsPSIjRDFENURCIi8+PHBhdGggZD0iTTEyMCAxNTJDMTIwIDE2MS45NDEgMTExLjk0MSAxNzAgMTAyIDE3MEM5Mi4wNTg5IDE3MCA4NCAxNjEuOTQxIDg0IDE1MkM4NCAxNDIuMDU5IDkyLjA1ODkgMTM0IDEwMiAxMzRDMTExLjk0MSAxMzQgMTIwIDE0Mi4wNTkgMTIwIDE1MloiIGZpbGw9IiNEMUQ1REIiLz48L3N2Zz4=';


const AuthImage: React.FC<AuthImageProps> = memo(({ url, alt, className, onLoad, onError }) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const token = localStorage.getItem("token");
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let objectUrl: string | null = null;

    const loadImage = async () => {
      if (!url || hasError) return;
      
      try {
        // Если это уже data URL или изображение-заглушка, используем его напрямую
        if (url.startsWith('data:') || url === PLACEHOLDER_IMAGE) {
          setImageSrc(url);
          setIsLoading(false);
          onLoad?.();
          return;
        }

        const response = await fetch(url, {
          // headers: {
          //   Authorization: `Bearer ${token}`
          // }
        });

        if (!response.ok) {
          throw new Error('Failed to load image');
        }

        const contentType = response.headers.get('content-type');
        
        if (contentType?.includes('application/json')) {
          const jsonData = await response.json();
          
          if (jsonData.data) {
            const base64Data = jsonData.data;
            const imageData = base64Data.startsWith('data:image/') 
              ? base64Data 
              : `data:image/jpeg;base64,${base64Data}`;
            
            if (isMounted) {
              setImageSrc(imageData);
              setIsLoading(false);
              onLoad?.();
            }
            return;
          }
          throw new Error('Invalid JSON response structure');
        }

        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);

        if (isMounted) {
          setImageSrc(objectUrl);
          setIsLoading(false);
          onLoad?.();
        }
      } catch (error) {
        if (isMounted) {
          setImageSrc(PLACEHOLDER_IMAGE);
          setHasError(true);
          setIsLoading(false);
          onError?.();
        }
      }
    };

    setIsLoading(true);
    loadImage();

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [url, token]);

  const imageContent = useMemo(() => {
    if (isLoading) {
      return (
        <div className={className}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      );
    }

    if (!imageSrc) {
      return (
        <div className={className}>
          <img src={PLACEHOLDER_IMAGE} alt={alt} className={className} />
        </div>
      );
    }

    return (
      <img
        src={imageSrc}
        alt={alt}
        className={className}
        onError={() => {
          setHasError(true);
          setImageSrc(PLACEHOLDER_IMAGE);
          onError?.();
        }}
      />
    );
  }, [imageSrc, isLoading, className, alt, onError]);

  return imageContent;
});

AuthImage.displayName = 'AuthImage';

// Добавим константы для координат Санкт-Петербурга и настроек отображения
const SAINT_PETERSBURG_COORDS = {
  lat: 59.9375,
  lng: 30.308611
};
const DEFAULT_ZOOM = 12;
const MARKER_ZOOM = 200; // Меняем на максимально детальный, но допустимый зум

interface MapComponentProps {
  onMapClick: (lat: number, lng: number) => void
  selectedPosition: { lat: number; lng: number } | null
  shouldRefresh?: boolean
  onMapRefreshed?: () => void
  apiBaseUrl?: string
  initialMarkerId?: string
  isAuthenticated: boolean
}

export default function MapComponent({
                                       onMapClick,
                                       selectedPosition,
                                       shouldRefresh = false,
                                       onMapRefreshed,
                                       apiBaseUrl = "http://localhost:8080",
                                       initialMarkerId,
                                       isAuthenticated,
                                     }: MapComponentProps) {
  const { toast } = useToast()
  const mapRef = useRef<L.Map | null>(null)
  const tempMarkerRef = useRef<L.Marker | null>(null)
  const markersLayerRef = useRef<L.LayerGroup | null>(null)
  const [markers, setMarkers] = useState<MarkerData[]>([])
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null)
  const [markerPhotos, setMarkerPhotos] = useState<PhotoData[]>([])
  const [markerReviews, setMarkerReviews] = useState<ReviewData[]>([])
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoData | null>(null)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [showPhotoForm, setShowPhotoForm] = useState(false)
  const [showCommentForm, setShowCommentForm] = useState(false)
  const [reviewText, setReviewText] = useState("")
  const [reviewRating, setReviewRating] = useState(0)
  const [commentText, setCommentText] = useState("")
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [imageLoading, setImageLoading] = useState<Record<string, boolean>>({})
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editingReviewText, setEditingReviewText] = useState("");
  const [editingReviewRating, setEditingReviewRating] = useState(0);
  const [showEditReviewForm, setShowEditReviewForm] = useState(false);

  const handleImageLoad = useCallback((photoId: string) => {
    setImageLoading(prev => ({...prev, [photoId]: false}));
  }, []);

  const createUserData = (owner: any): UserData => {
    return {
      id: owner?.id?.toString() || 'unknown',
      username: owner?.username || 'Аноним',
      name: owner?.name || '',
      email: owner?.email || '',
      role: owner?.role || 'ROLE_USER',
      blocked: owner?.blocked || false,
      createdAt: owner?.createdAt || new Date().toISOString(),
      ...(owner?.avatar ? { avatar: owner.avatar } : {})
    };
  };

  const fetchComments = useCallback(async (photoId: string): Promise<CommentData[]> => {
    try {
      const token = localStorage.getItem("token")
      const headers: HeadersInit = {
          "Content-Type": "application/json",
      }
      
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const response = await fetch(`${apiBaseUrl}/api/photos/${photoId}/comments`, {
        headers
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const comments: CommentData[] = await response.json()
      console.log('Received comments from server:', comments)
      return comments.map(comment => ({
        ...comment,
        user: comment.owner ? createUserData(comment.owner) : createUserData({ id: 'unknown', username: 'Аноним' })
      }))
    } catch (error) {
      console.error("Ошибка при загрузке комментариев:", error)
      return []
    }
  }, [apiBaseUrl])

  const loadPhotoWithComments = useCallback(async (photo: PhotoData | null): Promise<PhotoData | null> => {
    if (!photo || !photo.id) {
      console.error("Invalid photo data:", photo)
      return null
    }

    try {
      const comments = await fetchComments(photo.id)
      return {
        ...photo,
        comments: comments.map(comment => ({
          ...comment,
          user: comment.owner ? createUserData(comment.owner) : createUserData({ id: 'unknown', username: 'Аноним' })
        }))
      }
    } catch (error) {
      console.error("Ошибка загрузки комментариев:", error)
      return {
        ...photo,
        comments: []
      }
    }
  }, [fetchComments])

  const getImageUrl = useCallback((photo: PhotoData): string => {
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
  }, [apiBaseUrl]);

  const fetchPhotos = useCallback(async (geotagId: string): Promise<PhotoData[]> => {
    try {
      const token = localStorage.getItem("token")
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }
      
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const response = await fetch(`${apiBaseUrl}/api/photos/${geotagId}/all`, {
        headers
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const photos: PhotoData[] = await response.json()
      console.log('Received photos from server:', photos)

      // Создаем Map для уникальных фотографий по ID
      const uniquePhotosMap = new Map<string, PhotoData>();
      
      // Загружаем комментарии для каждой фотографии
      const photosWithComments = await Promise.all(photos.map(async (photo) => {
        try {
          const comments = await fetchComments(photo.id);
          return {
        ...photo,
            url: photo.url || PLACEHOLDER_IMAGE,
            user: photo.owner ? createUserData(photo.owner) : createUserData({ id: 'unknown', username: 'Аноним' }),
            createdAt: photo.uploadedAt || new Date().toISOString(),
            comments: comments.map(comment => ({
          ...comment,
              user: comment.owner ? createUserData(comment.owner) : createUserData({ id: 'unknown', username: 'Аноним' })
            }))
          };
        } catch (error) {
          console.error(`Ошибка при загрузке комментариев для фото ${photo.id}:`, error);
          return {
            ...photo,
            url: photo.url || PLACEHOLDER_IMAGE,
            user: photo.owner ? createUserData(photo.owner) : createUserData({ id: 'unknown', username: 'Аноним' }),
            createdAt: photo.uploadedAt || new Date().toISOString(),
            comments: []
          };
        }
      }));

      // Сохраняем только уникальные фотографии
      photosWithComments.forEach(photo => {
        if (!uniquePhotosMap.has(photo.id)) {
          uniquePhotosMap.set(photo.id, photo);
        }
      });

      // Преобразуем Map обратно в массив и сортируем
      const processedPhotos = Array.from(uniquePhotosMap.values());
      
      // Сортируем по дате создания (новые первыми)
      return processedPhotos.sort((a: PhotoData, b: PhotoData) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    } catch (error) {
      console.error("Ошибка при загрузке фотографий:", error)
      return []
    }
  }, [apiBaseUrl, fetchComments])

  const fetchReviews = useCallback(async (geotagId: string) => {
    try {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }
      
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const response = await fetch(`${apiBaseUrl}/api/map/${geotagId}/reviews`, {
        headers
      });

      if (!response.ok) {
        throw new Error("Не удалось загрузить отзывы")
      }

      const reviews = await response.json()
      console.log('Raw reviews from server:', reviews);

      if (!Array.isArray(reviews)) {
        console.error('Reviews is not an array:', reviews);
        return [];
      }

      const processedReviews: ReviewData[] = reviews
        .filter((review: any) => review && review.owner)
        .map((review: any) => {
          const owner = createUserData(review.owner);

          return {
            id: review.id.toString(),
            text: review.text || "",
            mark: review.mark || 0,
            rating: review.mark || 0,
            geotagId: geotagId,
            userId: owner.id,
            createdAt: review.createdAt,
            user: owner,
            owner: owner
          };
        });

      console.log('Processed reviews:', processedReviews);
      return processedReviews;
    } catch (error) {
      console.error("Ошибка при загрузке отзывов:", error)
      return []
    }
  }, [apiBaseUrl]);

  const calculateRating = (reviews: ReviewData[] | undefined): number | undefined => {
    if (!reviews || reviews.length === 0) return undefined;
    
    const validReviews = reviews.filter(review => typeof review.mark === 'number' && review.mark > 0);
    if (validReviews.length === 0) return undefined;
    
    const sum = validReviews.reduce((acc, review) => acc + review.mark, 0);
    return sum / validReviews.length;
  };

  const calculateAverageRating = (reviews: ReviewData[]): number => {
    if (!reviews?.length) return 0
    
    // Фильтруем отзывы с рейтингом больше 0
    const validReviews = reviews.filter(review => review.mark > 0)
    
    if (validReviews.length === 0) return 0
    
    const sum = validReviews.reduce((acc, review) => acc + review.mark, 0)
    return sum / validReviews.length
  }

  const handleMarkerClick = useCallback(async (marker: MarkerData) => {
    if (!marker || !marker.id) {
      console.error("Invalid marker data:", marker);
      toast({
        title: "Ошибка",
        description: "Некорректные данные геометки",
        variant: "destructive",
      });
      return;
    }

    setSelectedMarker(marker);
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }
      
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const [photos, reviews, markerDetailsResponse] = await Promise.all([
        fetchPhotos(marker.id),
        fetchReviews(marker.id),
        fetch(`${apiBaseUrl}/api/map/${marker.id}`, {
          headers
        })
      ]);

      if (!markerDetailsResponse.ok) {
        throw new Error(`HTTP error! status: ${markerDetailsResponse.status}`)
      }

      const markerDetails = await markerDetailsResponse.json();

      const owner = markerDetails.owner ? {
        id: markerDetails.owner.id.toString(),
        username: markerDetails.owner.username || markerDetails.owner.name || "Аноним",
        name: markerDetails.owner.name,
        avatar: markerDetails.owner.avatar
      } : undefined;

      console.log("Marker details:", markerDetails);
      console.log("Owner data:", owner);
      console.log("Photos with comments:", photos);
      console.log("Reviews:", reviews);

      const rating = calculateRating(reviews);
      console.log("Calculated rating:", rating);

      const updatedMarker = {
        ...marker,
        ...markerDetails,
        owner,
        photos,
        reviews,
        rating
      };

      console.log("Updated marker data:", updatedMarker);
      setSelectedMarker(updatedMarker);
      setMarkerPhotos(photos);
      setMarkerReviews(reviews);
    } catch (error) {
      console.error("Ошибка загрузки данных:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные о геометке",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, fetchPhotos, fetchReviews, apiBaseUrl]);

  const updateMarkersOnMap = useCallback((markersData: MarkerData[]) => {
    if (!mapRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    const DefaultIcon = L.divIcon({
      html: `<svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41" fill="none">
        <path d="M12.5 0C5.59644 0 0 5.59644 0 12.5C0 14.4084 0.0590137 16.8336 2.08984 20.7812L12.5 41L22.9102 20.7812C24.941 16.8336 25 14.4084 25 12.5C25 5.59644 19.4036 0 12.5 0ZM12.5 17C10.0147 17 8 14.9853 8 12.5C8 10.0147 10.0147 8 12.5 8C14.9853 8 17 10.0147 17 12.5C17 14.9853 14.9853 17 12.5 17Z" fill="#2A75FF"/>
        <circle cx="12.5" cy="12.5" r="4.5" fill="white"/>
      </svg>`,
      className: "",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    });

    markersData.forEach((marker) => {
      console.log("Processing marker for map:", marker);
      const rating = calculateRating(marker.reviews);
      console.log("Calculated rating for marker:", rating);

      const newMarker = L.marker([marker.latitude, marker.longitude], { icon: DefaultIcon })
        .addTo(markersLayerRef.current!)
        .bindPopup(
          `<div class="marker-popup" style="max-width: 200px;">
            <h3 style="font-weight: 600; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${marker.title || "Без названия"}</h3>
            ${typeof rating === 'number' ? 
              `<p class="rating" style="margin: 4px 0;">${rating.toFixed(1)}/5</p>` : ''}
            ${marker.description ? 
              `<p style="margin: 4px 0; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; max-height: 40px;">${marker.description}</p>` : ""}
            <p style="margin: 4px 0; font-size: 0.875rem;">Автор: ${
              marker.owner?.username ? 
              `<a href="/profile/${marker.owner.username}" style="color: #2563eb; text-decoration: none;">${marker.owner.username}</a>` : 
              "Аноним"
            }</p>
            <button class="view-marker" data-id="${marker.id}">Подробнее</button>
          </div>`,
          { 
            className: 'custom-popup',
            maxWidth: 250
          }
        );

      newMarker.on("popupopen", () => {
        const button = document.querySelector(`.view-marker[data-id="${marker.id}"]`);
        if (button) {
          const clickHandler = (e: Event) => {
            e.preventDefault();
            e.stopPropagation();
            handleMarkerClick(marker);
          };
          button.addEventListener("click", clickHandler);
          
          newMarker.on("popupclose", () => {
            button.removeEventListener("click", clickHandler);
          });
        }
      });
    });
  }, [handleMarkerClick]);

  const fetchMarkers = async () => {
    setApiError(null);
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }
      
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const response = await fetch(`${apiBaseUrl}/api/map`, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Received markers data:", data);

      const markersWithDetails = data.map((marker: MarkerData) => {
        console.log("Processing marker:", marker);
        
        const rating = calculateRating(marker.reviews);
        console.log("Calculated rating:", rating);
        
        return {
          ...marker,
          rating,
          owner: marker.owner ? {
            id: marker.owner.id.toString(),
            username: marker.owner.username || marker.owner.name || "Аноним",
            name: marker.owner.name,
            avatar: marker.owner.avatar
          } : undefined
        };
      });

      console.log("Processed markers:", markersWithDetails);
      setMarkers(markersWithDetails);
      return markersWithDetails;
    } catch (error) {
      console.error("Error fetching markers:", error);
      setApiError("Не удалось загрузить геометки. Проверьте соединение с сервером.");
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить геометки",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const addReview = async (geotagId: string, text: string, rating: number) => {
    const token = localStorage.getItem("token")
    if (!token) {
      toast({
        title: "Ошибка",
        description: "Требуется авторизация",
        variant: "destructive",
      })
      throw new Error("Требуется авторизация")
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/map/${geotagId}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text, mark: rating }),
      })

      if (!response.ok) throw new Error("Не удалось добавить отзыв")

      // После успешного добавления, обновляем список отзывов
      const reviews = await fetchReviews(geotagId)
      setMarkerReviews(reviews)
      
      return reviews[reviews.length - 1] // Возвращаем последний добавленный отзыв
    } catch (error) {
      console.error("Error adding review:", error)
      throw error
    }
  }

  useEffect(() => {
    if (selectedPhoto?.id) {
      fetchComments(selectedPhoto.id)
          .then(comments => {
            // обработка комментариев
          })
          .catch(error => {
            console.error("Failed to load comments:", error);
          });
    }
  }, [selectedPhoto]);

  const addPhoto = async (geotagId: string, files: File[]): Promise<PhotoData[]> => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        title: "Ошибка",
        description: "Требуется авторизация",
        variant: "destructive",
      });
      throw new Error("Требуется авторизация");
    }

    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append("files", file);
      });

      const response = await fetch(`${apiBaseUrl}/api/photos/${geotagId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Не удалось добавить фотографии");
      }

      // Получаем текст ответа
      const responseText = await response.text();
      console.log("Ответ сервера:", responseText);

      // Делаем небольшую задержку перед запросом обновленного списка
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Получаем обновленный список фотографий
      return await fetchPhotos(geotagId);

    } catch (error) {
      console.error("Ошибка при добавлении фотографий:", error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось загрузить фотографии",
        variant: "destructive",
      });
      throw error;
    }
  };

  const addComment = async (photoId: string, text: string): Promise<void> => {
    const token = localStorage.getItem("token")
    if (!token) {
      toast({
        title: "Ошибка",
            description: "Требуется авторизация",
        variant: "destructive",
        })
        throw new Error("Требуется авторизация")
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/photos/${photoId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
        })

      if (!response.ok) {
            throw new Error("Не удалось добавить комментарий")
        }

        toast({
            title: "Успешно",
            description: "Комментарий добавлен",
        })
    } catch (error) {
        console.error("Ошибка при добавлении комментария:", error)
        toast({
            title: "Ошибка",
            description: error instanceof Error ? error.message : "Не удалось добавить комментарий",
            variant: "destructive",
        })
        throw error
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPhoto || !commentText.trim()) return

    setIsLoading(true)
    try {
        await addComment(selectedPhoto.id, commentText)
        
        // Перезагружаем фото с комментариями
        const updatedPhoto = await loadPhotoWithComments(selectedPhoto)
        if (updatedPhoto) {
            setSelectedPhoto(updatedPhoto)
            // Обновляем фото в общем списке
      setMarkerPhotos(prevPhotos =>
          prevPhotos.map(photo =>
                    photo.id === updatedPhoto.id ? updatedPhoto : photo
                )
            )
        }

        // Очищаем форму и закрываем её
        setCommentText("")
        setShowCommentForm(false)
    } catch (error) {
        // Ошибка уже обработана в addComment
    } finally {
        setIsLoading(false)
    }
  };

  const handleMapClickWrapper = useCallback((lat: number, lng: number) => {
    if (!isAuthenticated) {
      toast({
        title: "Требуется авторизация",
        description: "Войдите или зарегистрируйтесь, чтобы добавить новую геометку",
        variant: "destructive",
      })
      return
    }
    onMapClick(lat, lng)
  }, [isAuthenticated, toast, onMapClick])

  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map("map").setView([SAINT_PETERSBURG_COORDS.lat, SAINT_PETERSBURG_COORDS.lng], DEFAULT_ZOOM);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapRef.current);

      mapRef.current.on("click", (e) => {
        handleMapClickWrapper(e.latlng.lat, e.latlng.lng);
        L.DomEvent.stopPropagation(e);
      });

      markersLayerRef.current = L.layerGroup().addTo(mapRef.current);
    }

    // Если есть selectedPosition, центрируем карту на этих координатах
    if (selectedPosition && mapRef.current) {
      mapRef.current.setView([selectedPosition.lat, selectedPosition.lng], MARKER_ZOOM);
    }

      fetchMarkers().then(markersData => {
        if (markersData.length > 0) {
        updateMarkersOnMap(markersData);
        
        // Если есть initialMarkerId, находим соответствующий маркер и открываем его
        if (initialMarkerId) {
          const marker = markersData.find((m: MarkerData) => m.id === initialMarkerId);
          if (marker) {
            handleMarkerClick(marker);
            // Центрируем карту на координатах маркера с максимальным зумом
            if (mapRef.current) {
              mapRef.current.setView([marker.latitude, marker.longitude], MARKER_ZOOM);
            }
          }
        }
      }
    });

    return () => {
      if (mapRef.current) {
        if (tempMarkerRef.current) {
          mapRef.current.removeLayer(tempMarkerRef.current);
        }
        if (markersLayerRef.current) {
          markersLayerRef.current.clearLayers();
        }
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [selectedPosition, initialMarkerId, handleMarkerClick, updateMarkersOnMap, handleMapClickWrapper]);

  useEffect(() => {
    if (shouldRefresh) {
      fetchMarkers().then(markersData => {
        if (markersData.length > 0) {
          updateMarkersOnMap(markersData)
        }
        if (onMapRefreshed) onMapRefreshed()
      })
    }
  }, [shouldRefresh, onMapRefreshed, updateMarkersOnMap])

  const handleAddReview = () => {
    if (!isAuthenticated) {
      toast({
        title: "Требуется авторизация",
        description: "Войдите или зарегистрируйтесь, чтобы оставить отзыв",
        variant: "destructive",
      })
      return
    }
    setShowReviewForm(true)
  }

  const handleAddPhoto = () => {
    if (!isAuthenticated) {
      toast({
        title: "Требуется авторизация",
        description: "Войдите или зарегистрируйтесь, чтобы добавить фотографии",
        variant: "destructive",
      })
      return
    }
    setPhotoFiles([])
    setPhotoPreviews([])
    setShowPhotoForm(true)
  }

  const handleAddComment = (photo: PhotoData) => {
    if (!isAuthenticated) {
      toast({
        title: "Требуется авторизация",
        description: "Войдите или зарегистрируйтесь, чтобы добавить комментарий",
        variant: "destructive",
      })
      return
    }
    setSelectedPhoto(photo)
    setCommentText("")
    setShowCommentForm(true)
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const maxSize = 5 * 1024 * 1024; // 5MB
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      
      const newFiles = Array.from(e.target.files).filter(file => {
        if (file.size > maxSize) {
          toast({
            title: "Ошибка",
            description: `Файл ${file.name} слишком большой. Максимальный размер 5MB`,
            variant: "destructive",
          });
          return false;
        }
        if (!allowedTypes.includes(file.type)) {
          toast({
            title: "Ошибка",
            description: `Файл ${file.name} имеет неподдерживаемый формат`,
            variant: "destructive",
          });
          return false;
        }
        return true;
      });

      // Обновляем список файлов
      setPhotoFiles(prev => [...prev, ...newFiles]);

      // Создаем превью для новых файлов
      const newPreviews: string[] = [];

      newFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result as string);

          // Обновляем превью, когда все файлы прочитаны
          if (newPreviews.length === newFiles.length) {
            setPhotoPreviews(prev => [...prev, ...newPreviews]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotoFiles(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMarker || reviewRating === 0) return

    setIsLoading(true)
    try {
      await addReview(selectedMarker.id, reviewText, reviewRating)
      toast({
        title: "Успешно",
        description: "Отзыв добавлен",
      })
      setShowReviewForm(false)
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось добавить отзыв",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitPhoto = async (e: File[]) => {
    if (!selectedMarker || !photoFiles.length) return;

    setIsLoading(true);
    try {
      const newPhotos = await addPhoto(selectedMarker.id, photoFiles);

      // Обновляем состояние, избегая дублирования
      setMarkerPhotos(prevPhotos => {
        const uniquePhotos = new Map();
        
        // Добавляем существующие фото
        prevPhotos.forEach(photo => {
          uniquePhotos.set(photo.id, photo);
        });
        
        // Добавляем новые фото, перезаписывая существующие если есть
        newPhotos.forEach(photo => {
          uniquePhotos.set(photo.id, photo);
        });
        
        // Преобразуем Map обратно в массив и сортируем по дате
        return Array.from(uniquePhotos.values())
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      });

      setPhotoFiles([]);
      setPhotoPreviews([]);
      setShowPhotoForm(false);
    } catch (error) {
      // Ошибка уже обработана в addPhoto
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!mapRef.current) return

    const TempMarkerIcon = L.divIcon({
      html: `<svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41" fill="none">
        <path d="M12.5 0C5.59644 0 0 5.59644 0 12.5C0 14.4084 0.0590137 16.8336 2.08984 20.7812L12.5 41L22.9102 20.7812C24.941 16.8336 25 14.4084 25 12.5C25 5.59644 19.4036 0 12.5 0ZM12.5 17C10.0147 17 8 14.9853 8 12.5C8 10.0147 10.0147 8 12.5 8C14.9853 8 17 10.0147 17 12.5C17 14.9853 14.9853 17 12.5 17Z" fill="#FF4A4A"/>
        <circle cx="12.5" cy="12.5" r="4.5" fill="white"/>
      </svg>`,
      className: "",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    })

    if (tempMarkerRef.current) {
      mapRef.current.removeLayer(tempMarkerRef.current)
      tempMarkerRef.current = null
    }

    if (selectedPosition) {
      tempMarkerRef.current = L.marker([selectedPosition.lat, selectedPosition.lng], {
        icon: TempMarkerIcon,
      }).addTo(mapRef.current)
      mapRef.current.panTo([selectedPosition.lat, selectedPosition.lng])
    }
  }, [selectedPosition])

  // Добавим функцию для переключения видимости комментариев
  const toggleComments = useCallback((photoId: string) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(photoId)) {
        newSet.delete(photoId);
      } else {
        newSet.add(photoId);
      }
      return newSet;
    });
  }, []);

  useEffect(() => {
    // Получаем текущего пользователя через API
    const fetchCurrentUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const response = await fetch(`${apiBaseUrl}/api/profile/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }

        const userData = await response.json();
        console.log("Fetched user data:", userData);
        setCurrentUser(userData);
    } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchCurrentUser();
  }, [apiBaseUrl]);

  const updateComment = async (photoId: string, commentId: string, text: string): Promise<void> => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        title: "Ошибка",
        description: "Требуется авторизация",
        variant: "destructive",
      });
      throw new Error("Требуется авторизация");
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/photos/${photoId}/comments/${commentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error("Не удалось обновить комментарий");
      }

      toast({
        title: "Успешно",
        description: "Комментарий обновлен",
      });

      // Обновляем фото с комментариями после редактирования
      await refreshPhotoComments(photoId);
    } catch (error) {
      console.error("Ошибка при обновлении комментария:", error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось обновить комментарий",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteComment = async (photoId: string, commentId: string): Promise<void> => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        title: "Ошибка",
        description: "Требуется авторизация",
        variant: "destructive",
      });
      throw new Error("Требуется авторизация");
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/photos/${photoId}/comments/${commentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Не удалось удалить комментарий");
      }

      toast({
        title: "Успешно",
        description: "Комментарий удален",
      });

      // Обновляем фото с комментариями после удаления
      await refreshPhotoComments(photoId);
    } catch (error) {
      console.error("Ошибка при удалении комментария:", error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось удалить комментарий",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Добавляем функцию для обновления комментариев фотографии
  const refreshPhotoComments = async (photoId: string) => {
    if (!selectedMarker) return;

    try {
      // Получаем обновленные данные фотографии с комментариями
      const photos = await fetchPhotos(selectedMarker.id);
      const updatedPhoto = photos.find(p => p.id === photoId);
      
      if (updatedPhoto) {
        // Обновляем состояние выбранной фотографии
        setSelectedPhoto(updatedPhoto);
        
        // Обновляем фото в общем списке
        setMarkerPhotos(prevPhotos =>
          prevPhotos.map(photo =>
            photo.id === photoId ? updatedPhoto : photo
          )
        );
      }
    } catch (error) {
      console.error("Ошибка при обновлении комментариев:", error);
    }
  };

  const handleEditComment = (commentId: string, text: string) => {
    setEditingCommentId(commentId);
    setEditingCommentText(text);
  };

  const handleSaveComment = async (photoId: string, commentId: string) => {
    try {
      await updateComment(photoId, commentId, editingCommentText);
      setEditingCommentId(null);
      setEditingCommentText("");
    } catch (error) {
      // Ошибка уже обработана в updateComment
    }
  };

  const handleSaveReview = async (geotagId: string, reviewId: string) => {
    try {
      await updateReview(geotagId, reviewId, editingReviewText, editingReviewRating);
      handleCancelEditReview(); // Закрываем модальное окно после успешного сохранения
    } catch (error) {
      // Ошибка уже обработана в updateReview
    }
  };

  const handleEditReview = (review: ReviewData) => {
    console.log("Editing review:", review);
    
    // Проверяем наличие всех необходимых полей
    if (!review?.id || typeof review.id !== 'string') {
      console.error("Invalid review ID:", review?.id);
      toast({
        title: "Ошибка",
        description: "Некорректный ID отзыва",
        variant: "destructive",
      });
      return;
    }

    // Проверяем наличие текста отзыва
    const reviewText = review.text || "";
    
    // Проверяем наличие рейтинга
    const reviewRating = review.mark || 0;
    
    console.log("Setting review data:", {
      id: review.id,
      text: reviewText,
      rating: reviewRating
    });

    setEditingReviewId(review.id);
    setEditingReviewText(reviewText);
    setEditingReviewRating(reviewRating);
    setShowEditReviewForm(true);
  };

  const deleteReview = async (geotagId: string, reviewId: string): Promise<void> => {
    if (!reviewId) {
      console.error("Invalid review ID");
      toast({
        title: "Ошибка",
        description: "Некорректный ID отзыва",
        variant: "destructive",
      });
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        title: "Ошибка",
        description: "Требуется авторизация",
        variant: "destructive",
      });
      throw new Error("Требуется авторизация");
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/map/${geotagId}/reviews/${reviewId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Не удалось удалить отзыв");
      }

      toast({
        title: "Успешно",
        description: "Отзыв удален",
      });

      // Обновляем список отзывов
      await refreshReviews(geotagId);
    } catch (error) {
      console.error("Ошибка при удалении отзыва:", error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось удалить отзыв",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateReview = async (geotagId: string, reviewId: string, text: string, rating: number): Promise<void> => {
    if (!reviewId) {
      console.error("Invalid review ID");
      toast({
        title: "Ошибка",
        description: "Некорректный ID отзыва",
        variant: "destructive",
      });
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        title: "Ошибка",
        description: "Требуется авторизация",
        variant: "destructive",
      });
      throw new Error("Требуется авторизация");
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/map/${geotagId}/reviews/${reviewId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text, mark: rating }),
      });

      if (!response.ok) {
        throw new Error("Не удалось обновить отзыв");
      }

      toast({
        title: "Успешно",
        description: "Отзыв обновлен",
      });

      // Обновляем список отзывов
      await refreshReviews(geotagId);
    } catch (error) {
      console.error("Ошибка при обновлении отзыва:", error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось обновить отзыв",
        variant: "destructive",
      });
      throw error;
    }
  };

  const refreshReviews = async (geotagId: string) => {
    try {
      const reviews = await fetchReviews(geotagId);
      console.log('Reviews after refresh:', reviews);
      if (Array.isArray(reviews)) {
        setMarkerReviews(reviews);
      } else {
        console.error('Invalid reviews data:', reviews);
        setMarkerReviews([]);
      }
    } catch (error) {
      console.error("Ошибка при обновлении отзывов:", error);
      setMarkerReviews([]);
    }
  };

  const handleCancelEditReview = () => {
    setShowEditReviewForm(false);
    setEditingReviewId(null);
    setEditingReviewText("");
    setEditingReviewRating(0);
  };

  const deletePhoto = async (geotagId: string, photoId: string): Promise<void> => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        title: "Ошибка",
        description: "Требуется авторизация",
        variant: "destructive",
      });
      throw new Error("Требуется авторизация");
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/photos/${photoId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Не удалось удалить фото");
      }

      toast({
        title: "Успешно",
        description: "Фото удалено",
      });

      // Обновляем список фотографий
      const updatedPhotos = await fetchPhotos(geotagId);
      setMarkerPhotos(updatedPhotos);
    } catch (error) {
      console.error("Ошибка при удалении фото:", error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось удалить фото",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleCopyCoordinates = () => {
    if (selectedMarker) {
      const coordinates = `${selectedMarker.latitude}, ${selectedMarker.longitude}`;
      navigator.clipboard.writeText(coordinates).then(() => {
        toast({
          title: "Скопировано",
          description: "Координаты скопированы в буфер обмена",
        });
      }).catch(() => {
        toast({
          title: "Ошибка",
          description: "Не удалось скопировать координаты",
          variant: "destructive",
        });
      });
    }
  };

  return (
      <>
      {!isAuthenticated && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <Alert>
            <AlertTitle>Ограниченный режим просмотра</AlertTitle>
            <AlertDescription>
              <Link href="/login" className="underline">
                Войдите
              </Link>{" "}
              или{" "}
              <Link href="/register" className="underline">
                зарегистрируйтесь
              </Link>
              , чтобы добавлять геометки, фотографии и отзывы
            </AlertDescription>
          </Alert>
        </div>
      )}

        {apiError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Ошибка</AlertTitle>
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
        )}

        <div id="map" className="h-[calc(100vh-120px)] relative z-0"></div>

        {/* Основной диалог с информацией о геометке */}
        <Dialog open={!!selectedMarker} onOpenChange={(open) => !open && setSelectedMarker(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden" style={{ zIndex: 1000 }}>
            <DialogHeader className="space-y-2 w-full">
              <DialogTitle className="space-y-2 w-full">
                <div className="flex flex-col space-y-2 w-full">
                  <h2 className="text-xl font-semibold break-all hyphens-auto w-full">{selectedMarker?.title || "Без названия"}</h2>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      Автор: <UserLink username={selectedMarker?.owner?.username || ""} name={selectedMarker?.owner?.name} />
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-muted-foreground mb-1">Скопировать координаты</span>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleCopyCoordinates}
                        className="flex items-center gap-2"
                      >
                        <span className="text-xs text-muted-foreground">
                          {selectedMarker?.latitude.toFixed(6)}, {selectedMarker?.longitude.toFixed(6)}
                        </span>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">Подробная информация о геометке</DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="photos" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="photos" className="text-muted-foreground">Фотографии ({markerPhotos.length})</TabsTrigger>
                <TabsTrigger value="reviews" className="text-muted-foreground">Отзывы ({markerReviews.length})</TabsTrigger>
              </TabsList>

            <TabsContent value="photos" className="space-y-6 overflow-y-auto max-h-[calc(70vh-4rem)]">
                {selectedMarker?.description && (
                  <div className="bg-muted/50 rounded-lg p-4 w-full">
                    <p className="text-muted-foreground break-all hyphens-auto w-full">{selectedMarker.description}</p>
                  </div>
                )}

              <div className="flex justify-between items-center sticky top-0 bg-white z-10 py-2">
                  <h3 className="text-lg font-medium">Фотографии</h3>
                  <Button onClick={handleAddPhoto}>Добавить фото</Button>
                </div>

                {markerPhotos.length > 0 ? (
                <div className="grid grid-cols-1 gap-6">
                  {markerPhotos.map((photo, index) => (
                    <Card key={`${photo.id}-${index}`} className="overflow-hidden">
                      <div className="relative w-full aspect-square bg-white">
                        {imageLoading[photo.id] && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <AuthImage
                            url={getImageUrl(photo)}
                                  alt="Фото геометки"
                            className="max-h-full max-w-full object-contain"
                            onLoad={() => setImageLoading(prev => ({...prev, [photo.id]: false}))}
                            onError={() => {
                              console.error('Error loading image:', photo.url);
                              setImageLoading(prev => ({...prev, [photo.id]: false}));
                            }}
                              />
                            </div>
                      </div>
                      <CardContent className="p-4">
                              <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">
                            <UserLink username={photo?.user?.username || ""} name={photo?.user?.name} /> • {new Date(photo.createdAt).toLocaleString('ru-RU', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
        </span>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleComments(photo.id)}
                            >
                              Комментарии ({photo.comments?.length || 0})
                            </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleAddComment(photo)}
                                >
                              +
                                </Button>
                            {currentUser?.username === photo.user?.username && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (selectedMarker) {
                                    deletePhoto(selectedMarker.id, photo.id);
                                  }
                                }}
                                className="text-red-500 hover:text-red-700"
                              >
                                ✕
                              </Button>
                            )}
                          </div>
                              </div>

                        {expandedComments.has(photo.id) && photo.comments && photo.comments.length > 0 && (
                          <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
                            {photo.comments.map(comment => {
                              console.log("Rendering comment:", comment);
                              console.log("Current user:", currentUser);
                              console.log("Comment user:", comment.user);
                              console.log("Can edit:", currentUser?.username === comment.user?.username);
                              
                              return (
                                <div key={comment.id} className="text-sm p-3 bg-gray-50 rounded">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                          <div className="font-medium">
                                        <UserLink username={comment?.user?.username || ""} name={comment?.user?.name} />
                                          </div>
                                      {editingCommentId === comment.id ? (
                                        <div className="mt-2 relative z-[1005]">
                                          <Textarea
                                            value={editingCommentText}
                                            onChange={(e) => setEditingCommentText(e.target.value)}
                                            className="min-h-[60px] text-sm"
                                          />
                                          <div className="flex justify-end gap-2 mt-2">
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => {
                                                setEditingCommentId(null);
                                                setEditingCommentText("");
                                              }}
                                            >
                                              Отмена
                                            </Button>
                                            <Button
                                              size="sm"
                                              onClick={() => handleSaveComment(selectedMarker!.id, comment.id)}
                                            >
                                              Сохранить
                                            </Button>
                                          </div>
                                        </div>
                                      ) : (
                                          <p>{comment.text}</p>
                                      )}
                                      <div className="text-xs text-gray-500 mt-1">
                                        {new Date(comment.createdAt).toLocaleString('ru-RU', {
                                          day: '2-digit',
                                          month: '2-digit',
                                          year: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                          </div>
                                        </div>
                                    {currentUser?.username === comment.user?.username && !editingCommentId && (
                                      <div className="flex gap-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleEditComment(comment.id, comment.text)}
                                          className="h-8 w-8 p-0"
                                        >
                                          ✎
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => deleteComment(selectedMarker!.id, comment.id)}
                                          className="h-8 w-8 p-0"
                                        >
                                          ✕
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                                  </div>
                              )}
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

          <TabsContent value="reviews" className="space-y-4 overflow-y-auto max-h-[calc(70vh-4rem)]">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">Отзывы</h3>
                    {markerReviews.length > 0 && (
                        <div className="flex items-center space-x-2">
                          <StarRating
                              value={calculateAverageRating(markerReviews)}
                              readOnly
                              size="sm"
                          />
                          <span className="text-sm text-gray-600">
                        {calculateAverageRating(markerReviews).toFixed(1)} из 5 ({markerReviews.length})
                      </span>
                        </div>
                    )}
                  </div>
                  <Button onClick={handleAddReview}>Добавить отзыв</Button>
                </div>

                {markerReviews.length > 0 ? (
                    <div className="space-y-4">
                {markerReviews.filter(review => review && review.id).map((review) => (
                          <Card key={review.id}>
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div>
                          <p className="font-medium">
                            <UserLink username={review.user?.username || ""} name={review.user?.name} />
                          </p>
                          <StarRating value={review.mark || 0} readOnly size="sm" />
                          <p className="mt-2">{review.text}</p>
                          <span className="text-xs text-gray-500 block mt-2">
                            {new Date(review.createdAt).toLocaleString('ru-RU', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                              </div>
                        {currentUser?.username === review.user?.username && (
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (review.id) {
                                  handleEditReview(review);
                                }
                              }}
                              className="h-8 w-8 p-0"
                            >
                              ✎
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (selectedMarker && review.id) {
                                  deleteReview(selectedMarker.id, review.id);
                                }
                              }}
                              className="h-8 w-8 p-0"
                            >
                              ✕
                            </Button>
                          </div>
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
          </DialogContent>
        </Dialog>

        <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
          <DialogContent style={{ zIndex: 1001 }}>
            <DialogHeader>
              <DialogTitle>Добавить отзыв</DialogTitle>
              <DialogDescription>Оцените это место</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div className="space-y-2">
                <Label>Рейтинг *</Label>
                <StarRating
                    value={reviewRating}
                    onChange={setReviewRating}
                    size="lg"
                />
              </div>
              <div className="space-y-2">
                <Label>Отзыв</Label>
                <Textarea
                    placeholder="Ваш отзыв..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    className="min-h-[100px]"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowReviewForm(false)}
                >
                  Отмена
                </Button>
                <Button
                    type="submit"
                    disabled={isLoading || reviewRating === 0}
                >
                  {isLoading ? "Отправка..." : "Отправить"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={showPhotoForm} onOpenChange={setShowPhotoForm}>
          <DialogContent className="max-w-[90vw]" style={{ zIndex: 1002 }}>
            <DialogHeader>
              <DialogTitle>Добавить фотографии</DialogTitle>
              <DialogDescription>
                Выберите фотографии для геометки "{selectedMarker?.title}"
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
                <Input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoChange}
                    className="hidden"
                />

                <Label htmlFor="photo-upload" className="cursor-pointer">
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">
                      Нажмите для выбора или перетащите файлы
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Можно выбрать несколько фото
                    </p>
                  </div>
                </Label>

                {/* Превью выбранных фото */}
                {photoPreviews.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {photoPreviews.map((preview, index) => (
                      <div key={index} className="relative aspect-square bg-white">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <img
                                src={preview}
                                alt={`Preview ${index}`}
                            className="max-h-full max-w-full object-contain rounded-md"
                            />
                        </div>
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-1 right-1 h-6 w-6 p-0"
                                onClick={() => handleRemovePhoto(index)}
                            >
                              ×
                            </Button>
                          </div>
                      ))}
                    </div>
                )}
              </div>

              <DialogFooter>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPhotoForm(false)}
                >
                  Отмена
                </Button>
                <Button
                    type="button"
                    onClick={() => {
                      if (photoFiles.length > 0) {
                        handleSubmitPhoto(photoFiles);
                      }
                    }}
                    disabled={photoFiles.length === 0}
                >
                  Загрузить ({photoFiles.length})
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        <Dialog open={showCommentForm} onOpenChange={setShowCommentForm}>
          <DialogContent style={{ zIndex: 1003 }}>
            <DialogHeader>
              <DialogTitle>Добавить комментарий</DialogTitle>
            </DialogHeader>
            {selectedPhoto && (
                <div className="mb-4">
            <div className="relative w-full aspect-square rounded-md overflow-hidden bg-white">
              <div className="absolute inset-0 flex items-center justify-center">
                <AuthImage
                  url={getImageUrl(selectedPhoto)}
                        alt="Фото"
                  className="max-h-full max-w-full object-contain"
                  onLoad={() => handleImageLoad(selectedPhoto.id)}
                  onError={() => {
                    console.error('Error loading image:', selectedPhoto.url);
                    handleImageLoad(selectedPhoto.id);
                  }}
                />
              </div>
                  </div>
                </div>
            )}
            <form onSubmit={handleSubmitComment} className="space-y-4">
              <div className="space-y-2">
            <Label htmlFor="comment">Комментарий</Label>
                <Textarea
              id="comment"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
              placeholder="Введите ваш комментарий"
              className="min-h-[100px]"
                />
              </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowCommentForm(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={!commentText.trim() || isLoading}>
              {isLoading ? "Отправка..." : "Отправить"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    {/* Диалог редактирования отзыва */}
    <Dialog 
      open={showEditReviewForm} 
      onOpenChange={(open) => {
        if (!open) {
          handleCancelEditReview();
        }
      }}
    >
      <DialogContent className="sm:max-w-[500px]" style={{ zIndex: 1004 }}>
        <DialogHeader>
          <DialogTitle>Редактировать отзыв</DialogTitle>
          <DialogDescription>
            Измените свой отзыв о месте
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Рейтинг *</Label>
            <StarRating
              value={editingReviewRating}
              onChange={setEditingReviewRating}
              size="lg"
            />
          </div>
          <div className="space-y-2">
            <Label>Отзыв</Label>
            <Textarea
              value={editingReviewText}
              onChange={(e) => setEditingReviewText(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>
        <DialogFooter>
                <Button
                    variant="outline"
            onClick={handleCancelEditReview}
                >
                  Отмена
                </Button>
                <Button
            onClick={() => {
              if (selectedMarker && editingReviewId) {
                handleSaveReview(selectedMarker.id, editingReviewId);
              }
            }}
            disabled={!editingReviewId || editingReviewRating === 0}
          >
            Сохранить
                </Button>
        </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
  )
}