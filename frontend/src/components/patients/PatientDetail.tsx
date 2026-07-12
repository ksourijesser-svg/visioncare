'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Phone, Mail, MapPin, Calendar, ClipboardList,
  Pencil, X, Save, Hash, Activity, FileText,
  Paperclip, Upload, Trash2, ImageIcon, FileDown, Loader2, ExternalLink,
  Pill, Glasses, Printer, Plus, HeartPulse, ShieldCheck, CircleDot,
} from 'lucide-react'

const PRISE_LABEL: Record<string, string> = {
  cnam: 'CNAM',
  assurance_privee: 'Assurance privée',
  autre: 'Autre',
}
import { Patient } from '@/store/patientsStore'
import { useUpdatePatient } from '@/hooks/usePatients'
import { useAppointments } from '@/hooks/useAppointments'
import { usePatientFiles, useUploadPatientFile, useDeletePatientFile, fetchFileObjectUrl, fetchFileDataUrl } from '@/hooks/usePatientFiles'
import { useOrdonnances, useDeleteOrdonnance, type Ordonnance } from '@/hooks/useOrdonnances'
import { OrdonnanceModal } from '@/components/patients/OrdonnanceModal'
import { exportPatientDossierPdf } from '@/lib/patientPdf'
import { exportOrdonnancePdf } from '@/lib/ordonnancePdf'
import { useProfileStore } from '@/store/profileStore'
import { getUser } from '@/lib/auth'
import { differenceInYears, format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { toast } from 'sonner'

const schema = z.object({
  prenom:          z.string().min(1, 'Requis'),
  nom:             z.string().min(1, 'Requis'),
  date_naissance:  z.string(),
  telephone:       z.string().min(1, 'Requis'),
  email:           z.union([z.string().email('Email invalide'), z.literal('')]),
  adresse:         z.string(),
  notes:           z.string(),
})
type FormData = z.infer<typeof schema>

interface Props {
  patient: Patient | null
  open: boolean
  onClose: () => void
  onEdit: () => void
}

export function PatientDetail({ patient, open, onClose }: Props) {
  const { data: appointments = [] } = useAppointments(patient ? { patient_id: patient.id } : undefined)
  const updatePatientMutation       = useUpdatePatient()
  const [isEditing, setIsEditing]   = useState(false)

  const { data: files = [] }  = usePatientFiles(patient?.id ?? null)
  const uploadFile            = useUploadPatientFile()
  const deleteFile            = useDeletePatientFile()
  const fileInputRef          = useRef<HTMLInputElement>(null)
  const [openingId, setOpeningId] = useState<number | null>(null)
  const [exportingPdf, setExportingPdf] = useState(false)

  const { data: ordonnances = [] } = useOrdonnances(patient?.id ?? null)
  const deleteOrdonnance          = useDeleteOrdonnance()
  const { profile }               = useProfileStore()
  const [ordModalOpen, setOrdModalOpen] = useState(false)

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { adresse: '', notes: '', email: '' },
  })

  useEffect(() => {
    if (patient) {
      reset({
        prenom:         patient.prenom,
        nom:            patient.nom,
        date_naissance: patient.date_naissance || '',
        telephone:      patient.telephone,
        email:          patient.email || '',
        adresse:        patient.adresse || '',
        notes:          patient.notes || '',
      })
    }
  }, [patient, reset, open])

  // Leave edit mode whenever the dialog opens or the target patient changes —
  // render-phase reset (avoids react-hooks/set-state-in-effect).
  const [viewKey, setViewKey] = useState('')
  const currentViewKey = open && patient ? `${patient.id}` : ''
  if (currentViewKey !== viewKey) {
    setViewKey(currentViewKey)
    if (isEditing) setIsEditing(false)
  }

  if (!patient) return null

  const initials = `${patient.prenom[0]}${patient.nom[0]}`.toUpperCase()
  const age = patient.date_naissance
    ? differenceInYears(new Date(), new Date(patient.date_naissance))
    : null

  const patientAppointments = appointments
    .filter((a) => a.patient_id === patient.id)
    .sort((a, b) => b.date.localeCompare(a.date))

  const consultationHistory = patientAppointments.filter(
    (a) => a.statut === 'complete' && (a.diagnostic || a.traitement || a.notes)
  )

  function onSubmit(data: FormData) {
    updatePatientMutation.mutate(
      { id: patient!.id, data },
      {
        onSuccess: () => {
          reset(data)
          setIsEditing(false)
          toast.success('Dossier patient mis à jour')
        },
        onError: () => toast.error('Erreur lors de la mise à jour'),
      }
    )
  }

  function handleCancelEdit() {
    const p = patient!
    reset({
      prenom:         p.prenom,
      nom:            p.nom,
      date_naissance: p.date_naissance || '',
      telephone:      p.telephone,
      email:          p.email || '',
      adresse:        p.adresse || '',
      notes:          p.notes || '',
    })
    setIsEditing(false)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const list = e.target.files
    if (!list || !list.length || !patient) return
    const selected = Array.from(list)
    for (const f of selected) {
      try {
        await uploadFile.mutateAsync({ patientId: patient.id, file: f })
      } catch {
        toast.error(`Échec de l'envoi de ${f.name}`)
      }
    }
    toast.success(selected.length > 1 ? `${selected.length} fichiers ajoutés` : 'Fichier ajouté')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function openFile(fileId: number) {
    if (!patient) return
    setOpeningId(fileId)
    try {
      const url = await fetchFileObjectUrl(patient.id, fileId)
      window.open(url, '_blank')
    } catch {
      toast.error("Impossible d'ouvrir le fichier")
    } finally {
      setOpeningId(null)
    }
  }

  function handleDeleteFile(fileId: number) {
    if (!patient || !confirm('Supprimer ce document ?')) return
    deleteFile.mutate({ patientId: patient.id, fileId }, {
      onSuccess: () => toast.success('Document supprimé'),
      onError: () => toast.error('Erreur lors de la suppression'),
    })
  }

  async function handleExportPdf() {
    if (!patient || exportingPdf) return
    setExportingPdf(true)
    try {
      const u = getUser()
      // Fetch image files as base64 data URLs so they embed in the PDF.
      const documents = await Promise.all(
        files.map(async (f) => {
          const isImage = (f.content_type || '').startsWith('image/')
          let dataUrl: string | null = null
          if (isImage) {
            try { dataUrl = await fetchFileDataUrl(patient.id, f.id) } catch { dataUrl = null }
          }
          return { filename: f.filename, created_at: f.created_at, dataUrl }
        })
      )
      const ok = exportPatientDossierPdf({
        prenom: patient.prenom,
        nom: patient.nom,
        id: patient.id,
        age,
        date_naissance: patient.date_naissance || undefined,
        telephone: patient.telephone || undefined,
        email: patient.email || undefined,
        adresse: patient.adresse || undefined,
        notes: patient.notes || undefined,
        consultations: consultationHistory.map((c) => ({
          date: c.date,
          motif: c.motif,
          diagnostic: c.diagnostic || undefined,
          traitement: c.traitement || undefined,
          notes: c.notes || undefined,
        })),
        documents,
        doctorName: u ? `${u.prenom} ${u.nom}` : undefined,
      })
      if (!ok) toast.error('Autorisez les fenêtres pop-up pour exporter le PDF')
    } catch {
      toast.error("Erreur lors de l'export PDF")
    } finally {
      setExportingPdf(false)
    }
  }

  function openOrdonnance(o: Ordonnance, autoPrint: boolean) {
    if (!patient) return
    const ok = exportOrdonnancePdf({
      type: o.type,
      date_ordonnance: o.date_ordonnance,
      medicaments: o.medicaments,
      verres: o.verres,
      lentilles: o.lentilles,
      notes: o.notes,
      patient: { prenom: patient.prenom, nom: patient.nom, age, date_naissance: patient.date_naissance || undefined },
      doctor: {
        prenom: profile.prenom, nom: profile.nom, specialite: profile.specialite, rpps: profile.rpps,
        cabinet_nom: profile.cabinet_nom, cabinet_adresse: profile.cabinet_adresse,
        cabinet_telephone: profile.cabinet_telephone, cabinet_email: profile.cabinet_email,
      },
    }, { autoPrint })
    if (!ok) toast.error('Autorisez les fenêtres pop-up pour ouvrir l\'ordonnance')
  }

  function handleDeleteOrdonnance(id: number) {
    if (!patient || !confirm('Supprimer cette ordonnance ?')) return
    deleteOrdonnance.mutate({ id, patientId: patient.id }, {
      onSuccess: () => toast.success('Ordonnance supprimée'),
      onError: () => toast.error('Erreur lors de la suppression'),
    })
  }

  return (
    <>
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-6xl sm:max-w-6xl p-0 overflow-hidden flex flex-col max-h-[92vh] gap-0 dark:bg-[#06101E] dark:border-[#1C3F62]/50 dark:[box-shadow:0_0_0_1px_rgba(112,177,196,0.50),_0_0_18px_rgba(61,143,168,0.45),_0_0_55px_rgba(61,143,168,0.28),_0_0_110px_rgba(61,143,168,0.15),_0_20px_50px_rgba(0,0,0,0.65),_inset_0_1px_0_rgba(255,255,255,0.06)]">

        {/* ── Gradient header ── */}
        <div className="relative bg-gradient-to-br from-[#1e6c87] via-[#3d8fa8] to-[#70B1C4] pt-5 pb-6 px-6 shrink-0">
          {/* Decorative circles */}
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute right-10 -bottom-6 w-28 h-28 rounded-full bg-white/[0.07] pointer-events-none" />

          {/* Close + Edit buttons */}
          <div className="flex justify-between items-center mb-4 relative z-10">
            <span className="text-white/70 text-xs font-bold uppercase tracking-widest">Dossier patient</span>
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <>
                  <button
                    onClick={handleExportPdf}
                    disabled={exportingPdf}
                    className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors btn-neon disabled:opacity-60"
                  >
                    {exportingPdf ? <Loader2 size={12} className="animate-spin" /> : <FileDown size={12} />} Exporter PDF
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors btn-neon"
                  >
                    <Pencil size={12} /> Modifier
                  </button>
                </>
              ) : (
                <button
                  onClick={handleCancelEdit}
                  className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                >
                  <X size={12} /> Annuler
                </button>
              )}
            </div>
          </div>

          {/* Identity — horizontal layout */}
          <div className="flex items-center gap-5 relative z-10">
            <Avatar className="w-20 h-20 border-4 border-white/40 shadow-xl shadow-black/30 shrink-0">
              <AvatarFallback className="bg-white/25 text-white text-2xl font-bold backdrop-blur-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            {!isEditing ? (
              <div className="min-w-0">
                <h2 className="text-2xl font-bold text-white drop-shadow-sm truncate">
                  {patient.prenom} {patient.nom}
                </h2>
                <p className="text-white/75 text-sm mt-0.5">
                  {age !== null ? `${age} ans` : 'Âge inconnu'} · Patient #{patient.id}
                </p>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 border border-white/20">
                    <Activity size={11} className="text-white/90" />
                    <span className="text-white text-xs font-semibold">{patientAppointments.length} RDV</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 border border-white/20">
                    <ClipboardList size={11} className="text-white/90" />
                    <span className="text-white text-xs font-semibold">{consultationHistory.length} compte-rendu{consultationHistory.length > 1 ? 's' : ''}</span>
                  </div>
                  {patient.derniere_visite && (
                    <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 border border-white/20">
                      <Calendar size={11} className="text-white/90" />
                      <span className="text-white text-xs font-semibold">
                        {format(new Date(patient.derniere_visite), 'dd MMM yyyy', { locale: fr })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-bold text-white drop-shadow-sm">{patient.prenom} {patient.nom}</h2>
                <p className="mt-1 text-white/80 text-sm font-medium">Mode édition</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto scrollbar-modal px-5 py-5 bg-[#F0F5F8] dark:bg-[#06101E]">
         <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 items-start">

          {/* ── Left column: identity & notes ── */}
          <div className="space-y-4">

          {/* Informations section */}
          <div className="bg-white dark:bg-[#102844] rounded-2xl glow overflow-hidden">
            <div className="px-4 pt-4 pb-2 flex items-center gap-2">
              <Hash size={13} className="text-[#70B1C4]" />
              <span className="text-[10px] font-bold text-gray-400 dark:text-[#7AAABB] uppercase tracking-widest">Informations</span>
            </div>

            <div className="px-4 pb-4 space-y-3">
              {isEditing ? (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500 dark:text-[#7AAABB]">Prénom *</Label>
                    <Input {...register('prenom')} className="h-8 text-sm border-gray-200 dark:border-[#1C3F62]/50 dark:bg-[#091628] dark:text-[#EDF8FF]" />
                    {errors.prenom && <p className="text-red-500 text-xs">{errors.prenom.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500 dark:text-[#7AAABB]">Nom *</Label>
                    <Input {...register('nom')} className="h-8 text-sm border-gray-200 dark:border-[#1C3F62]/50 dark:bg-[#091628] dark:text-[#EDF8FF]" />
                    {errors.nom && <p className="text-red-500 text-xs">{errors.nom.message}</p>}
                  </div>
                </div>
              ) : null}

              <InfoRow
                icon={<Calendar size={14} className="text-[#70B1C4]" />}
                isEditing={isEditing}
                editContent={
                  <Input {...register('date_naissance')} type="date" className="h-8 text-sm border-gray-200 dark:border-[#1C3F62]/50 dark:bg-[#091628] dark:text-[#EDF8FF] flex-1" />
                }
                displayContent={
                  patient.date_naissance
                    ? <span className="text-sm text-[#1A2B3C] dark:text-[#EDF8FF] font-medium">Né(e) le {format(new Date(patient.date_naissance), 'dd MMMM yyyy', { locale: fr })}</span>
                    : <span className="text-sm text-gray-400 dark:text-[#7AAABB] italic">Non renseignée</span>
                }
              />

              <InfoRow
                icon={<Phone size={14} className="text-[#70B1C4]" />}
                isEditing={isEditing}
                editContent={
                  <>
                    <Input {...register('telephone')} className="h-8 text-sm border-gray-200 dark:border-[#1C3F62]/50 dark:bg-[#091628] dark:text-[#EDF8FF] flex-1" />
                    {errors.telephone && <p className="text-red-500 text-xs mt-0.5">{errors.telephone.message}</p>}
                  </>
                }
                displayContent={<span className="text-sm text-[#1A2B3C] dark:text-[#EDF8FF] font-medium">{patient.telephone}</span>}
              />

              <InfoRow
                icon={<Mail size={14} className="text-[#70B1C4]" />}
                isEditing={isEditing}
                editContent={
                  <>
                    <Input {...register('email')} type="email" className="h-8 text-sm border-gray-200 dark:border-[#1C3F62]/50 dark:bg-[#091628] dark:text-[#EDF8FF] flex-1" placeholder="email@example.fr" />
                    {errors.email && <p className="text-red-500 text-xs mt-0.5">{errors.email.message}</p>}
                  </>
                }
                displayContent={
                  patient.email
                    ? <span className="text-sm text-[#1A2B3C] dark:text-[#EDF8FF] font-medium">{patient.email}</span>
                    : <span className="text-sm text-gray-400 dark:text-[#7AAABB] italic">Non renseigné</span>
                }
              />

              <InfoRow
                icon={<MapPin size={14} className="text-[#70B1C4]" />}
                isEditing={isEditing}
                editContent={
                  <Input {...register('adresse')} className="h-8 text-sm border-gray-200 dark:border-[#1C3F62]/50 dark:bg-[#091628] dark:text-[#EDF8FF] flex-1" placeholder="12 rue de la Santé, Paris" />
                }
                displayContent={
                  patient.adresse
                    ? <span className="text-sm text-[#1A2B3C] dark:text-[#EDF8FF] font-medium">{patient.adresse}</span>
                    : <span className="text-sm text-gray-400 dark:text-[#7AAABB] italic">Non renseignée</span>
                }
              />
            </div>
          </div>

          {/* Notes médicales */}
          <div className="bg-white dark:bg-[#102844] rounded-2xl glow overflow-hidden">
            <div className="px-4 pt-4 pb-2 flex items-center gap-2">
              <FileText size={13} className="text-amber-500" />
              <span className="text-[10px] font-bold text-gray-400 dark:text-[#7AAABB] uppercase tracking-widest">Notes médicales</span>
            </div>
            <div className="px-4 pb-4">
              {isEditing ? (
                <textarea
                  {...register('notes')}
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 dark:border-[#1C3F62]/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#70B1C4] resize-none bg-[#F7FAFB] dark:bg-[#091628] dark:text-[#EDF8FF] dark:placeholder:text-[#7AAABB]"
                  placeholder="Myopie forte, allergies, antécédents..."
                />
              ) : patient.notes ? (
                <div className="bg-amber-50 dark:bg-amber-900/15 border border-amber-100 dark:border-amber-700/30 rounded-xl px-4 py-3 text-sm text-gray-700 dark:text-[#E8D5A0] leading-relaxed">
                  {patient.notes}
                </div>
              ) : (
                <p className="text-sm text-gray-400 dark:text-[#7AAABB] italic">Aucune note médicale</p>
              )}
            </div>
          </div>

          {/* Antécédents & prise en charge */}
          {!isEditing && (
            <div className="bg-white dark:bg-[#102844] rounded-2xl glow overflow-hidden">
              <div className="px-4 pt-4 pb-2 flex items-center gap-2">
                <HeartPulse size={13} className="text-[#70B1C4]" />
                <span className="text-[10px] font-bold text-gray-400 dark:text-[#7AAABB] uppercase tracking-widest">Antécédents &amp; prise en charge</span>
              </div>
              <div className="px-4 pb-4 space-y-3">
                {patient.prise_en_charge && (
                  <div className="inline-flex items-center gap-1.5 bg-[#E4EEF4] dark:bg-[#1C3F62]/60 rounded-full px-3 py-1">
                    <ShieldCheck size={13} className="text-[#3d8fa8] dark:text-[#70B1C4]" />
                    <span className="text-xs font-semibold text-[#1A2B3C] dark:text-[#EDF8FF]">
                      {PRISE_LABEL[patient.prise_en_charge] ?? patient.prise_en_charge}
                    </span>
                  </div>
                )}
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 dark:text-[#7AAABB] uppercase tracking-wide mb-1">Généraux</p>
                  {patient.antecedents_generaux
                    ? <p className="text-sm text-gray-700 dark:text-[#B4D0E0] leading-relaxed">{patient.antecedents_generaux}</p>
                    : <p className="text-sm text-gray-400 dark:text-[#7AAABB] italic">Non renseignés</p>}
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 dark:text-[#7AAABB] uppercase tracking-wide mb-1">Ophtalmologiques</p>
                  {patient.antecedents_ophtalmologiques
                    ? <p className="text-sm text-gray-700 dark:text-[#B4D0E0] leading-relaxed">{patient.antecedents_ophtalmologiques}</p>
                    : <p className="text-sm text-gray-400 dark:text-[#7AAABB] italic">Non renseignés</p>}
                </div>
              </div>
            </div>
          )}

          {/* Save button (edit mode) */}
          {isEditing && (
            <Button
              type="submit"
              disabled={!isDirty}
              className="w-full bg-[#70B1C4] hover:bg-[#5a9db8] text-white shadow-md shadow-[#70B1C4]/30 disabled:opacity-50 btn-neon"
            >
              <Save size={14} className="mr-2" /> Enregistrer les modifications
            </Button>
          )}

          </div>{/* ── end left column ── */}

          {/* ── Right column: documents & prescriptions ── */}
          <div className="space-y-4">

          {/* Documents */}
          {!isEditing && (
            <div className="bg-white dark:bg-[#102844] rounded-2xl glow overflow-hidden">
              <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Paperclip size={13} className="text-[#70B1C4]" />
                  <span className="text-[10px] font-bold text-gray-400 dark:text-[#7AAABB] uppercase tracking-widest">Documents &amp; imagerie</span>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadFile.isPending}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3d8fa8] dark:text-[#70B1C4] hover:bg-[#E4EEF4] dark:hover:bg-[#1C3F62]/50 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
                >
                  {uploadFile.isPending ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                  Ajouter
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,application/pdf,.doc,.docx,.txt"
                  onChange={handleUpload}
                  className="hidden"
                />
              </div>

              <div className="px-4 pb-4">
                {files.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full text-center py-6 text-gray-400 dark:text-[#7AAABB] border border-dashed border-gray-200 dark:border-[#1C3F62]/50 rounded-xl hover:border-[#70B1C4] hover:bg-[#F7FAFB] dark:hover:bg-[#0D2038] transition-colors"
                  >
                    <Upload size={24} className="mx-auto mb-2 opacity-30" />
                    <p className="text-xs">Glissez ou cliquez pour ajouter un document</p>
                    <p className="text-[10px] mt-0.5 text-gray-300 dark:text-[#7AAABB]/60">Images, PDF · 10 Mo max</p>
                  </button>
                ) : (
                  <div className="space-y-2">
                    {files.map((f) => {
                      const isImage = (f.content_type || '').startsWith('image/')
                      return (
                        <div key={f.id} className="flex items-center gap-3 rounded-xl border border-gray-100 dark:border-[#1C3F62]/40 bg-[#F7FAFB] dark:bg-[#091628] px-3 py-2.5 group">
                          <div className="w-9 h-9 rounded-lg bg-[#E4EEF4] dark:bg-[#1C3F62] flex items-center justify-center shrink-0">
                            {isImage
                              ? <ImageIcon size={15} className="text-[#3d8fa8] dark:text-[#70B1C4]" />
                              : <FileText size={15} className="text-[#3d8fa8] dark:text-[#70B1C4]" />}
                          </div>
                          <button type="button" onClick={() => openFile(f.id)} className="flex-1 min-w-0 text-left">
                            <p className="text-sm font-medium text-[#1A2B3C] dark:text-[#EDF8FF] truncate leading-tight">{f.filename}</p>
                            <p className="text-[11px] text-gray-400 dark:text-[#7AAABB]">
                              {formatSize(f.size)} · {format(new Date(f.created_at), 'dd MMM yyyy', { locale: fr })}
                            </p>
                          </button>
                          <button type="button" onClick={() => openFile(f.id)} title="Ouvrir" disabled={openingId === f.id}
                            className="p-1.5 rounded-lg text-[#70B1C4] hover:bg-[#E4EEF4] dark:hover:bg-[#1C3F62]/60 transition-colors shrink-0">
                            {openingId === f.id ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
                          </button>
                          <button type="button" onClick={() => handleDeleteFile(f.id)} title="Supprimer"
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Ordonnances */}
          {!isEditing && (
            <div className="bg-white dark:bg-[#102844] rounded-2xl glow overflow-hidden">
              <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Pill size={13} className="text-[#70B1C4]" />
                  <span className="text-[10px] font-bold text-gray-400 dark:text-[#7AAABB] uppercase tracking-widest">Ordonnances</span>
                </div>
                <button
                  type="button"
                  onClick={() => setOrdModalOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3d8fa8] dark:text-[#70B1C4] hover:bg-[#E4EEF4] dark:hover:bg-[#1C3F62]/50 px-2.5 py-1 rounded-lg transition-colors"
                >
                  <Plus size={13} /> Nouvelle
                </button>
              </div>

              <div className="px-4 pb-4">
                {ordonnances.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => setOrdModalOpen(true)}
                    className="w-full text-center py-6 text-gray-400 dark:text-[#7AAABB] border border-dashed border-gray-200 dark:border-[#1C3F62]/50 rounded-xl hover:border-[#70B1C4] hover:bg-[#F7FAFB] dark:hover:bg-[#0D2038] transition-colors"
                  >
                    <Pill size={22} className="mx-auto mb-2 opacity-30" />
                    <p className="text-xs">Créer une ordonnance médicale ou de lunettes</p>
                  </button>
                ) : (
                  <div className="space-y-2">
                    {ordonnances.map((o) => {
                      const isLun = o.type === 'lunettes'
                      const isLen = o.type === 'lentilles'
                      const OrdIcon = isLun ? Glasses : isLen ? CircleDot : Pill
                      const label = isLun ? 'de lunettes' : isLen ? 'de lentilles' : 'médicale'
                      const summary = isLun
                        ? `OD ${o.verres?.od.sphere || '—'} · OG ${o.verres?.og.sphere || '—'}`
                        : isLen
                          ? `OD ${o.lentilles?.od.puissance || '—'} · OG ${o.lentilles?.og.puissance || '—'}`
                          : `${o.medicaments.length} médicament${o.medicaments.length > 1 ? 's' : ''}`
                      return (
                        <div key={o.id} className="flex items-center gap-3 rounded-xl border border-gray-100 dark:border-[#1C3F62]/40 bg-[#F7FAFB] dark:bg-[#091628] px-3 py-2.5">
                          <div className="w-9 h-9 rounded-lg bg-[#E4EEF4] dark:bg-[#1C3F62] flex items-center justify-center shrink-0">
                            <OrdIcon size={15} className="text-[#3d8fa8] dark:text-[#70B1C4]" />
                          </div>
                          <button type="button" onClick={() => openOrdonnance(o, false)} title="Ouvrir l'ordonnance" className="flex-1 min-w-0 text-left group/ord">
                            <p className="text-sm font-medium text-[#1A2B3C] dark:text-[#EDF8FF] truncate leading-tight group-hover/ord:text-[#3d8fa8] dark:group-hover/ord:text-[#70B1C4] transition-colors">
                              Ordonnance {label}
                            </p>
                            <p className="text-[11px] text-gray-400 dark:text-[#7AAABB]">
                              {format(new Date(o.date_ordonnance), 'dd MMM yyyy', { locale: fr })} · {summary}
                            </p>
                          </button>
                          <button type="button" onClick={() => openOrdonnance(o, false)} title="Ouvrir dans un nouvel onglet"
                            className="p-1.5 rounded-lg text-[#70B1C4] hover:bg-[#E4EEF4] dark:hover:bg-[#1C3F62]/60 transition-colors shrink-0">
                            <ExternalLink size={14} />
                          </button>
                          <button type="button" onClick={() => openOrdonnance(o, true)} title="Imprimer / PDF"
                            className="p-1.5 rounded-lg text-[#70B1C4] hover:bg-[#E4EEF4] dark:hover:bg-[#1C3F62]/60 transition-colors shrink-0">
                            <Printer size={14} />
                          </button>
                          <button type="button" onClick={() => handleDeleteOrdonnance(o.id)} title="Supprimer"
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          </div>{/* ── end right column ── */}

          {/* Consultation history — full width on lg, own column on xl */}
          {!isEditing && (
            <div className="lg:col-span-2 xl:col-span-1 bg-white dark:bg-[#102844] rounded-2xl glow overflow-hidden">
              <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardList size={13} className="text-[#70B1C4]" />
                  <span className="text-[10px] font-bold text-gray-400 dark:text-[#7AAABB] uppercase tracking-widest">Historique des consultations</span>
                </div>
                <span className="text-[10px] font-semibold bg-[#E4EEF4] dark:bg-[#1C3F62] text-[#70B1C4] px-2 py-0.5 rounded-full">
                  {patientAppointments.length} RDV
                </span>
              </div>

              <div className="px-4 pb-4 space-y-3">
                {consultationHistory.length === 0 ? (
                  <div className="text-center py-5 text-gray-400 dark:text-[#7AAABB] border border-dashed border-gray-200 dark:border-[#1C3F62]/50 rounded-xl">
                    <ClipboardList size={26} className="mx-auto mb-2 opacity-30" />
                    <p className="text-xs">Aucun compte-rendu enregistré</p>
                    <p className="text-xs mt-0.5 text-gray-300 dark:text-[#7AAABB]/60">Utilisez le bouton <span className="font-medium">Dossier</span> dans Rendez-vous</p>
                  </div>
                ) : (
                  consultationHistory.map((c) => (
                    <div key={c.id} className="border border-gray-100 dark:border-[#1C3F62]/40 rounded-xl p-3.5 bg-[#F7FAFB] dark:bg-[#091628] hover:bg-white dark:hover:bg-[#0D2038] transition-colors">
                      <div className="flex items-center gap-2 mb-2.5">
                        <div className="w-6 h-6 rounded-lg bg-[#E4EEF4] dark:bg-[#1C3F62] flex items-center justify-center shrink-0">
                          <ClipboardList size={11} className="text-[#70B1C4]" />
                        </div>
                        <span className="text-xs font-bold text-[#1A2B3C] dark:text-[#EDF8FF]">
                          {format(new Date(c.date), 'dd MMM yyyy', { locale: fr })}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-[#7AAABB]">· {c.motif}</span>
                      </div>
                      <div className="space-y-1.5 pl-8">
                        {c.diagnostic && (
                          <div className="flex gap-2">
                            <span className="text-xs font-semibold text-gray-500 dark:text-[#7AAABB] w-20 shrink-0">Diagnostic</span>
                            <span className="text-xs text-gray-700 dark:text-[#B4D0E0]">{c.diagnostic}</span>
                          </div>
                        )}
                        {c.traitement && (
                          <div className="flex gap-2">
                            <span className="text-xs font-semibold text-gray-500 dark:text-[#7AAABB] w-20 shrink-0">Traitement</span>
                            <span className="text-xs text-gray-700 dark:text-[#B4D0E0]">{c.traitement}</span>
                          </div>
                        )}
                        {c.notes && (
                          <div className="flex gap-2">
                            <span className="text-xs font-semibold text-gray-500 dark:text-[#7AAABB] w-20 shrink-0">Notes</span>
                            <span className="text-xs text-gray-700 dark:text-[#B4D0E0]">{c.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
         </div>{/* ── end grid ── */}
        </form>
      </DialogContent>
    </Dialog>

    <OrdonnanceModal open={ordModalOpen} onClose={() => setOrdModalOpen(false)} patient={patient} />
    </>
  )
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

/* ── Helper: one info row that flips between display and edit ── */
function InfoRow({
  icon, isEditing, editContent, displayContent,
}: {
  icon: React.ReactNode
  isEditing: boolean
  editContent: React.ReactNode
  displayContent: React.ReactNode
}) {
  if (isEditing) {
    return (
      <div className="space-y-1">
        <Label className="text-xs text-gray-500 dark:text-[#7AAABB] flex items-center gap-1.5">
          {icon}
        </Label>
        {editContent}
      </div>
    )
  }
  return (
    <div className="flex items-start gap-3 py-1">
      <div className="w-8 h-8 rounded-xl bg-[#E4EEF4] dark:bg-[#1C3F62]/70 flex items-center justify-center shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0 flex items-center h-8">
        {displayContent}
      </div>
    </div>
  )
}
