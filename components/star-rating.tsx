"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarRatingProps {
  value: number
  readOnly?: boolean
  size?: 'sm' | 'md' | 'lg' // допустимые значения
  onChange?: (value: number) => void
}

export function StarRating({ value, onChange, readOnly = false, size = "md" }: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState(0)

  const stars = Array.from({ length: 5 }, (_, i) => i + 1)

  const handleClick = (rating: number) => {
    if (!readOnly && onChange) {
      onChange(rating)
    }
  }

  const handleMouseEnter = (rating: number) => {
    if (!readOnly) {
      setHoverValue(rating)
    }
  }

  const handleMouseLeave = () => {
    if (!readOnly) {
      setHoverValue(0)
    }
  }

  const getSizeClass = () => {
    switch (size) {
      case "sm":
        return "h-4 w-4"
      case "lg":
        return "h-8 w-8"
      default:
        return "h-6 w-6"
    }
  }

  return (
    <div className="flex">
      {stars.map((star) => (
        <Star
          key={star}
          className={cn(
            getSizeClass(),
            "cursor-pointer transition-colors",
            (hoverValue || value || 0) >= star ? "text-yellow-400 fill-yellow-400" : "text-gray-300",
            readOnly ? "cursor-default" : "cursor-pointer",
          )}
          onClick={() => handleClick(star)}
          onMouseEnter={() => handleMouseEnter(star)}
          onMouseLeave={handleMouseLeave}
        />
      ))}
    </div>
  )
}
