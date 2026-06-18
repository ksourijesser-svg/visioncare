'use client'

import { Users, Calendar, CheckCircle, XCircle, ClipboardList, TrendingUp } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { StatCard } from '@/components/dashboard/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { usePatientsStore } from '@/store/patientsStore'
import { useAppointmentsStore } from '@/store/appointmentsStore'
import { getUser } from '@/lib/auth'

const activityData = [
  { mois: 'Jan', consultations: 42 },
  { mois: 'Fév', consultations: 58 },
  { mois: 'Mar', consultations: 63 },
  { mois: 'Avr', consultations: 71 },
  { mois: 'Mai', consultations: 55 },
  { mois: 'Jun', consultations: 68 },
]

const statusColors: Record<string, string> = {
  programme: 'bg-blue-50 text-blue-600',
  confirme:  'bg-emerald-50 text-emerald-600',
  complete:  'bg-gray-100 text-gray-600',
  annule:    'bg-red-50 text-red-500',
}

const statusLabels: Record<string, string> = {
  programme: 'Programmé',
  confirme:  'Confirmé',
  complete:  'Complété',
  annule:    'Annulé',
}

export default function DashboardPage() {
  const { patients }     = usePatientsStore()
  const { appointments } = useAppointmentsStore()
  const user    = getUser()
  const today   = format(new Date(), 'yyyy-MM-dd')
  const todayLabel = format(new Date(), "EEEE d MMMM yyyy", { locale: fr })

  const todayRdv  = appointments.filter((a) => a.date === today)
  const confirmes = appointments.filter((a) => a.statut === 'confirme').length
  const annules   = appointments.filter((a) => a.statut === 'annule').length
  const completes = appointments.filter((a) => a.statut === 'complete').length

  return (
    <div className="flex flex-col flex-1">
      <Header title="Tableau de bord" />
      <div className="p-6 space-y-6">

        {/* Welcome banner */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#3d8fa8] via-[#70B1C4] to-[#9dd0e0] p-6 text-white shadow-lg">
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
          {/* Decorative circles */}
          <div className="absolute -right-6 -top-6 w-36 h-36 rounded-full bg-white/10" />
          <div className="absolute -right-2 -bottom-10 w-44 h-44 rounded-full bg-white/[0.07]" />
          <div className="absolute right-32 -bottom-4 w-20 h-20 rounded-full bg-white/[0.05]" />
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
          <StatCard title="Total patients"           value={patients.length}      icon={Users}         trend={`${patients.length} enregistrés`} />
          <StatCard title="RDV aujourd'hui"          value={todayRdv.length}      icon={Calendar}      color="#10b981" bgColor="#d1fae5" trend={`${todayRdv.filter(a => a.statut !== 'complete').length} restants`} />
          <StatCard title="Total RDV"                value={appointments.length}  icon={ClipboardList} color="#6366f1" bgColor="#ede9fe" />
          <StatCard title="RDV confirmés"            value={confirmes}            icon={CheckCircle}   color="#10b981" bgColor="#d1fae5" />
          <StatCard title="RDV annulés"              value={annules}              icon={XCircle}       color="#ef4444" bgColor="#fee2e2" />
          <StatCard title="Consultations complètes"  value={completes}            icon={TrendingUp} />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <Card className="xl:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-[#1A2B3C] text-sm font-semibold">Activité mensuelle</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={activityData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="mois" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                    cursor={{ fill: '#f5f9fa' }}
                  />
                  <Bar dataKey="consultations" fill="#70B1C4" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-[#1A2B3C] text-sm font-semibold flex items-center justify-between">
                <span>Patients du jour</span>
                <span className="text-xs font-normal text-[#70B1C4] bg-[#E4EEF4] px-2 py-0.5 rounded-full">{todayRdv.length}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {todayRdv.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Aucun RDV aujourd&apos;hui</p>
              ) : (
                todayRdv.map((rdv) => (
                  <div key={rdv.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-[#1A2B3C]">{rdv.patient_prenom} {rdv.patient_nom}</p>
                      <p className="text-xs text-gray-400">{rdv.heure} · {rdv.motif}</p>
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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[#1A2B3C] text-sm font-semibold">Tendance des consultations</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="mois" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                />
                <Line
                  type="monotone"
                  dataKey="consultations"
                  stroke="#70B1C4"
                  strokeWidth={2.5}
                  dot={{ fill: '#70B1C4', r: 4, strokeWidth: 2, stroke: '#fff' }}
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
