'use client'

import { Users, Calendar, CheckCircle, XCircle, ClipboardList, TrendingUp } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { StatCard } from '@/components/dashboard/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line,
} from 'recharts'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const mockStats = {
  patients_total: 248,
  rendez_vous_aujourd_hui: 12,
  consultations_semaine: 58,
  rendez_vous_confirmes: 8,
  rendez_vous_annules: 2,
  rendez_vous_completes: 45,
}

const mockActivity = [
  { mois: 'Jan', consultations: 42 },
  { mois: 'Fév', consultations: 58 },
  { mois: 'Mar', consultations: 63 },
  { mois: 'Avr', consultations: 71 },
  { mois: 'Mai', consultations: 55 },
  { mois: 'Jun', consultations: 68 },
]

const mockPatients = [
  { id: 1, nom: 'Martin Sophie', heure: '09:00', motif: 'Bilan visuel', statut: 'confirme' },
  { id: 2, nom: 'Dubois Pierre', heure: '09:30', motif: 'Contrôle glaucome', statut: 'programme' },
  { id: 3, nom: 'Bernard Marie', heure: '10:00', motif: 'Prescription lunettes', statut: 'confirme' },
  { id: 4, nom: 'Petit Jean', heure: '10:30', motif: 'Urgence oculaire', statut: 'programme' },
  { id: 5, nom: 'Moreau Claire', heure: '11:00', motif: 'Suivi post-op', statut: 'complete' },
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
  const today = format(new Date(), "EEEE d MMMM yyyy", { locale: fr })

  return (
    <div className="flex flex-col flex-1">
      <Header title="Tableau de bord" />
      <div className="p-6 space-y-6">
        <div>
          <p className="text-sm text-gray-500 capitalize">{today}</p>
          <h2 className="text-lg font-semibold text-[#2D3748]">Bonjour, bonne journée de consultations !</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <StatCard title="Total patients" value={mockStats.patients_total} icon={Users} trend="+12 ce mois" />
          <StatCard title="RDV aujourd'hui" value={mockStats.rendez_vous_aujourd_hui} icon={Calendar} color="#10b981" bgColor="#d1fae5" trend="4 restants" />
          <StatCard title="Consultations (semaine)" value={mockStats.consultations_semaine} icon={ClipboardList} color="#6366f1" bgColor="#e0e7ff" />
          <StatCard title="RDV confirmés" value={mockStats.rendez_vous_confirmes} icon={CheckCircle} color="#10b981" bgColor="#d1fae5" />
          <StatCard title="RDV annulés" value={mockStats.rendez_vous_annules} icon={XCircle} color="#ef4444" bgColor="#fee2e2" />
          <StatCard title="Consultations complètes" value={mockStats.rendez_vous_completes} icon={TrendingUp} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-2 border-[#DCEEF3]">
            <CardHeader>
              <CardTitle className="text-[#2D3748] text-base">Activité mensuelle</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={mockActivity}>
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
              <CardTitle className="text-[#2D3748] text-base">Patients du jour</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockPatients.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-[#F5F9FA] last:border-0">
                  <div>
                    <p className="text-sm font-medium text-[#2D3748]">{p.nom}</p>
                    <p className="text-xs text-gray-400">{p.heure} · {p.motif}</p>
                  </div>
                  <Badge className={`text-xs px-2 py-0.5 rounded-full font-normal ${statusColors[p.statut]}`}>
                    {statusLabels[p.statut]}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="border-[#DCEEF3]">
          <CardHeader>
            <CardTitle className="text-[#2D3748] text-base">Tendance hebdomadaire</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={mockActivity}>
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
