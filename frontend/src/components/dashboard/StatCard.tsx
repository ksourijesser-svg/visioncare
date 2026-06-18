import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  color?: string
  bgColor?: string
  trend?: string
}

export function StatCard({ title, value, icon: Icon, color = '#70B1C4', bgColor = '#DCEEF3', trend }: StatCardProps) {
  return (
    <Card className="border-[#DCEEF3]">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">{title}</p>
            <p className="text-2xl font-bold text-[#2D3748]">{value}</p>
            {trend && <p className="text-xs text-gray-400 mt-1">{trend}</p>}
          </div>
          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center')} style={{ backgroundColor: bgColor }}>
            <Icon size={22} style={{ color }} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
