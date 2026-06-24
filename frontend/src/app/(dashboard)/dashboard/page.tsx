'use client'

import { Users, Calendar, CheckCircle, XCircle, ClipboardList, TrendingUp } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { StatCard } from '@/components/dashboard/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { usePatients } from '@/hooks/usePatients'
import { useAppointments } from '@/hooks/useAppointments'
import { getUser } from '@/lib/auth'
import { useTheme } from '@/providers/ThemeProvider'

const activityData = [
  { mois: 'Jan', consultations: 42 },
  { mois: 'Fév', consultations: 58 },
  { mois: 'Mar', consultations: 63 },
  { mois: 'Avr', consultations: 71 },
  { mois: 'Mai', consultations: 55 },
  { mois: 'Jun', consultations: 68 },
]

const statusColors: Record<string, string> = {
  programme: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  confirme:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  complete:  'bg-gray-200 text-gray-700 dark:bg-gray-700/30 dark:text-gray-400',
  annule:    'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400',
}

const statusLabels: Record<string, string> = {
  programme: 'Programmé',
  confirme:  'Confirmé',
  complete:  'Complété',
  annule:    'Annulé',
}

export default function DashboardPage() {
  const { data: patients = [] }     = usePatients()
  const { data: appointments = [] } = useAppointments()
  const user    = getUser()
  const { theme } = useTheme()
  const today   = format(new Date(), 'yyyy-MM-dd')
  const todayLabel = format(new Date(), "EEEE d MMMM yyyy", { locale: fr })

  const todayRdv  = appointments.filter((a) => a.date === today)
  const confirmes = appointments.filter((a) => a.statut === 'confirme').length
  const annules   = appointments.filter((a) => a.statut === 'annule').length
  const completes = appointments.filter((a) => a.statut === 'complete').length

  const isDark = theme === 'dark'
  const gridColor    = isDark ? '#1A3A5C' : '#f0f0f0'
  const axisColor    = isDark ? '#6A8E9F' : '#9ca3af'
  const tooltipStyle = isDark
    ? { borderRadius: '12px', border: 'none', backgroundColor: '#0F2035', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', color: '#E2EDF5' }
    : { borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }
  const cursorFill = isDark ? 'rgba(112,177,196,0.06)' : '#f5f9fa'

  return (
    <div className="flex flex-col flex-1">
      <Header title="Tableau de bord" />
      <div className="p-6 space-y-6">

        {/* Welcome banner */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#1e6c87] via-[#3d8fa8] to-[#5eacc2] p-6 text-white shadow-lg">
          <div className="relative z-10">
            <p className="text-white/70 text-sm capitalize mb-1">{todayLabel}</p>
            <h2 className="text-2xl font-bold">
              Bonjour{user ? `, Dr. ${user.prenom} ${user.nom}` : ''} !
            </h2>
            <p className="text-white/70 text-sm mt-1">
              {todayRdv.length === 0
                ? 'Aucun rendez-vous prévu aujourd\'hui.'
                : `${todayRdv.length} rendez-vous au programme aujourd'hui.`}
            </p>
          </div>
          <div className="absolute -right-6 -top-6 w-36 h-36 rounded-full bg-white/10" />
          <div className="absolute -right-2 -bottom-10 w-44 h-44 rounded-full bg-white/[0.07]" />
          <div className="absolute right-32 -bottom-4 w-20 h-20 rounded-full bg-white/[0.05]" />
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
          <StatCard title="Total patients"           value={patients.length}      icon={Users}         trend={`${patients.length} enregistrés`} />
          <StatCard title="RDV aujourd'hui"          value={todayRdv.length}      icon={Calendar}      color="#059669" bgColor="#a7f3d0" trend={`${todayRdv.filter(a => a.statut !== 'complete').length} restants`} glowClass="glow-green" />
          <StatCard title="Total RDV"                value={appointments.length}  icon={ClipboardList} color="#4f46e5" bgColor="#c7d2fe" glowClass="glow-violet" />
          <StatCard title="RDV confirmés"            value={confirmes}            icon={CheckCircle}   color="#059669" bgColor="#a7f3d0" glowClass="glow-green" />
          <StatCard title="RDV annulés"              value={annules}              icon={XCircle}       color="#dc2626" bgColor="#fecaca" glowClass="glow-red" />
          <StatCard title="Consultations complètes"  value={completes}            icon={TrendingUp} />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <Card className="xl:col-span-2 border-0 dark:bg-[#102844]">
            <CardHeader className="pb-2">
              <CardTitle className="text-[#1A2B3C] dark:text-[#EDF8FF] text-sm font-semibold">Activité mensuelle</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={activityData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="mois" tick={{ fontSize: 12, fill: axisColor }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: axisColor }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: cursorFill }} />
                  <Bar dataKey="consultations" fill="#70B1C4" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-0 dark:bg-[#102844]">
            <CardHeader className="pb-2">
              <CardTitle className="text-[#1A2B3C] dark:text-[#EDF8FF] text-sm font-semibold flex items-center justify-between">
                <span>Patients du jour</span>
                <span className="text-xs font-normal text-[#3d8fa8] bg-[#C5D8E6] dark:bg-[#1C3F62] dark:text-[#70B1C4] px-2 py-0.5 rounded-full font-semibold">{todayRdv.length}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {todayRdv.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-[#7AAABB] text-center py-6">Aucun RDV aujourd&apos;hui</p>
              ) : (
                todayRdv.map((rdv) => (
                  <div key={rdv.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-[#1C3F62]/40 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-[#1A2B3C] dark:text-[#EDF8FF]">{rdv.patient_prenom} {rdv.patient_nom}</p>
                      <p className="text-xs text-gray-400 dark:text-[#7AAABB]">{rdv.heure} · {rdv.motif}</p>
                    </div>
                    <Badge className={`text-xs px-2 py-0.5 rounded-full font-normal border-0 ${statusColors[rdv.statut]}`}>
                      {statusLabels[rdv.statut]}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Trend chart */}
        <Card className="border-0 dark:bg-[#102844]">
          <CardHeader className="pb-2">
            <CardTitle className="text-[#1A2B3C] dark:text-[#EDF8FF] text-sm font-semibold">Tendance des consultations</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="mois" tick={{ fontSize: 12, fill: axisColor }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: axisColor }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="consultations"
                  stroke="#70B1C4"
                  strokeWidth={2.5}
                  dot={{ fill: '#70B1C4', r: 4, strokeWidth: 2, stroke: isDark ? '#0F2035' : '#fff' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
