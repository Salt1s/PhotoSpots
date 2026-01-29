import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Edit, LogOut } from "lucide-react"

interface ProfileHeaderProps {
  name: string
  username: string
  email: string
  onEdit: () => void
  onLogout: () => void
}

export function ProfileHeader({ name, username, email, onEdit, onLogout }: ProfileHeaderProps) {
  return (
    <div className="w-full space-y-4 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Avatar className="w-16 h-16">
          <AvatarImage src="" />
          <AvatarFallback>{name[0]}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold truncate">{name}</h2>
          <div className="text-gray-500 truncate">@{username}</div>
          <div className="text-gray-500 truncate">{email}</div>
        </div>

        <div className="flex flex-row sm:flex-row gap-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            className="flex-1 sm:flex-none"
            onClick={onEdit}
          >
            <Edit className="w-4 h-4 mr-2" />
            Редактировать
          </Button>
          <Button 
            variant="destructive"
            className="flex-1 sm:flex-none"
            onClick={onLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Выйти
          </Button>
        </div>
      </div>
    </div>
  )
} 