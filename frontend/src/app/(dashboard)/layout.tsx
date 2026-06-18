import { Sidebar } from '@/components/layout/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F5F9FA]">
      <Sidebar />
      <main className="md:pl-64 min-h-screen flex flex-col">
        {children}
      </main>
    </div>
  )
}
