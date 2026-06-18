import { create } from 'zustand'
import { getUser, setUser } from '@/lib/auth'

export interface Profile {
  prenom: string
  nom: string
  email: string
  telephone: string
  specialite: string
  rpps: string
  cabinet_nom: string
  cabinet_adresse: string
  cabinet_telephone: string
  cabinet_email: string
  cabinet_site: string
}

function loadProfile(): Profile {
  const user = getUser()
  let extra: Partial<Profile> = {}
  if (typeof window !== 'undefined') {
    try { extra = JSON.parse(localStorage.getItem('profile_extra') || '{}') } catch {}
  }
  return {
    prenom:            user?.prenom          || '',
    nom:               user?.nom             || '',
    email:             user?.email           || '',
    telephone:         user?.telephone       || '',
    specialite:        extra.specialite      || 'Ophtalmologue',
    rpps:              extra.rpps            || '',
    cabinet_nom:       user?.cabinet         || 'Cabinet VisionCare',
    cabinet_adresse:   extra.cabinet_adresse || '',
    cabinet_telephone: extra.cabinet_telephone || '',
    cabinet_email:     extra.cabinet_email   || '',
    cabinet_site:      extra.cabinet_site    || '',
  }
}

interface ProfileStore {
  profile: Profile
  updateProfile: (data: Partial<Profile>) => void
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
  profile: loadProfile(),

  updateProfile: (data) => {
    const updated = { ...get().profile, ...data }
    set({ profile: updated })

    const user = getUser()
    if (user) {
      setUser({
        ...user,
        prenom:    updated.prenom,
        nom:       updated.nom,
        email:     updated.email,
        telephone: updated.telephone,
        cabinet:   updated.cabinet_nom,
      })
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('profile_extra', JSON.stringify({
        specialite:        updated.specialite,
        rpps:              updated.rpps,
        cabinet_adresse:   updated.cabinet_adresse,
        cabinet_telephone: updated.cabinet_telephone,
        cabinet_email:     updated.cabinet_email,
        cabinet_site:      updated.cabinet_site,
      }))
    }
  },
}))
