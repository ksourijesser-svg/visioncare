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

const TIPS = [
  'La vision est au cœur\nde notre mission.',
  'Chaque patient mérite\nune vision claire.',
  'La prévention est la\nmeilleure des thérapies.',
  'Votre expertise fait\nla différence.',
  'Un œil sain, une vie\npleinement épanouie.',
  'Excellence et bienveillance,\nchaque jour.',
  'Prenons soin ensemble\nde votre vue.',
]

export function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const [open, setOpen] = useState(false)
  const user = getUser()

  function handleLogout() {
    removeToken()
    router.push('/')
  }

  const initials = user ? `${user.prenom[0]}${user.nom[0]}`.toUpperCase() : 'VC'
  const tip = TIPS[new Date().getDay()]

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
          'fixed inset-y-0 left-0 z-40 w-64 flex flex-col bg-white glow-sidebar transition-transform duration-200',
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
        <nav className="px-4 pt-5 pb-4 space-y-1">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.1em] px-2 mb-3">Navigation</p>

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
                    ? 'bg-[#3d8fa8] text-white shadow-md shadow-[#3d8fa8]/30'
                    : 'text-gray-600 hover:bg-[#E4EEF4] hover:text-[#1A2B3C]'
                )}
              >
                <Icon size={17} className={active ? 'text-white' : 'text-gray-500'} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Decorative illustration + tip — fills remaining space, keeps user section pinned to bottom */}
        <div className="flex-1 px-4 pb-4 flex flex-col justify-end">
          <div className="rounded-2xl bg-gradient-to-br from-[#E8F4F8] to-[#F5FAFB] p-4 flex flex-col items-center gap-3 border border-[#DCEEF3]/60">
            {/* Eye SVG illustration */}
            <svg viewBox="0 0 100 60" className="w-28 h-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Decorative background dots */}
              <circle cx="8"  cy="10" r="2" fill="#70B1C4" fillOpacity="0.15" />
              <circle cx="92" cy="10" r="2" fill="#70B1C4" fillOpacity="0.15" />
              <circle cx="8"  cy="50" r="2" fill="#70B1C4" fillOpacity="0.15" />
              <circle cx="92" cy="50" r="2" fill="#70B1C4" fillOpacity="0.15" />
              <circle cx="16" cy="30" r="1.5" fill="#70B1C4" fillOpacity="0.12" />
              <circle cx="84" cy="30" r="1.5" fill="#70B1C4" fillOpacity="0.12" />
              {/* Outer eye shape */}
              <path
                d="M10 30 Q30 6 50 6 Q70 6 90 30 Q70 54 50 54 Q30 54 10 30Z"
                stroke="#70B1C4"
                strokeWidth="1.5"
                strokeLinejoin="round"
                fill="#70B1C4"
                fillOpacity="0.05"
              />
              {/* Iris outer ring */}
              <circle cx="50" cy="30" r="16" stroke="#70B1C4" strokeWidth="1.2" fill="#70B1C4" fillOpacity="0.08" />
              {/* Iris inner ring */}
              <circle cx="50" cy="30" r="10" stroke="#70B1C4" strokeWidth="1" fill="#70B1C4" fillOpacity="0.12" />
              {/* Pupil */}
              <circle cx="50" cy="30" r="5.5" fill="#3d8fa8" fillOpacity="0.55" />
              {/* Specular highlight */}
              <circle cx="46" cy="26" r="2" fill="white" fillOpacity="0.75" />
              <circle cx="53" cy="28" r="1" fill="white" fillOpacity="0.45" />
              {/* Lashes — subtle lines at corners */}
              <line x1="12" y1="27" x2="8"  y2="24" stroke="#70B1C4" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.35" />
              <line x1="12" y1="30" x2="7"  y2="30" stroke="#70B1C4" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.25" />
              <line x1="88" y1="27" x2="92" y2="24" stroke="#70B1C4" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.35" />
              <line x1="88" y1="30" x2="93" y2="30" stroke="#70B1C4" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.25" />
            </svg>

            {/* Tip text */}
            <p className="text-center text-[11px] text-[#3d8fa8] font-medium leading-relaxed whitespace-pre-line">
              {tip}
            </p>

            {/* Decorative dot divider */}
            <div className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-[#70B1C4] opacity-40" />
              <span className="w-5 h-0.5 rounded-full bg-[#70B1C4] opacity-25" />
              <span className="w-1 h-1 rounded-full bg-[#70B1C4] opacity-40" />
            </div>
          </div>
        </div>

        {/* User section */}
        <div className="px-4 pb-5 space-y-2">
          <div className="mx-1 h-px bg-gray-100 mb-3" />

          <Link
            href="/profil"
            onClick={() => setOpen(false)}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
              pathname === '/profil'
                ? 'bg-[#3d8fa8] text-white shadow-md shadow-[#3d8fa8]/30'
                : 'text-gray-600 hover:bg-[#E4EEF4] hover:text-[#1A2B3C]'
            )}
          >
            <UserCircle size={17} className={pathname === '/profil' ? 'text-white' : 'text-gray-500'} />
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
