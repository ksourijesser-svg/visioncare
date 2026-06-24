'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Header } from '@/components/layout/Header'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { User, Building2, Phone, Mail, Globe, MapPin, ShieldCheck, Save } from 'lucide-react'
import { useProfileStore } from '@/store/profileStore'
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
  cabinet_telephone: z.string(),
  cabinet_email:     z.union([z.string().email('Email invalide'), z.literal('')]),
  cabinet_site:      z.string(),
})

type FormData = z.infer<typeof schema>

export default function ProfilPage() {
  const { profile, updateProfile } = useProfileStore()

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

  const initials = `${profile.prenom[0] || '?'}${profile.nom[0] || '?'}`.toUpperCase()

  return (
    <div className="flex flex-col flex-1">
      <Header title="Mon profil" />

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="p-6 space-y-6 max-w-3xl">

          {/* Profile header card */}
          <Card className="border-0 dark:bg-[#102844] overflow-hidden glow">
            <div className="h-24 bg-gradient-to-r from-[#70B1C4] to-[#DCEEF3] dark:from-[#1e6c87] dark:to-[#3d8fa8]" />
            <CardContent className="pt-0 pb-5 px-6">
              <div className="flex items-end gap-4 -mt-10 mb-4">
                <Avatar className="w-20 h-20 border-4 border-white dark:border-[#0F2035] shadow-md">
                  <AvatarFallback className="bg-[#70B1C4] text-white text-2xl font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="pb-1">
                  <h2 className="text-xl font-bold text-[#2D3748] dark:text-[#E2EDF5]">
                    {profile.prenom} {profile.nom}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className="bg-[#DCEEF3] dark:bg-[#1A3A5C] text-[#70B1C4] font-normal text-xs capitalize border-0">
                      Médecin
                    </Badge>
                    {profile.specialite && (
                      <span className="text-xs text-gray-400 dark:text-[#6A8E9F]">{profile.specialite}</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informations personnelles */}
          <Card className="border-0 dark:bg-[#102844] glow">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-[#DCEEF3] dark:bg-[#1A3A5C] flex items-center justify-center">
                  <User size={14} className="text-[#70B1C4]" />
                </div>
                <h3 className="font-semibold text-[#2D3748] dark:text-[#E2EDF5]">Informations personnelles</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500 dark:text-[#6A8E9F]">Prénom *</Label>
                  <Input {...register('prenom')} className="border-0 dark:bg-[#091628] dark:text-[#E2EDF5]" />
                  {errors.prenom && <p className="text-red-500 text-xs">{errors.prenom.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500 dark:text-[#6A8E9F]">Nom *</Label>
                  <Input {...register('nom')} className="border-0 dark:bg-[#091628] dark:text-[#E2EDF5]" />
                  {errors.nom && <p className="text-red-500 text-xs">{errors.nom.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500 dark:text-[#6A8E9F] flex items-center gap-1">
                    <Mail size={11} /> Email *
                  </Label>
                  <Input {...register('email')} type="email" className="border-0 dark:bg-[#091628] dark:text-[#E2EDF5]" />
                  {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500 dark:text-[#6A8E9F] flex items-center gap-1">
                    <Phone size={11} /> Téléphone
                  </Label>
                  <Input {...register('telephone')} className="border-0 dark:bg-[#091628] dark:text-[#E2EDF5]" placeholder="+33 6 00 00 00 00" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500 dark:text-[#6A8E9F]">Spécialité</Label>
                  <Input {...register('specialite')} className="border-0 dark:bg-[#091628] dark:text-[#E2EDF5]" placeholder="Ophtalmologue" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500 dark:text-[#6A8E9F] flex items-center gap-1">
                    <ShieldCheck size={11} /> N° RPPS
                  </Label>
                  <Input {...register('rpps')} className="border-0 dark:bg-[#091628] dark:text-[#E2EDF5]" placeholder="10 chiffres" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mon cabinet */}
          <Card className="border-0 dark:bg-[#102844] glow">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-[#DCEEF3] dark:bg-[#1A3A5C] flex items-center justify-center">
                  <Building2 size={14} className="text-[#70B1C4]" />
                </div>
                <h3 className="font-semibold text-[#2D3748] dark:text-[#E2EDF5]">Mon cabinet</h3>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-gray-500 dark:text-[#6A8E9F]">Nom du cabinet *</Label>
                <Input {...register('cabinet_nom')} className="border-0 dark:bg-[#091628] dark:text-[#E2EDF5]" placeholder="Cabinet VisionCare" />
                {errors.cabinet_nom && <p className="text-red-500 text-xs">{errors.cabinet_nom.message}</p>}
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-gray-500 dark:text-[#6A8E9F] flex items-center gap-1">
                  <MapPin size={11} /> Adresse
                </Label>
                <Input {...register('cabinet_adresse')} className="border-0 dark:bg-[#091628] dark:text-[#E2EDF5]" placeholder="12 rue de la Santé, 75014 Paris" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500 dark:text-[#6A8E9F] flex items-center gap-1">
                    <Phone size={11} /> Téléphone du cabinet
                  </Label>
                  <Input {...register('cabinet_telephone')} className="border-0 dark:bg-[#091628] dark:text-[#E2EDF5]" placeholder="01 00 00 00 00" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500 dark:text-[#6A8E9F] flex items-center gap-1">
                    <Mail size={11} /> Email du cabinet
                  </Label>
                  <Input {...register('cabinet_email')} type="email" className="border-0 dark:bg-[#091628] dark:text-[#E2EDF5]" placeholder="contact@cabinet.fr" />
                  {errors.cabinet_email && <p className="text-red-500 text-xs">{errors.cabinet_email.message}</p>}
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-gray-500 dark:text-[#6A8E9F] flex items-center gap-1">
                  <Globe size={11} /> Site web <span className="text-gray-300 dark:text-[#1A3A5C]">(optionnel)</span>
                </Label>
                <Input {...register('cabinet_site')} className="border-0 dark:bg-[#091628] dark:text-[#E2EDF5]" placeholder="https://www.moncabinet.fr" />
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
