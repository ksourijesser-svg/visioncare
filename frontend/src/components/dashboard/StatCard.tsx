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
    <div className={`bg-white dark:bg-[#102844] rounded-2xl p-4 sm:p-5 transition-all duration-200 hover:glow-md cursor-default ${glowClass}`}>
      <div
        className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 mb-3"
        style={{ backgroundColor: bgColor }}
      >
        <Icon size={20} style={{ color }} />
      </div>
      <p className="text-2xl sm:text-2xl xl:text-3xl font-bold text-[#1A2B3C] dark:text-[#EDF8FF] leading-tight tabular-nums break-words">{value}</p>
      <p className="text-sm font-semibold text-[#1A2B3C] dark:text-[#EDF8FF] mt-1.5">{title}</p>
      {trend && <p className="text-xs text-gray-400 dark:text-[#7AAABB] mt-0.5">{trend}</p>}
    </div>
  )
}
