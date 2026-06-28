'use client'

import { Bell, User, Sun, Moon, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getUser, removeToken } from '@/lib/auth'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
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

  function logout() {
    removeToken()
    router.push('/login')
  }

  return (
    <header className="
      mx-4 mt-3 mb-1 rounded-2xl h-14
      bg-white/95 dark:bg-[#0D1F35]/90
      backdrop-blur-xl
      border border-gray-200/70 dark:border-[#1C3F62]/40
      shadow-[0_2px_20px_rgba(80,150,175,0.14)]
      dark:shadow-[0_0_0_1px_rgba(112,177,196,0.24),_0_0_18px_rgba(61,143,168,0.18),_0_8px_32px_rgba(0,0,0,0.55)]
      flex items-center justify-between pl-16 pr-3 md:px-4 z-10 relative transition-all duration-300
    ">

      {/* ── Left: active page title pill ── */}
      <div className="flex items-center">
        <div className="
          flex items-center gap-2
          bg-gradient-to-r from-[#1e6c87] via-[#3d8fa8] to-[#70B1C4]
          text-white rounded-xl px-4 py-1.5
          shadow-md shadow-[#70B1C4]/25
          dark:shadow-[0_0_12px_rgba(61,143,168,0.40),_0_2px_8px_rgba(0,0,0,0.30)]
        ">
          <span className="text-sm font-bold tracking-wide">{title}</span>
        </div>
      </div>

      {/* ── Right: action pill ── */}
      <div className="
        flex items-center gap-0.5
        bg-gray-50/90 dark:bg-[#06101E]/60
        rounded-xl px-1.5 py-1
        border border-gray-100 dark:border-[#1C3F62]/30
        backdrop-blur-sm
      ">

        {/* Theme toggle */}
        <button
          onClick={toggle}
          title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
          className="p-2 rounded-lg text-gray-500 dark:text-[#70B1C4] hover:bg-white dark:hover:bg-[#1C3F62]/60 transition-all duration-200 btn-neon"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Bell */}
        <button className="p-2 rounded-lg text-gray-500 dark:text-[#B4D0E0] hover:bg-white dark:hover:bg-[#1C3F62]/60 transition-all duration-200 relative">
          <Bell size={16} />
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-gray-200 dark:bg-[#1C3F62]/50 mx-1" />

        {/* Avatar + name dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="
            flex items-center gap-2 pl-1 pr-2.5 py-1
            rounded-lg hover:bg-white dark:hover:bg-[#1C3F62]/60
            cursor-pointer bg-transparent outline-none transition-all duration-200
          ">
            <Avatar className="w-7 h-7 ring-2 ring-[#70B1C4]/30 shrink-0">
              <AvatarFallback className="bg-gradient-to-br from-[#3d8fa8] to-[#70B1C4] text-white text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-semibold text-[#2D3748] dark:text-[#EDF8FF] leading-tight whitespace-nowrap">
                {user ? `Dr. ${user.prenom} ${user.nom}` : 'Utilisateur'}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-[#7AAABB] capitalize">{user?.role}</p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push('/profil')}>
              <User size={16} className="mr-2" /> Mon profil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
            >
              <LogOut size={16} className="mr-2" /> Se déconnecter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
