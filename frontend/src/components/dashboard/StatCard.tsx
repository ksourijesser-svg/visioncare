import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  color?: string
  bgColor?: string
  trend?: string
  glowClass?: string
}

export function StatCard({
  title, value, icon: Icon,
  color = '#3d8fa8', bgColor = '#A8CCDE',
  trend, glowClass = 'glow',
}: StatCardProps) {
  return (
    <div className={`bg-white dark:bg-[#0F2035] rounded-2xl p-5 transition-all duration-200 hover:glow-md cursor-default ${glowClass}`}>
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 dark:opacity-90"
          style={{ backgroundColor: bgColor }}
        >
          <Icon size={20} style={{ color }} />
        </div>
        <span className="text-3xl font-bold text-[#1A2B3C] dark:text-[#E2EDF5]">{value}</span>
      </div>
      <p className="text-sm font-semibold text-[#1A2B3C] dark:text-[#E2EDF5]">{title}</p>
      {trend && <p className="text-xs text-gray-400 dark:text-[#6A8E9F] mt-0.5">{trend}</p>}
    </div>
  )
}
