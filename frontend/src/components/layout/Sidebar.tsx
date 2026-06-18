'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Calendar, ClipboardList, Users,
  LogOut, Eye, Menu, X, UserCircle,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { removeToken, getUser } from '@/lib/auth'

const navItems = [
  { href: '/dashboard',   label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/calendrier',  label: 'Calendrier',       icon: Calendar },
  { href: '/rendez-vous', label: 'Rendez-vous',      icon: ClipboardList },
  { href: '/patients',    label: 'Patients',         icon: Users },
]

export function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const [open, setOpen] = useState(false)
  const user = getUser()

  function handleLogout() {
    removeToken()
    router.push('/login')
  }

  const initials = user ? `${user.prenom[0]}${user.nom[0]}`.toUpperCase() : 'VC'

  return (
    <>
      <button
        className="fixed top-4 left-4 z-50 md:hidden bg-white rounded-xl p-2 shadow-md"
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 flex flex-col bg-white shadow-xl transition-transform duration-200',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#70B1C4] to-[#3d8fa8] flex items-center justify-center shadow-md shadow-[#70B1C4]/30">
            <Eye size={19} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-[#1A2B3C] text-[15px] tracking-tight">VisionCare</p>
            <p className="text-[11px] text-[#70B1C4] font-medium">Cabinet d&apos;Ophtalmologie</p>
          </div>
        </div>

        <div className="mx-5 h-px bg-gray-100" />

        {/* Nav */}
        <nav className="flex-1 px-4 pt-5 pb-2 space-y-1">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em] px-2 mb-3">Navigation</p>

          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                  active
                    ? 'bg-[#70B1C4] text-white shadow-md shadow-[#70B1C4]/25'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-[#1A2B3C]'
                )}
              >
                <Icon size={17} className={active ? 'text-white' : 'text-gray-400'} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* User section */}
        <div className="px-4 pb-5 space-y-2">
          <div className="mx-1 h-px bg-gray-100 mb-3" />

          <Link
            href="/profil"
            onClick={() => setOpen(false)}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
              pathname === '/profil'
                ? 'bg-[#70B1C4] text-white shadow-md shadow-[#70B1C4]/25'
                : 'text-gray-500 hover:bg-gray-50 hover:text-[#1A2B3C]'
            )}
          >
            <UserCircle size={17} className={pathname === '/profil' ? 'text-white' : 'text-gray-400'} />
            Mon profil
          </Link>

          <div className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#70B1C4] to-[#3d8fa8] flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#1A2B3C] truncate">
                Dr. {user?.prenom} {user?.nom}
              </p>
              <p className="text-[10px] text-gray-400 capitalize">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Déconnexion"
              className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors shrink-0"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-30 bg-black/30 md:hidden" onClick={() => setOpen(false)} />
      )}
    </>
  )
}
