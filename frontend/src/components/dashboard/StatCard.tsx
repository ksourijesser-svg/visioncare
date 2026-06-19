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
  color = '#70B1C4', bgColor = '#DCEEF3',
  trend, glowClass = 'glow',
}: StatCardProps) {
  return (
    <div className={`bg-white rounded-2xl p-5 transition-all duration-200 hover:glow-md cursor-default ${glowClass}`}>
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: bgColor }}
        >
          <Icon size={20} style={{ color }} />
        </div>
        <span className="text-3xl font-bold text-[#1A2B3C]">{value}</span>
      </div>
      <p className="text-sm font-semibold text-[#1A2B3C]">{title}</p>
      {trend && <p className="text-xs text-gray-400 mt-0.5">{trend}</p>}
    </div>
  )
}
