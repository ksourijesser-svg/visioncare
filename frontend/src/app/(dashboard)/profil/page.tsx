'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Header } from '@/components/layout/Header'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { User, Building2, Phone, Mail, Globe, MapPin, ShieldCheck, Save, Camera, Loader2, Trash2, Star } from 'lucide-react'
import { useProfileStore } from '@/store/profileStore'
import { fileToResizedDataUrl } from '@/lib/image'
import { toast } from 'sonner'

const schema = z.object({
  prenom:            z.string().min(1, 'Requis'),
  nom:               z.string().min(1, 'Requis'),
  email:             z.string().email('Email invalide'),
  telephone:         z.string(),
  specialite:        z.string(),
  rpps:              z.string(),
  cabinet_nom:       z.string().min(1, 'Requis'),
  cabinet_adresse:   z.string(),
  google_maps_url:   z.union([z.string().url('Lien invalide'), z.literal('')]),
  cabinet_telephone: z.string(),
  cabinet_email:     z.union([z.string().email('Email invalide'), z.literal('')]),
  cabinet_site:      z.string(),
})

type FormData = z.infer<typeof schema>

export default function ProfilPage() {
  const { profile, updateProfile } = useProfileStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: profile,
  })

  useEffect(() => {
    reset(profile)
  }, [profile, reset])

  function onSubmit(data: FormData) {
    updateProfile(data)
    reset(data)
    toast.success('Profil mis à jour avec succès')
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Veuillez choisir une image'); return }
    setUploadingPhoto(true)
    try {
      const dataUrl = await fileToResizedDataUrl(file)
      updateProfile({ photo: dataUrl })
      toast.success('Photo mise à jour')
    } catch {
      toast.error("Impossible de charger l'image")
    } finally {
      setUploadingPhoto(false)
    }
  }

  function removePhoto() {
    updateProfile({ photo: '' })
    toast.success('Photo supprimée')
  }

  const initials = `${profile.prenom[0] || '?'}${profile.nom[0] || '?'}`.toUpperCase()

  return (
    <div className="flex flex-col flex-1">
      <Header title="Mon profil" />

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="p-4 sm:p-6 space-y-6 max-w-3xl">

          {/* Profile header card */}
          <Card className="border-0 dark:bg-[#102844] overflow-hidden glow">
            <div className="h-24 bg-gradient-to-r from-[#70B1C4] to-[#DCEEF3] dark:from-[#1e6c87] dark:to-[#3d8fa8]" />
            <CardContent className="pt-0 pb-5 px-6">
              <div className="flex items-end gap-4 -mt-10 mb-4">
                <div className="relative">
                  <Avatar className="w-20 h-20 border-4 border-white dark:border-[#102844] shadow-md">
                    {profile.photo && <AvatarImage src={profile.photo} alt="Photo de profil" className="object-cover" />}
                    <AvatarFallback className="bg-[#70B1C4] text-white text-2xl font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    title="Changer la photo"
                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#70B1C4] hover:bg-[#5a9db8] text-white flex items-center justify-center shadow-md border-2 border-white dark:border-[#102844] transition-colors disabled:opacity-60"
                  >
                    {uploadingPhoto ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                </div>
                <div className="pb-1">
                  <h2 className="text-xl font-bold text-[#2D3748] dark:text-[#EDF8FF]">
                    {profile.prenom} {profile.nom}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className="bg-[#DCEEF3] dark:bg-[#1C3F62] text-[#70B1C4] font-normal text-xs capitalize border-0">
                      Médecin
                    </Badge>
                    {profile.specialite && (
                      <span className="text-xs text-gray-400 dark:text-[#7AAABB]">{profile.specialite}</span>
                    )}
                  </div>
                  {profile.photo && (
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="mt-1.5 inline-flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 dark:text-[#7AAABB] transition-colors"
                    >
                      <Trash2 size={11} /> Supprimer la photo
                    </button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informations personnelles */}
          <Card className="border-0 dark:bg-[#102844] glow">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-[#DCEEF3] dark:bg-[#1C3F62] flex items-center justify-center">
                  <User size={14} className="text-[#70B1C4]" />
                </div>
                <h3 className="font-semibold text-[#2D3748] dark:text-[#EDF8FF]">Informations personnelles</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500 dark:text-[#7AAABB]">Prénom *</Label>
                  <Input {...register('prenom')} className="border border-gray-200 dark:border-[#1C3F62]/50 dark:bg-[#091628] dark:text-[#EDF8FF] dark:placeholder:text-[#7AAABB]" />
                  {errors.prenom && <p className="text-red-500 text-xs">{errors.prenom.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500 dark:text-[#7AAABB]">Nom *</Label>
                  <Input {...register('nom')} className="border border-gray-200 dark:border-[#1C3F62]/50 dark:bg-[#091628] dark:text-[#EDF8FF] dark:placeholder:text-[#7AAABB]" />
                  {errors.nom && <p className="text-red-500 text-xs">{errors.nom.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500 dark:text-[#7AAABB] flex items-center gap-1">
                    <Mail size={11} /> Email *
                  </Label>
                  <Input {...register('email')} type="email" className="border border-gray-200 dark:border-[#1C3F62]/50 dark:bg-[#091628] dark:text-[#EDF8FF] dark:placeholder:text-[#7AAABB]" />
                  {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500 dark:text-[#7AAABB] flex items-center gap-1">
                    <Phone size={11} /> Téléphone
                  </Label>
                  <Input {...register('telephone')} className="border border-gray-200 dark:border-[#1C3F62]/50 dark:bg-[#091628] dark:text-[#EDF8FF] dark:placeholder:text-[#7AAABB]" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500 dark:text-[#7AAABB]">Spécialité</Label>
                  <Input {...register('specialite')} className="border border-gray-200 dark:border-[#1C3F62]/50 dark:bg-[#091628] dark:text-[#EDF8FF] dark:placeholder:text-[#7AAABB]" placeholder="Ophtalmologue" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500 dark:text-[#7AAABB] flex items-center gap-1">
                    <ShieldCheck size={11} /> N° RPPS
                  </Label>
                  <Input {...register('rpps')} className="border border-gray-200 dark:border-[#1C3F62]/50 dark:bg-[#091628] dark:text-[#EDF8FF] dark:placeholder:text-[#7AAABB]" placeholder="10 chiffres" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mon cabinet */}
          <Card className="border-0 dark:bg-[#102844] glow">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-[#DCEEF3] dark:bg-[#1C3F62] flex items-center justify-center">
                  <Building2 size={14} className="text-[#70B1C4]" />
                </div>
                <h3 className="font-semibold text-[#2D3748] dark:text-[#EDF8FF]">Mon cabinet</h3>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-gray-500 dark:text-[#7AAABB]">Nom du cabinet *</Label>
                <Input {...register('cabinet_nom')} className="border border-gray-200 dark:border-[#1C3F62]/50 dark:bg-[#091628] dark:text-[#EDF8FF] dark:placeholder:text-[#7AAABB]" placeholder="Cabinet VisionCare" />
                {errors.cabinet_nom && <p className="text-red-500 text-xs">{errors.cabinet_nom.message}</p>}
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-gray-500 dark:text-[#7AAABB] flex items-center gap-1">
                  <MapPin size={11} /> Adresse
                </Label>
                <Input {...register('cabinet_adresse')} className="border border-gray-200 dark:border-[#1C3F62]/50 dark:bg-[#091628] dark:text-[#EDF8FF] dark:placeholder:text-[#7AAABB]" placeholder="12 rue de la Santé, 75014 Paris" />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-gray-500 dark:text-[#7AAABB] flex items-center gap-1">
                  <Star size={11} /> Lien Google Maps (avis)
                </Label>
                <Input {...register('google_maps_url')} className="border border-gray-200 dark:border-[#1C3F62]/50 dark:bg-[#091628] dark:text-[#EDF8FF] dark:placeholder:text-[#7AAABB]" placeholder="https://maps.app.goo.gl/..." />
                {errors.google_maps_url && <p className="text-red-500 text-xs">{errors.google_maps_url.message}</p>}
                <p className="text-xs text-gray-400 dark:text-[#5E8BA8]">
                  Collez le lien « Partager » de votre fiche Google Maps. Vos patients pourront consulter vos avis.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500 dark:text-[#7AAABB] flex items-center gap-1">
                    <Phone size={11} /> Téléphone du cabinet
                  </Label>
                  <Input {...register('cabinet_telephone')} className="border border-gray-200 dark:border-[#1C3F62]/50 dark:bg-[#091628] dark:text-[#EDF8FF] dark:placeholder:text-[#7AAABB]" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500 dark:text-[#7AAABB] flex items-center gap-1">
                    <Mail size={11} /> Email du cabinet
                  </Label>
                  <Input {...register('cabinet_email')} type="email" className="border border-gray-200 dark:border-[#1C3F62]/50 dark:bg-[#091628] dark:text-[#EDF8FF] dark:placeholder:text-[#7AAABB]" placeholder="contact@cabinet.fr" />
                  {errors.cabinet_email && <p className="text-red-500 text-xs">{errors.cabinet_email.message}</p>}
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-gray-500 dark:text-[#7AAABB] flex items-center gap-1">
                  <Globe size={11} /> Site web <span className="text-gray-300 dark:text-[#1A3A5C]">(optionnel)</span>
                </Label>
                <Input {...register('cabinet_site')} className="border border-gray-200 dark:border-[#1C3F62]/50 dark:bg-[#091628] dark:text-[#EDF8FF] dark:placeholder:text-[#7AAABB]" placeholder="https://www.moncabinet.fr" />
              </div>
            </CardContent>
          </Card>

          {/* Save button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={!isDirty}
              className="bg-[#70B1C4] hover:bg-[#5a9db8] text-white px-8 disabled:opacity-50 btn-neon"
            >
              <Save size={15} className="mr-2" />
              Enregistrer les modifications
            </Button>
          </div>

        </div>
      </form>
    </div>
  )
}
