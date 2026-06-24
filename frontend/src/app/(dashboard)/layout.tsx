import { Sidebar } from '@/components/layout/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#C5D8E6] dark:bg-[#06101E] transition-colors duration-300 relative overflow-hidden">

      {/* Ambient glow orbs — dark mode only, decorative background light */}
      <div
        className="fixed pointer-events-none hidden dark:block"
        style={{
          top: '-120px', right: '-80px',
          width: '600px', height: '500px',
          background: 'radial-gradient(ellipse at center, rgba(61,143,168,0.18) 0%, transparent 70%)',
          zIndex: 0,
        }}
      />
      <div
        className="fixed pointer-events-none hidden dark:block"
        style={{
          bottom: '-100px', left: '260px',
          width: '500px', height: '450px',
          background: 'radial-gradient(ellipse at center, rgba(112,177,196,0.12) 0%, transparent 70%)',
          zIndex: 0,
        }}
      />
      <div
        className="fixed pointer-events-none hidden dark:block"
        style={{
          top: '40%', left: '35%',
          width: '700px', height: '400px',
          background: 'radial-gradient(ellipse at center, rgba(30,108,135,0.09) 0%, transparent 65%)',
          zIndex: 0,
        }}
      />

      <Sidebar />
      <main className="md:pl-64 min-h-screen flex flex-col relative z-10">
        {children}
      </main>
    </div>
  )
}
