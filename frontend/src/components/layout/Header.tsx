'use client'

import { Bell, User } from 'lucide-react'
import { getUser } from '@/lib/auth'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface HeaderProps {
  title: string
}

export function Header({ title }: HeaderProps) {
  const user = getUser()
  const initials = user ? `${user.prenom[0]}${user.nom[0]}`.toUpperCase() : 'U'

  return (
    <header className="h-16 bg-white border-b border-[#DCEEF3] flex items-center justify-between px-6">
      <h1 className="text-xl font-semibold text-[#2D3748]">{title}</h1>
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg hover:bg-[#F5F9FA] text-[#2D3748]">
          <Bell size={20} />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[#F5F9FA] cursor-pointer">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-[#70B1C4] text-white text-xs">{initials}</AvatarFallback>
              </Avatar>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-[#2D3748]">
                  {user ? `Dr. ${user.prenom} ${user.nom}` : 'Utilisateur'}
                </p>
                <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <User size={16} className="mr-2" /> Mon profil
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
