"use client"

import { useSearchParams } from "next/navigation"
import type React from "react"
import { Suspense, useEffect, useState, useCallback } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import imageCompression from 'browser-image-compression';

// Dynamically import the map component to avoid SSR issues with Leaflet
const MapComponent = dynamic(() => import("@/components/map-component"), {
  ssr: false,
  loading: () => (
    <div className="h-[calc(100vh-128px)] flex items-center justify-center bg-gray-100">Loading map...</div>
  ),
})

function MapPageContent() {
  const { toast } = useToast()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState<{ lat: number; lng: number } | null>(null)
  const [showMarkerForm, setShowMarkerForm] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  })
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [shouldRefreshMap, setShouldRefreshMap] = useState(false)
  const [initialMarker, setInitialMarker] = useState<{ id: string; lat: number; lng: number } | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    const lat = searchParams.get("lat")
    const lng = searchParams.get("lng")
    const markerId = searchParams.get("marker")

    if (lat && lng) {
      setSelectedPosition({
        lat: parseFloat(lat),
        lng: parseFloat(lng)
      })
    }

    if (markerId && lat && lng) {
      setInitialMarker({
        id: markerId,
        lat: parseFloat(lat),
        lng: parseFloat(lng)
      })
    }

    // Проверяем авторизацию
    const token = localStorage.getItem("token")
    setIsAuthenticated(!!token)
  }, [searchParams])

  // Обработчик клика по карте
  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      if (isAuthenticated) {
        console.log("Map clicked at:", lat, lng)
        setSelectedPosition({ lat, lng })
        setShowMarkerForm(true)
        console.log("showMarkerForm set to true")
      } else {
        toast({
          title: "Требуется авторизация",
          description: "Для добавления геометок необходимо войти в систему",
          variant: "destructive",
        })
      }
    },
    [isAuthenticated, toast],
  )


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    let newValue = value;

    // Ограничиваем длину в зависимости от поля
    if (name === 'title' && value.length > 50) {
      newValue = value.slice(0, 50);
    } else if (name === 'description' && value.length > 200) {
      newValue = value.slice(0, 200);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }))
  }

  const compressImage = async (file: File) => {
    // Начальные параметры сжатия
    let options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    };

    try {
      let compressedFile = await imageCompression(file, options);
      
      // Если файл всё ещё слишком большой, пробуем сжать сильнее
      if (compressedFile.size > 1024 * 1024) { // Больше 1MB
        options = {
          ...options,
          maxSizeMB: 0.5, // Уменьшаем до 500KB
          maxWidthOrHeight: 1280, // Уменьшаем максимальный размер
        };
        compressedFile = await imageCompression(file, options);
      }

      // Если всё ещё большой, пробуем максимальное сжатие
      if (compressedFile.size > 512 * 1024) { // Больше 500KB
        options = {
          ...options,
          maxSizeMB: 0.3, // Уменьшаем до 300KB
          maxWidthOrHeight: 1024,
        };
        compressedFile = await imageCompression(file, options);
      }

      return compressedFile;
    } catch (error) {
      console.error('Ошибка при сжатии изображения:', error);
      toast({
        title: "Ошибка",
        description: `Не удалось сжать изображение ${file.name}`,
        variant: "destructive",
      });
      return file;
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const maxSize = 5 * 1024 * 1024; // 5MB
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      const maxTotalFiles = 10; // максимальное количество файлов
      
      if (photoFiles.length + e.target.files.length > maxTotalFiles) {
        toast({
          title: "Ошибка",
          description: `Можно загрузить не более ${maxTotalFiles} фотографий`,
          variant: "destructive",
        });
        return;
      }

      const newFiles = Array.from(e.target.files).filter(file => {
        if (!allowedTypes.includes(file.type)) {
          toast({
            title: "Ошибка",
            description: `Файл ${file.name} имеет неподдерживаемый формат`,
            variant: "destructive",
          });
          return false;
        }
        if (file.size > maxSize) {
          toast({
            title: "Предупреждение",
            description: `Файл ${file.name} будет сжат для уменьшения размера`,
          });
        }
        return true;
      });

      // Сжимаем изображения
      const compressedFiles = await Promise.all(
        newFiles.map(async (file) => {
          if (file.size > maxSize) {
            return await compressImage(file);
          }
          return file;
        })
      );

      // Обновляем список файлов
      setPhotoFiles(prev => [...prev, ...compressedFiles]);

      // Создаем превью для новых файлов
      compressedFiles.forEach(file => {
        const reader = new FileReader();
      reader.onloadend = () => {
          setPhotoPreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotoFiles(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  }

  // Обновляем функцию создания геометки для использования FormData вместо JSON
  const handleCreateMarker = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast({
        title: "Ошибка",
        description: "Необходимо указать название геометки",
        variant: "destructive",
      });
      return;
    }

    if (photoFiles.length === 0) {
      toast({
        title: "Ошибка",
        description: "Необходимо добавить хотя бы одну фотографию",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {

      // Get token
      const token = localStorage.getItem("token");
      
      if (!token) {
        throw new Error("Требуется авторизация");
      }

      // Create FormData with the structure expected by the backend
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title || "Без названия");
      formDataToSend.append("description", formData.description || "");
      formDataToSend.append("latitude", String(selectedPosition?.lat ?? 0));
      formDataToSend.append("longitude", String(selectedPosition?.lng ?? 0));

      // Добавляем все файлы с одним именем параметра "files"
      photoFiles.forEach(file => {
        formDataToSend.append("files", file);
      });

      console.log("Sending marker data with files");
      console.log("Number of files:", photoFiles.length);

      // Send request to create marker
      const response = await fetch("http://localhost:8080/api/map", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error response:", errorText);
        throw new Error(`Не удалось создать геометку: ${response.status} ${response.statusText}`);
      }

      // Check if response contains data
      const responseText = await response.text();
      console.log("Create marker response:", responseText);

      if (!responseText || !responseText.trim()) {
        console.log("Empty response received");
        throw new Error("Получен пустой ответ от сервера");
      }

      // Parse JSON only if there is data
      let geotagData;
      try {
        geotagData = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Error parsing JSON:", parseError);
        console.log("Raw response:", responseText);
        throw new Error("Некорректный ответ от сервера");
      }

      toast({
        title: "Успешно",
        description: "Геометка успешно создана",
      });

      // Reset form
      setFormData({
        title: "",
        description: "",
      });
      setPhotoFiles([]);
      setPhotoPreviews([]);

      // Close form
      setShowMarkerForm(false);

      // Set flag to refresh map
      setShouldRefreshMap(true);
    } catch (error) {
      console.error("Ошибка при создании геометки:", error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Произошла ошибка при создании геометки",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseForm = () => {
    // Сбрасываем данные формы
    setFormData({
      title: "",
      description: "",
    })
    setPhotoFiles([])
    setPhotoPreviews([])

    // Закрываем форму, но сохраняем выбранную позицию
    setShowMarkerForm(false)
  }

  const handleMapRefreshed = () => {
    setShouldRefreshMap(false)
  }

  return (
    <div className="flex-1 h-[calc(100vh-128px)]">
      <MapComponent
        onMapClick={handleMapClick}
        selectedPosition={selectedPosition}
        shouldRefresh={shouldRefreshMap}
        onMapRefreshed={handleMapRefreshed}
        initialMarkerId={initialMarker?.id}
        isAuthenticated={isAuthenticated}
      />

      <Dialog open={showMarkerForm} onOpenChange={handleCloseForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить геометку</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Заполните информацию о новой геометке
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateMarker} className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="title" className="font-medium">Название *</Label>
                <span className="text-xs text-muted-foreground">
                  {formData.title.length}/50
                </span>
              </div>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                maxLength={50}
                required
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="description" className="font-medium">Описание</Label>
                <span className="text-xs text-muted-foreground">
                  {formData.description.length}/200
                </span>
              </div>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                maxLength={200}
                className="w-full min-h-[100px] resize-none"
                placeholder="Добавьте описание геометки..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="photos" className="font-medium">Фотографии *</Label>
              <Input
                id="photos"
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoChange}
                className="w-full"
              />
              {photoPreviews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                  {photoPreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleCloseForm}>
                Отмена
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Создание..." : "Создать"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function MapPage() {
  return (
    <Suspense fallback={<div className="h-[calc(100vh-128px)] flex items-center justify-center bg-gray-100">Loading...</div>}>
      <MapPageContent />
    </Suspense>
  )
}
