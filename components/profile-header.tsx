import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Edit, LogOut } from "lucide-react"

interface ProfileHeaderProps {
  name: string
  username: string
  email: string
  description?: string
  isOwnProfile?: boolean
  onEdit?: () => void
  onLogout?: () => void
}

export function ProfileHeader({ 
  name, 
  username, 
  email, 
  description, 
  isOwnProfile = false,
  onEdit, 
  onLogout 
}: ProfileHeaderProps) {
  return (
    <div className="w-full p-4 sm:p-6">
      <div className="flex flex-col gap-4">
        {/* Верхняя часть с аватаром и основной информацией */}
        <div className="flex gap-4 items-start">
          <Avatar className="w-16 h-16 shrink-0">
            <AvatarImage src="" />
            <AvatarFallback>{name[0]}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-bold truncate">{name}</h2>
              <div className="text-gray-500 truncate">@{username}</div>
              {isOwnProfile && (
                <div className="text-gray-500 truncate">{email}</div>
              )}
            </div>
          </div>

          {/* Кнопки действий только для собственного профиля */}
          {isOwnProfile && (
            <div className="hidden sm:flex gap-2">
              <Button 
                variant="outline" 
                onClick={onEdit}
              >
                <Edit className="w-4 h-4 mr-2" />
                Редактировать
              </Button>
              <Button 
                variant="destructive"
                onClick={onLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Выйти
              </Button>
            </div>
          )}
        </div>

        {/* Описание профиля */}
        {description && (
          <div className="w-full text-gray-600 break-words whitespace-pre-wrap">
            {description}
          </div>
        )}

        {/* Кнопки действий на мобильных устройствах */}
        {isOwnProfile && (
          <div className="flex sm:hidden flex-row gap-2 w-full">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={onEdit}
            >
              <Edit className="w-4 h-4 mr-2" />
              Редактировать
            </Button>
            <Button 
              variant="destructive"
              className="flex-1"
              onClick={onLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Выйти
            </Button>
          </div>
        )}
      </div>
    </div>
  )
} 