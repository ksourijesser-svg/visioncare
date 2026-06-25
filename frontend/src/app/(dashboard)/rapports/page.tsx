'use client'

import { useState } from 'react'
import { Euro, TrendingUp, AlertCircle, Users, CalendarCheck, Percent, Loader2 } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { StatCard } from '@/components/dashboard/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { useRapports, type Periode } from '@/hooks/useRapports'
import { useTheme } from '@/providers/ThemeProvider'

const PERIODES: { key: Periode; label: string }[] = [
  { key: 'mois', label: 'Ce mois' },
  { key: 'trimestre', label: 'Trimestre' },
  { key: 'annee', label: '12 mois' },
]

const STATUS_COLORS: Record<string, string> = {
  programme: '#60a5fa',
  confirme: '#34d399',
  complete: '#94a3b8',
  annule: '#f87171',
}

const eur = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €'

export default function RapportsPage() {
  const [periode, setPeriode] = useState<Periode>('annee')
  const { data, isLoading } = useRapports(periode)
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const gridColor = isDark ? '#1A3A5C' : '#f0f0f0'
  const axisColor = isDark ? '#6A8E9F' : '#9ca3af'
  const tooltipStyle = isDark
    ? { borderRadius: '12px', border: 'none', backgroundColor: '#0F2035', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', color: '#E2EDF5' }
    : { borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }
  const cursorFill = isDark ? 'rgba(112,177,196,0.06)' : '#f5f9fa'

  const k = data?.kpis

  return (
    <div className="flex flex-col flex-1">
      <Header title="Rapports & statistiques" />
      <div className="p-6 space-y-5">

        {/* Period selector */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className="text-sm text-gray-500 dark:text-[#7AAABB]">Analyse de la performance de votre cabinet</p>
          <div className="inline-flex items-center gap-1 bg-white dark:bg-[#102844] rounded-xl p-1 glow">
            {PERIODES.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriode(p.key)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  periode === p.key
                    ? 'bg-[#70B1C4] text-white shadow-md shadow-[#70B1C4]/30'
                    : 'text-gray-500 dark:text-[#7AAABB] hover:bg-gray-50 dark:hover:bg-[#1C3F62]/40'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading || !data || !k ? (
          <div className="text-center py-24 text-gray-400 dark:text-[#7AAABB]">
            <Loader2 size={32} className="mx-auto mb-3 animate-spin opacity-40" />
            <p className="text-sm">Calcul des statistiques...</p>
          </div>
        ) : (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
              <StatCard title="Chiffre d'affaires" value={eur(k.revenue_total)}   icon={Euro}         trend="facturé sur la période" />
              <StatCard title="Encaissé"           value={eur(k.revenue_encaisse)} icon={TrendingUp}  color="#059669" bgColor="#a7f3d0" glowClass="glow-green" />
              <StatCard title="En attente"         value={eur(k.revenue_impaye)}  icon={AlertCircle}  color="#d97706" bgColor="#fde68a" />
              <StatCard title="Rendez-vous"        value={k.rdv_total}            icon={CalendarCheck} color="#4f46e5" bgColor="#c7d2fe" glowClass="glow-violet" />
              <StatCard title="Nouveaux patients"  value={k.nouveaux_patients}    icon={Users} />
              <StatCard title="Taux de présence"   value={`${k.taux_presence}%`}  icon={Percent}      color="#059669" bgColor="#a7f3d0" glowClass="glow-green" trend={`${k.taux_annulation}% annulés`} />
            </div>

            {/* Revenue chart */}
            <Card className="border-0 dark:bg-[#102844]">
              <CardHeader className="pb-2">
                <CardTitle className="text-[#1A2B3C] dark:text-[#EDF8FF] text-sm font-semibold">Chiffre d&apos;affaires (facturé vs encaissé)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data.revenue_par_mois} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                    <XAxis dataKey="mois" tick={{ fontSize: 12, fill: axisColor }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: axisColor }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: cursorFill }} formatter={(v) => eur(Number(v))} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="facture" name="Facturé" fill="#70B1C4" radius={[6, 6, 0, 0]} barSize={18} />
                    <Bar dataKey="encaisse" name="Encaissé" fill="#34d399" radius={[6, 6, 0, 0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
              {/* Appointments trend */}
              <Card className="xl:col-span-2 border-0 dark:bg-[#102844]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-[#1A2B3C] dark:text-[#EDF8FF] text-sm font-semibold">Évolution des rendez-vous</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={data.rdv_par_mois}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                      <XAxis dataKey="mois" tick={{ fontSize: 12, fill: axisColor }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: axisColor }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Line type="monotone" dataKey="rdv" name="RDV" stroke="#70B1C4" strokeWidth={2.5}
                        dot={{ fill: '#70B1C4', r: 4, strokeWidth: 2, stroke: isDark ? '#0F2035' : '#fff' }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Status pie */}
              <Card className="border-0 dark:bg-[#102844]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-[#1A2B3C] dark:text-[#EDF8FF] text-sm font-semibold">Répartition par statut</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.rdv_par_statut.length === 0 ? (
                    <p className="text-sm text-gray-400 dark:text-[#7AAABB] text-center py-16">Aucune donnée</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={data.rdv_par_statut} dataKey="count" nameKey="label" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                          {data.rdv_par_statut.map((entry) => (
                            <Cell key={entry.statut} fill={STATUS_COLORS[entry.statut] || '#70B1C4'} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {/* New patients */}
              <Card className="border-0 dark:bg-[#102844]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-[#1A2B3C] dark:text-[#EDF8FF] text-sm font-semibold">Nouveaux patients</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={data.patients_par_mois} barSize={24}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                      <XAxis dataKey="mois" tick={{ fontSize: 12, fill: axisColor }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: axisColor }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: cursorFill }} />
                      <Bar dataKey="patients" name="Patients" fill="#a78bfa" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Top motifs */}
              <Card className="border-0 dark:bg-[#102844]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-[#1A2B3C] dark:text-[#EDF8FF] text-sm font-semibold">Motifs les plus fréquents</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.top_motifs.length === 0 ? (
                    <p className="text-sm text-gray-400 dark:text-[#7AAABB] text-center py-16">Aucune donnée</p>
                  ) : (
                    <div className="space-y-3 py-2">
                      {data.top_motifs.map((m, i) => {
                        const max = data.top_motifs[0].count || 1
                        return (
                          <div key={i} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-[#1A2B3C] dark:text-[#EDF8FF] truncate pr-2">{m.motif}</span>
                              <span className="text-gray-400 dark:text-[#7AAABB] shrink-0">{m.count}</span>
                            </div>
                            <div className="h-2 rounded-full bg-gray-100 dark:bg-[#0E2438] overflow-hidden">
                              <div className="h-full rounded-full bg-gradient-to-r from-[#3d8fa8] to-[#70B1C4]" style={{ width: `${(m.count / max) * 100}%` }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
