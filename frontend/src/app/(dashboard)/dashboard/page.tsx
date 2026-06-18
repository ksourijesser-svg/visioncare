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
  programme: 'bg-blue-100 text-blue-700',
  confirme: 'bg-green-100 text-green-700',
  complete: 'bg-gray-100 text-gray-700',
  annule: 'bg-red-100 text-red-700',
}

const statusLabels: Record<string, string> = {
  programme: 'Programmé',
  confirme: 'Confirmé',
  complete: 'Complété',
  annule: 'Annulé',
}

export default function DashboardPage() {
  const { patients } = usePatientsStore()
  const { appointments } = useAppointmentsStore()
  const user = getUser()
  const today = format(new Date(), 'yyyy-MM-dd')
  const todayLabel = format(new Date(), "EEEE d MMMM yyyy", { locale: fr })

  const todayRdv = appointments.filter((a) => a.date === today)
  const confirmes = appointments.filter((a) => a.statut === 'confirme').length
  const annules = appointments.filter((a) => a.statut === 'annule').length
  const completes = appointments.filter((a) => a.statut === 'complete').length

  return (
    <div className="flex flex-col flex-1">
      <Header title="Tableau de bord" />
      <div className="p-6 space-y-6">
        <div>
          <p className="text-sm text-gray-500 capitalize">{todayLabel}</p>
          <h2 className="text-lg font-semibold text-[#2D3748]">
            Bonjour{user ? `, Dr. ${user.prenom} ${user.nom}` : ''} !
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <StatCard title="Total patients" value={patients.length} icon={Users} trend={`${patients.length} enregistrés`} />
          <StatCard title="RDV aujourd'hui" value={todayRdv.length} icon={Calendar} color="#10b981" bgColor="#d1fae5" trend={`${todayRdv.filter(a => a.statut !== 'complete').length} restants`} />
          <StatCard title="Total RDV" value={appointments.length} icon={ClipboardList} color="#6366f1" bgColor="#e0e7ff" />
          <StatCard title="RDV confirmés" value={confirmes} icon={CheckCircle} color="#10b981" bgColor="#d1fae5" />
          <StatCard title="RDV annulés" value={annules} icon={XCircle} color="#ef4444" bgColor="#fee2e2" />
          <StatCard title="Consultations complètes" value={completes} icon={TrendingUp} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-2 border-[#DCEEF3]">
            <CardHeader>
              <CardTitle className="text-[#2D3748] text-base">Activité mensuelle</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#DCEEF3" />
                  <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="consultations" fill="#70B1C4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-[#DCEEF3]">
            <CardHeader>
              <CardTitle className="text-[#2D3748] text-base">
                Patients du jour ({todayRdv.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {todayRdv.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">Aucun RDV aujourd&apos;hui</p>
              )}
              {todayRdv.map((rdv) => (
                <div key={rdv.id} className="flex items-center justify-between py-1.5 border-b border-[#F5F9FA] last:border-0">
                  <div>
                    <p className="text-sm font-medium text-[#2D3748]">{rdv.patient_prenom} {rdv.patient_nom}</p>
                    <p className="text-xs text-gray-400">{rdv.heure} · {rdv.motif}</p>
                  </div>
                  <Badge className={`text-xs px-2 py-0.5 rounded-full font-normal ${statusColors[rdv.statut]}`}>
                    {statusLabels[rdv.statut]}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="border-[#DCEEF3]">
          <CardHeader>
            <CardTitle className="text-[#2D3748] text-base">Tendance des consultations</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#DCEEF3" />
                <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="consultations" stroke="#70B1C4" strokeWidth={2} dot={{ fill: '#70B1C4' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
