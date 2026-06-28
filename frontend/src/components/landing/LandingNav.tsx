'use client'

import { useState } from 'react'
import Link from 'next/link'

export function LandingNav() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="fixed top-4 left-0 right-0 z-50 px-4">
      <div className="max-w-6xl mx-auto relative">
        {/* soft two-color ambient glow behind the pill */}
        <div className="absolute -inset-x-8 -inset-y-5 -z-10 pointer-events-none">
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 w-72 h-28 rounded-full blur-[60px] opacity-60"
            style={{ background: 'radial-gradient(circle, rgba(94,200,216,0.55) 0%, transparent 70%)' }}
          />
          <div
            className="absolute right-0 top-1/2 -translate-y-1/2 w-72 h-28 rounded-full blur-[60px] opacity-55"
            style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.50) 0%, transparent 70%)' }}
          />
        </div>

        {/* gradient border wrapper (cyan → violet) */}
        <div className="rounded-[28px] md:rounded-full p-[1.5px] bg-gradient-to-r from-[#5EC8D8]/55 via-white/10 to-[#A78BFA]/55 shadow-[0_10px_40px_-8px_rgba(0,0,0,0.6)]">
          <div className="relative rounded-[27px] md:rounded-full bg-[#0A1525]/85 backdrop-blur-xl px-3 sm:px-5">
            {/* top bar */}
            <div className="relative h-14 flex items-center justify-between overflow-hidden gap-2">
              {/* faint top sheen */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

              <Link href="/" className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#5EC8D8] to-[#3d8fa8] flex items-center justify-center shadow-md shadow-[#5EC8D8]/40">
                  <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                  </svg>
                </div>
                <span className="text-lg font-bold text-white">Ophtech</span>
              </Link>

              {/* desktop links */}
              <div className="hidden md:flex items-center gap-1">
                <a href="#fonctionnalites" className="text-[15px] font-semibold text-white/80 hover:text-white hover:bg-white/10 px-4 py-2 rounded-full transition-all duration-200 tracking-wide">Fonctionnalités</a>
                <a href="#comment" className="text-[15px] font-semibold text-white/80 hover:text-white hover:bg-white/10 px-4 py-2 rounded-full transition-all duration-200 tracking-wide">Comment ça marche</a>
              </div>

              {/* desktop actions */}
              <div className="hidden md:flex items-center gap-2.5">
                <Link href="/prise-rdv" className="inline-flex items-center gap-1.5 text-sm font-semibold border border-[#5EC8D8]/40 hover:border-[#5EC8D8] text-[#70B1C4] hover:text-white px-4 py-2 rounded-full hover:bg-[#5EC8D8]/15 transition-all duration-200">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                  </svg>
                  Prendre RDV
                </Link>
                <Link href="/login" className="inline-flex items-center gap-1.5 text-sm font-semibold border border-white/25 hover:border-white/60 text-white/75 hover:text-white px-4 py-2 rounded-full hover:bg-white/8 transition-all duration-200">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="10 17 15 12 10 7" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="15" y1="12" x2="3" y2="12" strokeLinecap="round"/>
                  </svg>
                  Se connecter
                </Link>
                <Link href="/inscription" className="text-sm font-semibold bg-gradient-to-r from-[#5EC8D8] to-[#A78BFA] hover:opacity-90 text-[#0A1525] px-5 py-2 rounded-full shadow-lg shadow-[#5EC8D8]/30 transition-opacity duration-200 whitespace-nowrap">
                  Essai gratuit
                </Link>
              </div>

              {/* mobile hamburger */}
              <button
                type="button"
                aria-label="Menu"
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
                className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl text-white hover:bg-white/10 transition-colors shrink-0"
              >
                {open ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                    <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                    <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round"/>
                  </svg>
                )}
              </button>
            </div>

            {/* mobile dropdown panel */}
            {open && (
              <div className="md:hidden border-t border-white/10 pb-3 pt-2 flex flex-col gap-1">
                <a onClick={() => setOpen(false)} href="#fonctionnalites" className="text-[15px] font-semibold text-white/80 hover:text-white hover:bg-white/10 px-3 py-2.5 rounded-xl transition-colors">Fonctionnalités</a>
                <a onClick={() => setOpen(false)} href="#comment" className="text-[15px] font-semibold text-white/80 hover:text-white hover:bg-white/10 px-3 py-2.5 rounded-xl transition-colors">Comment ça marche</a>

                <div className="h-px bg-white/10 my-1.5" />

                <Link onClick={() => setOpen(false)} href="/prise-rdv" className="inline-flex items-center gap-2 text-sm font-semibold border border-[#5EC8D8]/40 text-[#70B1C4] px-3 py-2.5 rounded-xl">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                  </svg>
                  Prendre RDV
                </Link>
                <Link onClick={() => setOpen(false)} href="/login" className="inline-flex items-center gap-2 text-sm font-semibold border border-white/25 text-white/85 px-3 py-2.5 rounded-xl">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="10 17 15 12 10 7" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="15" y1="12" x2="3" y2="12" strokeLinecap="round"/>
                  </svg>
                  Se connecter
                </Link>
                <Link onClick={() => setOpen(false)} href="/inscription" className="text-center text-sm font-semibold bg-gradient-to-r from-[#5EC8D8] to-[#A78BFA] text-[#0A1525] px-3 py-2.5 rounded-xl shadow-lg shadow-[#5EC8D8]/30">
                  Essai gratuit
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
