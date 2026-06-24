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
      {/* Mobile toggle */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden bg-[#050D1A]/90 backdrop-blur-sm rounded-xl p-2 shadow-md border border-[#1C3F62]/30 transition-colors duration-300"
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={20} className="text-[#EDF8FF]" /> : <Menu size={20} className="text-[#EDF8FF]" />}
      </button>

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 flex flex-col',
          'bg-[#050D1A] backdrop-blur-xl',
          'border-r border-[#1C3F62]/25',
          'shadow-[1px_0_0_rgba(112,177,196,0.10),_6px_0_40px_rgba(0,0,0,0.60)]',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          'transition-all duration-300'
        )}
      >
        {/* ── Brand ── */}
        <div className="px-6 pt-6 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3d8fa8] to-[#1e6c87] flex items-center justify-center shadow-lg shadow-[#3d8fa8]/30">
              <Eye size={17} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-[14px] tracking-tight">VisionCare</p>
              <p className="text-[10px] text-[#70B1C4]/70 font-medium">Cabinet d&apos;Ophtalmologie</p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-6 h-px bg-white/[0.06]" />

        {/* ── Nav ── */}
        <nav className="px-3 pt-6 pb-4 flex-1 space-y-0.5">
          <p className="text-[10px] font-bold text-white/25 uppercase tracking-[0.15em] px-3 mb-4">Navigation</p>

          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative',
                  active
                    ? 'bg-white/[0.08] text-white'
                    : 'text-white/45 hover:bg-white/[0.05] hover:text-white/80'
                )}
              >
                {/* Active left accent bar */}
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-[#70B1C4] shadow-[0_0_8px_rgba(112,177,196,0.8)]" />
                )}
                <Icon
                  size={17}
                  className={cn(
                    'shrink-0 transition-colors duration-150',
                    active ? 'text-[#70B1C4]' : 'text-white/35 group-hover:text-white/60'
                  )}
                />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* ── Eye widget ── */}
        <div className="px-3 pb-4">
          <div className="rounded-2xl bg-white/[0.04] border border-white/[0.07] p-4 flex flex-col items-center gap-3">
            <svg viewBox="0 0 100 60" className="w-24 h-auto opacity-70" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 30 Q30 6 50 6 Q70 6 90 30 Q70 54 50 54 Q30 54 10 30Z"
                stroke="#70B1C4" strokeWidth="1.5" strokeLinejoin="round" fill="#70B1C4" fillOpacity="0.04" />
              <circle cx="50" cy="30" r="16" stroke="#70B1C4" strokeWidth="1.2" fill="#70B1C4" fillOpacity="0.06" />
              <circle cx="50" cy="30" r="10" stroke="#70B1C4" strokeWidth="1"  fill="#70B1C4" fillOpacity="0.10" />
              <circle cx="50" cy="30" r="5.5" fill="#3d8fa8" fillOpacity="0.60" />
              <circle cx="46" cy="26" r="2"   fill="white"   fillOpacity="0.70" />
              <circle cx="53" cy="28" r="1"   fill="white"   fillOpacity="0.40" />
            </svg>
            <p className="text-center text-[11px] text-white/40 font-medium leading-relaxed whitespace-pre-line">
              {tip}
            </p>
            <div className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-[#70B1C4]/30" />
              <span className="w-5 h-0.5 rounded-full bg-[#70B1C4]/20" />
              <span className="w-1 h-1 rounded-full bg-[#70B1C4]/30" />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-6 h-px bg-white/[0.06]" />

        {/* ── Bottom: profil link + user card ── */}
        <div className="px-3 py-4 space-y-0.5">
          <Link
            href="/profil"
            onClick={() => setOpen(false)}
            className={cn(
              'flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative',
              pathname === '/profil'
                ? 'bg-white/[0.08] text-white'
                : 'text-white/45 hover:bg-white/[0.05] hover:text-white/80'
            )}
          >
            {pathname === '/profil' && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-[#70B1C4] shadow-[0_0_8px_rgba(112,177,196,0.8)]" />
            )}
            <UserCircle
              size={17}
              className={cn(
                'shrink-0 transition-colors duration-150',
                pathname === '/profil' ? 'text-[#70B1C4]' : 'text-white/35 group-hover:text-white/60'
              )}
            />
            Mon profil
          </Link>

          {/* User card */}
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.07] mt-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3d8fa8] to-[#1e6c87] flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-md shadow-[#3d8fa8]/25">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white/80 truncate">Dr. {user?.prenom} {user?.nom}</p>
              <p className="text-[10px] text-white/30 capitalize">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Déconnexion"
              className="p-1.5 rounded-lg text-white/25 hover:text-red-400 hover:bg-red-900/20 transition-colors shrink-0"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden" onClick={() => setOpen(false)} />
      )}
    </>
  )
}
