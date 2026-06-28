import { create } from 'zustand'
import { getUser, setUser } from '@/lib/auth'
import { authApi } from '@/lib/api'

export interface Profile {
  prenom: string
  nom: string
  email: string
  telephone: string
  specialite: string
  rpps: string
  photo: string            // base64 data URL — shown on the public booking page
  cabinet_nom: string
  cabinet_adresse: string  // persisted to backend (users.adresse) → public booking map
  google_maps_url: string  // persisted to backend → "Avis Google" button on booking page
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
    specialite:        user?.specialisation  || extra.specialite || 'Ophtalmologue',
    rpps:              extra.rpps            || '',
    photo:             user?.photo           || '',
    cabinet_nom:       user?.cabinet         || 'Cabinet VisionCare',
    cabinet_adresse:   user?.adresse         || extra.cabinet_adresse || '',
    google_maps_url:   user?.google_maps_url || extra.google_maps_url || '',
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
        prenom:        updated.prenom,
        nom:           updated.nom,
        email:         updated.email,
        telephone:     updated.telephone,
        cabinet:       updated.cabinet_nom,
        specialisation: updated.specialite,
        adresse:       updated.cabinet_adresse,
        photo:         updated.photo,
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

      // Persist the fields the public booking page needs to the backend so a
      // patient sees the same photo / address the doctor set here.
      authApi.updateMe({
        nom:            updated.nom,
        prenom:         updated.prenom,
        telephone:      updated.telephone,
        cabinet:        updated.cabinet_nom,
        specialisation: updated.specialite,
        adresse:        updated.cabinet_adresse,
        photo:          updated.photo,
      }).catch(() => { /* non-blocking — localStorage already updated */ })
    }
  },
}))
