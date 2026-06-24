import { Sidebar } from '@/components/layout/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#C5D8E6] dark:bg-[#06101E] transition-colors duration-300 relative overflow-hidden">

      {/* Ambient glow orbs — dark mode only */}
      <div
        className="fixed pointer-events-none hidden dark:block"
        style={{
          top: '-80px', right: '-60px',
          width: '700px', height: '600px',
          background: 'radial-gradient(ellipse at center, rgba(61,143,168,0.20) 0%, rgba(61,143,168,0.06) 40%, transparent 70%)',
          zIndex: 0,
        }}
      />
      <div
        className="fixed pointer-events-none hidden dark:block"
        style={{
          bottom: '-80px', left: '240px',
          width: '600px', height: '500px',
          background: 'radial-gradient(ellipse at center, rgba(112,177,196,0.22) 0%, rgba(112,177,196,0.06) 40%, transparent 70%)',
          zIndex: 0,
        }}
      />
      <div
        className="fixed pointer-events-none hidden dark:block"
        style={{
          top: '30%', left: '30%',
          width: '800px', height: '500px',
          background: 'radial-gradient(ellipse at center, rgba(30,108,135,0.16) 0%, transparent 65%)',
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
