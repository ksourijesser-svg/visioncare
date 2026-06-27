'use client'

import React from 'react'
import { Loader2 } from 'lucide-react'

// Shared "Se connecter" (login) design language — dark glassmorphism neon card,
// cyan inputs/labels and a glowing cyan submit button. Used by the login,
// inscription and prise-rdv pages so they share one identical container style.

export function NeonCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div style={{
      borderRadius: '20px',
      padding: '2px',
      background: 'linear-gradient(135deg, rgba(0,200,255,0.55), rgba(0,100,200,0.18), rgba(0,200,255,0.45))',
      boxShadow: '0 0 18px rgba(0,200,255,0.5), 0 0 50px rgba(0,150,220,0.3), 0 0 100px rgba(0,100,200,0.18)',
    }}>
      <div
        className={`rounded-[18px] p-6 sm:p-8 ${className}`}
        style={{ background: 'rgba(3, 16, 34, 0.88)', backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)' }}
      >
        {children}
      </div>
    </div>
  )
}

export const neonInputStyle: React.CSSProperties = {
  background: 'rgba(0,25,55,0.7)',
  border: '1px solid rgba(0,150,210,0.35)',
  color: '#C8E8FF',
  borderRadius: '10px',
  colorScheme: 'dark',
}

export const neonInputErrorStyle: React.CSSProperties = {
  ...neonInputStyle,
  border: '1px solid rgba(248,113,113,0.55)',
}

export const focusNeon = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  e.currentTarget.style.border = '1px solid rgba(0,200,255,0.65)'
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,180,255,0.13), 0 0 12px rgba(0,180,255,0.15)'
}
export const blurNeon = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  e.currentTarget.style.border = '1px solid rgba(0,150,210,0.35)'
  e.currentTarget.style.boxShadow = 'none'
}

export const neonLabelStyle: React.CSSProperties = {
  color: 'rgba(150,210,255,0.85)',
  fontSize: '0.75rem',
  fontWeight: 600,
  letterSpacing: '0.08em',
}

// Shared classes for raw <input>/<select> elements (controlled, not via shadcn).
export const neonFieldClass = 'w-full h-11 rounded-[10px] px-3 text-sm focus:outline-none transition-all placeholder:text-[#4E7E9C]'

export function NeonSubmit({ disabled, loading, children }: { disabled?: boolean; loading?: boolean; children: React.ReactNode }) {
  const off = disabled || loading
  return (
    <button
      type="submit"
      disabled={off}
      className="w-full h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200"
      style={{
        background: 'linear-gradient(135deg, #007BB8 0%, #00AADD 50%, #0095CC 100%)',
        color: '#fff',
        border: '1px solid rgba(0,200,255,0.5)',
        boxShadow: '0 4px 20px rgba(0,150,220,0.4)',
        letterSpacing: '0.05em',
        opacity: off ? 0.6 : 1,
        cursor: off ? 'not-allowed' : 'pointer',
      }}
      onMouseEnter={(e) => { if (!off) { e.currentTarget.style.boxShadow = '0 0 14px rgba(0,200,255,0.9), 0 0 35px rgba(0,150,220,0.6)'; e.currentTarget.style.transform = 'translateY(-1px)' } }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,150,220,0.4)'; e.currentTarget.style.transform = 'translateY(0)' }}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  )
}
