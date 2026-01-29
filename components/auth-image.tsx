"use client"

import { useState, useEffect, memo } from "react"

const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%23f1f5f9'/%3E%3Cpath d='M20 15a5 5 0 110 10 5 5 0 010-10zm0 2a3 3 0 100 6 3 3 0 000-6zm0-7a10 10 0 110 20 10 10 0 010-20zm0 2a8 8 0 100 16 8 8 0 000-16z' fill='%23cbd5e1'/%3E%3C/svg%3E"

const getImageUrl = (url: string): string => {
  // Если это уже data URL или полный URL, возвращаем как есть
  if (url.startsWith('data:') || url.startsWith('http')) {
    return url;
  }
  
  // Если URL начинается с /uploads/photos/, извлекаем только имя файла
  if (url.startsWith('/uploads/photos/')) {
    const fileName = url.split('/').pop();
    if (fileName) {
      return `http://localhost:8080/api/photos/data/${fileName}`;
    }
  }
  
  // Для всех остальных случаев
  const fileName = url.split('/').pop();
  return fileName ? `http://localhost:8080/api/photos/data/${fileName}` : url;
};

interface AuthImageProps {
  url: string;
  alt: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

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

        const imageUrl = getImageUrl(url);
        const response = await fetch(imageUrl, {
          headers: token ? {
            Authorization: `Bearer ${token}`
          } : undefined
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
  }, [url, token, hasError, onLoad, onError]);

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
});

AuthImage.displayName = 'AuthImage';

export { AuthImage }; 