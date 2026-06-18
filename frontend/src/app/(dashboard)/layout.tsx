import { Sidebar } from '@/components/layout/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#E4EEF4]">
      <Sidebar />
      <main className="md:pl-64 min-h-screen flex flex-col">
        {children}
      </main>
    </div>
  )
}
