'use client'

import { Bell, User, Sun, Moon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTheme } from '@/providers/ThemeProvider'

interface HeaderProps {
  title: string
}

export function Header({ title }: HeaderProps) {
  const user = getUser()
  const router = useRouter()
  const { theme, toggle } = useTheme()
  const initials = user ? `${user.prenom[0]}${user.nom[0]}`.toUpperCase() : 'U'

  return (
    <header className="h-16 bg-white dark:bg-[#0C1F38] shadow-sm dark:shadow-none border-b border-transparent dark:border-[#1C3F62]/30 flex items-center justify-between px-6 z-10 relative transition-colors duration-300">
      <h1 className="text-xl font-semibold text-[#2D3748] dark:text-[#EDF8FF]">{title}</h1>
      <div className="flex items-center gap-2">

        {/* Theme toggle */}
        <button
          onClick={toggle}
          title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
          className="relative p-2 rounded-xl hover:bg-[#F5F9FA] dark:hover:bg-[#1C3F62]/50 text-[#2D3748] dark:text-[#70B1C4] transition-all duration-200 btn-neon"
        >
          {theme === 'dark'
            ? <Sun size={18} />
            : <Moon size={18} />}
        </button>

        <button className="relative p-2 rounded-xl hover:bg-[#F5F9FA] dark:hover:bg-[#1C3F62]/50 text-[#2D3748] dark:text-[#B4D0E0] transition-colors duration-200">
          <Bell size={20} />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-[#F5F9FA] dark:hover:bg-[#1C3F62]/50 cursor-pointer border-0 bg-transparent outline-none transition-colors duration-200">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-[#70B1C4] text-white text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-[#2D3748] dark:text-[#EDF8FF]">
                {user ? `Dr. ${user.prenom} ${user.nom}` : 'Utilisateur'}
              </p>
              <p className="text-xs text-gray-400 dark:text-[#7AAABB] capitalize">{user?.role}</p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push('/profil')}>
              <User size={16} className="mr-2" /> Mon profil
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
