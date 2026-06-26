'use client'

import { useState } from 'react'
import { Plus, Search, Filter, Pencil, Trash2, Wallet, Receipt, Loader2, FileText, Euro, TrendingUp, AlertCircle } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatCard } from '@/components/dashboard/StatCard'
import { FactureModal } from '@/components/factures/FactureModal'
import { PaymentModal } from '@/components/factures/PaymentModal'
import { useFactures, useDeleteFacture, type Facture, type FactureStatus } from '@/hooks/useFactures'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const STATUS_CONFIG: Record<FactureStatus, { label: string; text: string; bg: string; border: string; dot: string }> = {
  payee:     { label: 'Payée',     text: 'text-green-600 dark:text-green-400',  bg: 'bg-green-50 dark:bg-green-900/30',   border: 'border-green-400',  dot: 'bg-green-400' },
  partielle: { label: 'Partielle', text: 'text-amber-600 dark:text-amber-400',  bg: 'bg-amber-50 dark:bg-amber-900/25',   border: 'border-amber-400',  dot: 'bg-amber-400' },
  impayee:   { label: 'Impayée',   text: 'text-red-500 dark:text-red-400',      bg: 'bg-red-50 dark:bg-red-900/20',       border: 'border-red-400',    dot: 'bg-red-400' },
  annulee:   { label: 'Annulée',   text: 'text-gray-500 dark:text-gray-400',    bg: 'bg-gray-100 dark:bg-gray-700/30',    border: 'border-gray-300 dark:border-gray-600', dot: 'bg-gray-400' },
}

const eur = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TND'

export default function FacturationPage() {
  const { data: factures = [], isLoading } = useFactures()
  const deleteFacture = useDeleteFacture()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<FactureStatus | 'tous'>('tous')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Facture | null>(null)
  const [payOpen, setPayOpen] = useState(false)
  const [payFacture, setPayFacture] = useState<Facture | null>(null)

  const filtered = factures.filter((f) => {
    const matchSearch =
      `${f.patient_prenom} ${f.patient_nom}`.toLowerCase().includes(search.toLowerCase()) ||
      f.numero.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'tous' || f.statut === statusFilter
    return matchSearch && matchStatus
  })

  const totalFacture = factures.filter((f) => f.statut !== 'annulee').reduce((s, f) => s + f.montant_total, 0)
  const totalEncaisse = factures.reduce((s, f) => s + f.montant_paye, 0)
  const totalImpaye = factures.filter((f) => f.statut !== 'annulee').reduce((s, f) => s + (f.montant_total - f.montant_paye), 0)
  const nbImpayees = factures.filter((f) => f.statut === 'impayee' || f.statut === 'partielle').length

  function handleEdit(f: Facture) { setEditing(f); setModalOpen(true) }
  function handlePay(f: Facture) { setPayFacture(f); setPayOpen(true) }
  function handleDelete(id: number) { if (confirm('Supprimer cette facture ?')) deleteFacture.mutate(id) }

  return (
    <div className="flex flex-col flex-1">
      <Header title="Facturation" />
      <div className="p-4 sm:p-6 space-y-5">

        {/* ── KPI cards ── */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard title="Total facturé"   value={eur(totalFacture)}  icon={FileText} trend={`${factures.length} facture${factures.length > 1 ? 's' : ''}`} />
          <StatCard title="Encaissé"         value={eur(totalEncaisse)} icon={TrendingUp} color="#059669" bgColor="#a7f3d0" glowClass="glow-green" />
          <StatCard title="En attente"       value={eur(totalImpaye)}   icon={Euro}      color="#d97706" bgColor="#fde68a" glowClass="glow" />
          <StatCard title="Factures impayées" value={nbImpayees}        icon={AlertCircle} color="#dc2626" bgColor="#fecaca" glowClass="glow-red" />
        </div>

        {/* ── Toolbar ── */}
        <div className="bg-white dark:bg-[#102844] rounded-2xl glow px-4 py-3 flex flex-col sm:flex-row gap-3 items-center transition-colors duration-300">
          <div className="relative flex-1 w-full">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#7AAABB] pointer-events-none" />
            <Input
              placeholder="Rechercher par patient ou n° de facture..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 border border-gray-200 dark:border-[#1C3F62]/60 rounded-xl bg-[#F7FAFB] dark:bg-[#091628] dark:text-[#EDF8FF] dark:placeholder:text-[#6A8E9F] focus-visible:ring-[#70B1C4] h-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => { if (v) setStatusFilter(v as FactureStatus | 'tous') }}>
            <SelectTrigger className="w-full sm:w-48 border border-gray-200 dark:border-[#1C3F62]/60 rounded-xl bg-[#F7FAFB] dark:bg-[#091628] dark:text-[#EDF8FF] h-10 shrink-0">
              <Filter size={13} className="mr-1.5 text-gray-400 dark:text-[#7AAABB] shrink-0" />
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Tous les statuts</SelectItem>
              <SelectItem value="impayee">Impayée</SelectItem>
              <SelectItem value="partielle">Partielle</SelectItem>
              <SelectItem value="payee">Payée</SelectItem>
              <SelectItem value="annulee">Annulée</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => { setEditing(null); setModalOpen(true) }}
            className="bg-[#70B1C4] hover:bg-[#5a9db8] text-white shadow-md shadow-[#70B1C4]/30 shrink-0 h-10 btn-neon">
            <Plus size={16} className="mr-1.5" /> Nouvelle facture
          </Button>
        </div>

        {/* ── Table ── */}
        <div className="bg-white dark:bg-[#102844] rounded-2xl glow overflow-hidden">
          {isLoading ? (
            <div className="text-center py-14 text-gray-400 dark:text-[#7AAABB]">
              <Loader2 size={32} className="mx-auto mb-3 animate-spin opacity-40" />
              <p className="text-sm">Chargement des factures...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-14 text-gray-400 dark:text-[#7AAABB]">
              <Receipt size={40} className="mx-auto mb-3 opacity-20" />
              <p className="font-medium">Aucune facture trouvée</p>
            </div>
          ) : (
            <>
              <div className="hidden sm:grid grid-cols-[130px_1fr_120px_110px_110px_140px_92px] px-5 gap-4 py-3 border-b border-gray-100 dark:border-[#1C3F62]/40">
                {['N° Facture', 'Patient', 'Émission', 'Total', 'Payé', 'Statut', 'Actions'].map((h) => (
                  <p key={h} className="text-[11px] font-bold text-gray-400 dark:text-[#7AAABB] uppercase tracking-widest">{h}</p>
                ))}
              </div>
              <div className="divide-y divide-gray-50 dark:divide-[#1C3F62]/30">
                {filtered.map((f) => {
                  const s = STATUS_CONFIG[f.statut]
                  return (
                    <div key={f.id} className={`border-l-4 ${s.border} hover:bg-[#F7FAFB] dark:hover:bg-[#1A3655]/40 transition-colors duration-150`}>
                      <div className="grid grid-cols-1 sm:grid-cols-[130px_1fr_120px_110px_110px_140px_92px] items-center gap-x-4 gap-y-1 px-5 py-3.5">
                        <p className="font-mono text-xs font-semibold text-[#3d8fa8] dark:text-[#70B1C4]">{f.numero}</p>
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full ${s.bg} flex items-center justify-center shrink-0`}>
                            <span className={`text-xs font-bold ${s.text}`}>{f.patient_prenom[0]}{f.patient_nom[0]}</span>
                          </div>
                          <p className="font-semibold text-[#1A2B3C] dark:text-[#EDF8FF] text-sm leading-tight truncate">{f.patient_prenom} {f.patient_nom}</p>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-[#B4D0E0]">{f.date_emission ? format(new Date(f.date_emission), 'dd MMM yyyy', { locale: fr }) : '—'}</p>
                        <p className="text-sm font-semibold text-[#1A2B3C] dark:text-[#EDF8FF] tabular-nums">{eur(f.montant_total)}</p>
                        <p className="text-sm text-emerald-600 dark:text-emerald-400 tabular-nums">{eur(f.montant_paye)}</p>
                        <div className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium w-fit ${s.bg} ${s.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.dot} shrink-0`} />
                          {s.label}
                        </div>
                        <div className="flex items-center gap-0.5">
                          {f.statut !== 'payee' && f.statut !== 'annulee' && (
                            <button onClick={() => handlePay(f)} title="Enregistrer un paiement" className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-500 transition-colors">
                              <Wallet size={14} />
                            </button>
                          )}
                          <button onClick={() => handleEdit(f)} title="Modifier" className="p-1.5 rounded-lg hover:bg-[#E4EEF4] dark:hover:bg-[#1C3F62]/60 text-[#70B1C4] transition-colors btn-neon">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDelete(f.id)} title="Supprimer" className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 transition-colors btn-neon-red">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {filtered.length > 0 && !isLoading && (
          <p className="text-xs text-gray-400 dark:text-[#7AAABB] pl-1">{filtered.length} facture{filtered.length > 1 ? 's' : ''} affichée{filtered.length > 1 ? 's' : ''}</p>
        )}
      </div>

      <FactureModal open={modalOpen} onClose={() => setModalOpen(false)} facture={editing} />
      <PaymentModal open={payOpen} onClose={() => setPayOpen(false)} facture={payFacture} />
    </div>
  )
}
