'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Calendar, ClipboardList, Users,
  LogOut, Eye, Menu, X, UserCircle, Receipt, Armchair, BarChart3, Scissors,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { removeToken, getUser } from '@/lib/auth'

const navItems = [
  { href: '/dashboard',     label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/calendrier',    label: 'Calendrier',       icon: Calendar },
  { href: '/rendez-vous',   label: 'Rendez-vous',      icon: ClipboardList },
  { href: '/salle-attente', label: "Salle d'attente",  icon: Armchair },
  { href: '/operations',    label: 'Opérations',       icon: Scissors },
  { href: '/patients',      label: 'Patients',         icon: Users },
  { href: '/facturation',   label: 'Facturation',      icon: Receipt },
  { href: '/rapports',      label: 'Rapports',         icon: BarChart3 },
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

  const navLink = (href: string, label: string, Icon: React.ElementType) => {
    const active = pathname === href || pathname.startsWith(href + '/')
    return (
      <Link
        key={href}
        href={href}
        onClick={() => setOpen(false)}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 mx-2',
          active
            ? 'bg-[#3d8fa8]/14 text-[#15324a] font-semibold dark:bg-white/[0.10] dark:text-white'
            : 'text-gray-500 hover:bg-black/[0.04] hover:text-gray-800 dark:text-white/40 dark:hover:bg-white/[0.06] dark:hover:text-white/70'
        )}
      >
        <Icon
          size={16}
          className={cn(
            'shrink-0 transition-colors duration-200',
            active ? 'text-[#3d8fa8]' : 'text-gray-400 dark:text-white/30'
          )}
        />
        {label}
      </Link>
    )
  }

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden bg-[#0A1628]/90 backdrop-blur-sm rounded-xl p-2 border border-white/10"
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={20} className="text-white" /> : <Menu size={20} className="text-white" />}
      </button>

      {/* Outer shell — keeps layout footprint = w-64 */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 p-3',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          'transition-transform duration-300'
        )}
      >
        {/* Inner glassmorphism card */}
        <div className="relative h-full flex flex-col rounded-[20px] overflow-hidden
          bg-white/70 dark:bg-[#0A1A2E]/40
          backdrop-blur-2xl
          border border-white/70 dark:border-white/[0.10]
          shadow-[0_8px_30px_rgba(80,150,175,0.18)]
          dark:[box-shadow:0_0_0_1px_rgba(112,177,196,0.10),_0_10px_45px_rgba(0,0,0,0.55),_inset_0_1px_0_rgba(255,255,255,0.10)]">

          {/* Subtle cyan glow at top-left — dark mode only, kept very faint for readability */}
          <div className="pointer-events-none absolute -top-16 -left-16 w-44 h-44 rounded-full hidden dark:block
            bg-[radial-gradient(circle,_rgba(94,197,221,0.16)_0%,_rgba(94,197,221,0.05)_45%,_transparent_72%)] blur-2xl" />

          {/* Diagonal glossy light streak — dark mode only */}
          <div className="pointer-events-none absolute inset-0 hidden dark:block
            bg-[linear-gradient(125deg,_rgba(255,255,255,0.06)_0%,_rgba(255,255,255,0.02)_22%,_transparent_38%,_transparent_100%)]" />

          {/* Content sits above the gradient layers */}
          <div className="relative z-10 h-full flex flex-col">

          {/* ── Brand ── */}
          <div className="flex items-center gap-3 px-4 pt-5 pb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3d8fa8] to-[#1e5f7a] flex items-center justify-center shrink-0
              [box-shadow:0_0_16px_rgba(61,143,168,0.55)]">
              <Eye size={17} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-[#1A2B3C] dark:text-white text-sm tracking-tight">Ophtech</p>
              <p className="text-[10px] text-[#3d8fa8]/80 dark:text-[#70B1C4]/55 font-medium">Cabinet d&apos;Ophtalmologie</p>
            </div>
          </div>

          {/* Divider */}
          <div className="mx-4 h-px bg-black/[0.06] dark:bg-white/[0.07]" />

          {/* ── Nav ── */}
          <nav className="pt-4 pb-3 flex-1 overflow-y-auto">
            <p className="text-[11px] font-bold text-[#3d8fa8] dark:text-[#70B1C4]/80 uppercase tracking-[0.18em] px-5 mb-2">Navigation</p>
            <div className="space-y-0.5">
              {navItems.map(({ href, label, icon: Icon }) => navLink(href, label, Icon))}
            </div>
          </nav>

          {/* Divider */}
          <div className="mx-4 h-px bg-black/[0.06] dark:bg-white/[0.07]" />

          {/* ── Bottom ── */}
          <div className="pt-2 pb-3">
            <div className="space-y-0.5">
              {navLink('/profil', 'Mon profil', UserCircle)}
            </div>

            {/* User card */}
            <div className="mx-2 mt-2 flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-black/[0.04] border border-black/[0.06] dark:bg-white/[0.05] dark:border-white/[0.08]">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3d8fa8] to-[#1e5f7a] flex items-center justify-center text-white text-xs font-bold shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#1A2B3C] dark:text-white/72 truncate">Dr. {user?.prenom} {user?.nom}</p>
                <p className="text-[10px] text-gray-400 dark:text-white/28 capitalize">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                title="Déconnexion"
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:text-white/20 dark:hover:text-red-400 dark:hover:bg-red-900/25 transition-colors shrink-0"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
          </div>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setOpen(false)} />
      )}
    </>
  )
}
