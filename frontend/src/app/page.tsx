import Link from 'next/link'
import EyeSceneClient from '@/components/eye/EyeSceneClient'

const FEATURES = [
  { icon: '🔒', title: 'Sécurité maximale', desc: 'Chiffrement 256-bit, authentification JWT et données hébergées en conformité totale avec les normes médicales.' },
  { icon: '🕐', title: 'Support 7j/7 – 24h/24', desc: 'Notre équipe est disponible à tout moment pour vous accompagner et résoudre chaque problème en moins de 2h.' },
  { icon: '📋', title: 'Dossiers médicaux complets', desc: 'Historique, diagnostics, traitements et ordonnances centralisés en un seul endroit, accessibles en un clic.' },
  { icon: '📅', title: 'Agenda intelligent', desc: 'Calendrier mensuel, hebdomadaire et journalier avec gestion des statuts et rappels automatiques.' },
  { icon: '📊', title: 'Tableau de bord analytique', desc: "Visualisez vos statistiques, l'évolution de votre activité et vos performances en temps réel." },
  { icon: '☁️', title: 'Accès depuis partout', desc: 'Aucune installation requise. Connectez-vous depuis votre ordinateur, tablette ou smartphone à tout moment.' },
]

const STATS = [
  { value: '500+', label: 'Médecins actifs' },
  { value: '50 000+', label: 'Rendez-vous gérés' },
  { value: '98%', label: 'Taux de satisfaction' },
  { value: '< 2h', label: 'Temps de réponse support' },
]

const SPECIALISATIONS = [
  'Ophtalmologie', 'Cardiologie', 'Dermatologie', 'Médecine générale',
  'Pédiatrie', 'Gynécologie', 'Orthopédie', 'Neurologie', 'Psychiatrie',
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── Navigation ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#70B1C4] flex items-center justify-center shadow-md shadow-[#70B1C4]/30">
              <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-[#1A2B3C]">VisionCare</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-[#70B1C4] transition-colors px-4 py-2">
              Se connecter
            </Link>
            <Link href="/inscription" className="text-sm font-semibold bg-[#70B1C4] hover:bg-[#5a9db8] text-white px-5 py-2 rounded-xl shadow-md shadow-[#70B1C4]/30 transition-all hover:shadow-lg hover:-translate-y-0.5">
              Essai gratuit
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-16 bg-gradient-to-br from-[#0f2d3d] via-[#1a4a5e] to-[#2d7a94] min-h-[92vh] flex items-center relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-20 right-10 w-96 h-96 bg-[#70B1C4]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-0 w-72 h-72 bg-[#70B1C4]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 py-24 grid lg:grid-cols-2 gap-16 items-center relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-white/80 text-sm font-medium">Plateforme médicale certifiée</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
              La plateforme la plus{' '}
              <span className="text-[#70B1C4]">sécurisée</span> pour gérer votre cabinet
            </h1>
            <p className="text-white/70 text-lg leading-relaxed mb-8">
              Patients, rendez-vous, dossiers médicaux — tout centralisé dans une interface simple et élégante.
              Rejoignez des centaines de médecins qui font confiance à VisionCare.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/inscription" className="inline-flex items-center gap-2 bg-[#70B1C4] hover:bg-[#5a9db8] text-white font-semibold px-8 py-3.5 rounded-xl shadow-lg shadow-[#70B1C4]/40 transition-all hover:-translate-y-0.5 text-base">
                Créer mon compte gratuitement →
              </Link>
              <Link href="/login" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-medium px-8 py-3.5 rounded-xl backdrop-blur transition-all text-base">
                Déjà inscrit ? Se connecter
              </Link>
            </div>
            <div className="flex items-center gap-6 mt-10">
              {['Aucune carte requise', 'Installation en 2 min', 'Support inclus'].map((t) => (
                <div key={t} className="flex items-center gap-1.5 text-white/60 text-sm">
                  <span className="text-green-400">✓</span> {t}
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard preview card */}
          <div className="hidden lg:block">
            <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-6 shadow-2xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="text-white/40 text-xs ml-2">VisionCare Dashboard</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[['12', 'Patients aujourd\'hui'], ['3', 'En attente'], ['8', 'Confirmés'], ['1', 'Annulé']].map(([v, l]) => (
                  <div key={l} className="bg-white/10 rounded-2xl p-3">
                    <p className="text-2xl font-bold text-white">{v}</p>
                    <p className="text-white/50 text-xs mt-0.5">{l}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {['Sophie Martin — 09:00 — Bilan visuel', 'Ahmed Benali — 10:30 — Contrôle', 'Marie Dupont — 11:00 — Consultation'].map((rdv) => (
                  <div key={rdv} className="bg-white/10 rounded-xl px-3 py-2.5 text-white/70 text-xs flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#70B1C4] rounded-full shrink-0" />
                    {rdv}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-[#F7FAFB] py-14 border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-bold text-[#1A2B3C]">{s.value}</p>
              <p className="text-gray-500 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <p className="text-[#70B1C4] text-sm font-bold uppercase tracking-widest mb-3">Fonctionnalités</p>
          <h2 className="text-3xl font-bold text-[#1A2B3C]">Tout ce dont votre cabinet a besoin</h2>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto">Une solution complète pensée par des professionnels de santé, pour des professionnels de santé.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-6 hover:-translate-y-0.5">
              <div className="w-12 h-12 rounded-2xl bg-[#E4EEF4] flex items-center justify-center text-2xl mb-4">{f.icon}</div>
              <h3 className="font-bold text-[#1A2B3C] mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Specialisations banner ── */}
      <section className="bg-[#F7FAFB] py-12 border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-gray-400 text-sm font-medium mb-6 uppercase tracking-widest">Adapté à toutes les spécialités</p>
          <div className="flex flex-wrap justify-center gap-3">
            {SPECIALISATIONS.map((s) => (
              <span key={s} className="bg-white border border-[#DCEEF3] text-[#3d8fa8] text-sm font-medium px-4 py-1.5 rounded-full shadow-sm">
                {s}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 bg-gradient-to-br from-[#0f2d3d] to-[#2d7a94] text-center">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-white mb-4">Prêt à moderniser votre cabinet ?</h2>
          <p className="text-white/70 mb-8 text-lg">Créez votre compte en 2 minutes. Aucune installation, aucune carte bancaire requise.</p>
          <Link href="/inscription" className="inline-block bg-[#70B1C4] hover:bg-[#5a9db8] text-white font-bold px-10 py-4 rounded-xl shadow-lg shadow-[#70B1C4]/30 transition-all hover:-translate-y-0.5 text-lg">
            Commencer gratuitement →
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#0f2d3d] text-white/40 text-sm py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-lg bg-[#70B1C4] flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5">
              <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
            </svg>
          </div>
          <span className="text-white/60 font-semibold">VisionCare</span>
        </div>
        <p>© 2026 VisionCare. Tous droits réservés. · Données sécurisées · Conformité RGPD</p>
      </footer>
    </div>
  )
}
