'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Calendar, ClipboardList, Users,
  Settings, LogOut, Eye, Menu, X,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { removeToken } from '@/lib/auth'

const navItems = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/calendrier', label: 'Calendrier', icon: Calendar },
  { href: '/rendez-vous', label: 'Rendez-vous', icon: ClipboardList },
  { href: '/patients', label: 'Patients', icon: Users },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  function handleLogout() {
    removeToken()
    router.push('/login')
  }

  return (
    <>
      <button
        className="fixed top-4 left-4 z-50 md:hidden bg-white rounded-md p-2 shadow"
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 flex flex-col bg-white border-r border-[#DCEEF3] transition-transform duration-200',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="flex items-center gap-3 px-6 py-5 border-b border-[#DCEEF3]">
          <div className="w-9 h-9 rounded-lg bg-[#70B1C4] flex items-center justify-center">
            <Eye size={20} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-[#2D3748] text-sm">VisionCare</p>
            <p className="text-xs text-[#70B1C4]">Cabinet d&apos;Ophtalmologie</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                pathname === href || pathname.startsWith(href + '/')
                  ? 'bg-[#DCEEF3] text-[#70B1C4]'
                  : 'text-[#2D3748] hover:bg-[#F5F9FA]'
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-[#DCEEF3] space-y-1">
          <Link
            href="/parametres"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#2D3748] hover:bg-[#F5F9FA] transition-colors"
          >
            <Settings size={18} />
            Paramètres
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut size={18} />
            Déconnexion
          </button>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-30 bg-black/30 md:hidden" onClick={() => setOpen(false)} />
      )}
    </>
  )
}
