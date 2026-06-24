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
        className="fixed top-4 left-4 z-50 md:hidden bg-[#060F1E]/90 backdrop-blur-sm rounded-xl p-2 border border-white/10"
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={20} className="text-white" /> : <Menu size={20} className="text-white" />}
      </button>

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 flex flex-col',
          'bg-[#060F1E]',
          'border-r border-white/[0.07]',
          '[box-shadow:1px_0_0_rgba(112,177,196,0.08),_4px_0_32px_rgba(0,0,0,0.70)]',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          'transition-transform duration-300'
        )}
      >
        {/* ── Brand ── */}
        <div className="flex items-center gap-3 px-5 pt-6 pb-5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3d8fa8] to-[#1e5f7a] flex items-center justify-center [box-shadow:0_0_14px_rgba(61,143,168,0.50)]">
            <Eye size={17} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm tracking-tight">VisionCare</p>
            <p className="text-[10px] text-[#70B1C4]/60 font-medium">Cabinet d&apos;Ophtalmologie</p>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-5 h-px bg-white/[0.06] mb-1" />

        {/* ── Nav ── */}
        <nav className="pt-5 pb-4 flex-1">
          <p className="text-[10px] font-semibold text-white/20 uppercase tracking-[0.18em] px-5 mb-3">Navigation</p>

          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3.5 py-2.5 text-sm transition-all duration-150 border-l-[3px] pl-[17px] pr-5',
                  active
                    ? 'border-[#70B1C4] bg-[#70B1C4]/10 text-white font-semibold'
                    : 'border-transparent text-white/40 hover:bg-white/5 hover:text-white/70'
                )}
              >
                <Icon
                  size={16}
                  className={cn(
                    'shrink-0 transition-colors duration-150',
                    active ? 'text-[#70B1C4]' : 'text-white/30'
                  )}
                />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* ── Eye widget ── */}
        <div className="px-4 pb-4">
          <div className="rounded-2xl bg-white/[0.04] border border-white/[0.07] p-4 flex flex-col items-center gap-3">
            <svg viewBox="0 0 100 60" className="w-24 h-auto opacity-60" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 30 Q30 6 50 6 Q70 6 90 30 Q70 54 50 54 Q30 54 10 30Z"
                stroke="#70B1C4" strokeWidth="1.5" strokeLinejoin="round" fill="#70B1C4" fillOpacity="0.04" />
              <circle cx="50" cy="30" r="16" stroke="#70B1C4" strokeWidth="1.2" fill="#70B1C4" fillOpacity="0.06" />
              <circle cx="50" cy="30" r="10" stroke="#70B1C4" strokeWidth="1"  fill="#70B1C4" fillOpacity="0.10" />
              <circle cx="50" cy="30" r="5.5" fill="#3d8fa8" fillOpacity="0.60" />
              <circle cx="46" cy="26" r="2"   fill="white"   fillOpacity="0.70" />
              <circle cx="53" cy="28" r="1"   fill="white"   fillOpacity="0.40" />
            </svg>
            <p className="text-center text-[11px] text-white/35 font-medium leading-relaxed whitespace-pre-line">
              {tip}
            </p>
            <div className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-[#70B1C4]/25" />
              <span className="w-5 h-0.5 rounded-full bg-[#70B1C4]/18" />
              <span className="w-1 h-1 rounded-full bg-[#70B1C4]/25" />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-5 h-px bg-white/[0.06]" />

        {/* ── Bottom: profil link + user card ── */}
        <div className="py-3">
          <Link
            href="/profil"
            onClick={() => setOpen(false)}
            className={cn(
              'flex items-center gap-3.5 py-2.5 text-sm transition-all duration-150 border-l-[3px] pl-[17px] pr-5',
              pathname === '/profil'
                ? 'border-[#70B1C4] bg-[#70B1C4]/10 text-white font-semibold'
                : 'border-transparent text-white/40 hover:bg-white/5 hover:text-white/70'
            )}
          >
            <UserCircle
              size={16}
              className={cn(
                'shrink-0',
                pathname === '/profil' ? 'text-[#70B1C4]' : 'text-white/30'
              )}
            />
            Mon profil
          </Link>

          {/* User card */}
          <div className="mx-4 mt-2 flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08]">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3d8fa8] to-[#1e5f7a] flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white/75 truncate">Dr. {user?.prenom} {user?.nom}</p>
              <p className="text-[10px] text-white/30 capitalize">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Déconnexion"
              className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-900/25 transition-colors shrink-0"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setOpen(false)} />
      )}
    </>
  )
}
