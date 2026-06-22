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
  { value: '500+',   label: 'Médecins actifs' },
  { value: '50 000+', label: 'Rendez-vous gérés' },
  { value: '98%',    label: 'Taux de satisfaction' },
  { value: '< 2h',   label: 'Temps de réponse support' },
]

const SPECIALISATIONS = [
  'Ophtalmologie', 'Cardiologie', 'Dermatologie', 'Médecine générale',
  'Pédiatrie', 'Gynécologie', 'Orthopédie', 'Neurologie', 'Psychiatrie',
]

export default function LandingPage() {
  return (
    <>
      {/* ── Fixed 3D background (always behind everything) ── */}
      <EyeSceneClient />

      {/* ── Page content scrolls over the 3D ── */}
      <div className="relative" style={{ zIndex: 10 }}>

        {/* ── Navigation ── */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-md border-b border-white/10">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#70B1C4] flex items-center justify-center shadow-md shadow-[#70B1C4]/30">
                <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-white">VisionCare</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm font-medium text-white/70 hover:text-white transition-colors px-4 py-2">
                Se connecter
              </Link>
              <Link href="/inscription" className="text-sm font-semibold bg-[#70B1C4] hover:bg-[#5a9db8] text-white px-5 py-2 rounded-xl shadow-md shadow-[#70B1C4]/30 transition-all hover:shadow-lg hover:-translate-y-0.5">
                Essai gratuit
              </Link>
            </div>
          </div>
        </nav>

        {/* ── Hero — transparent, CTA floats over the eye ── */}
        <section className="min-h-screen flex items-center pt-16">
          <div className="max-w-6xl mx-auto px-6 py-24 w-full">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur rounded-full px-4 py-1.5 mb-6 border border-white/10">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-white/80 text-sm font-medium">Plateforme médicale certifiée</span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-6 drop-shadow-lg">
                La plateforme la plus{' '}
                <span className="text-[#70B1C4]">sécurisée</span>{' '}
                pour gérer votre cabinet
              </h1>
              <p className="text-white/65 text-lg leading-relaxed mb-8">
                Patients, rendez-vous, dossiers médicaux — tout centralisé dans une interface simple et élégante.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/inscription" className="inline-flex items-center gap-2 bg-[#70B1C4] hover:bg-[#5a9db8] text-white font-semibold px-8 py-3.5 rounded-xl shadow-lg shadow-[#70B1C4]/40 transition-all hover:-translate-y-0.5 text-base">
                  Créer mon compte gratuitement →
                </Link>
                <Link href="/login" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-medium px-8 py-3.5 rounded-xl backdrop-blur border border-white/10 transition-all text-base">
                  Se connecter
                </Link>
              </div>
              <div className="flex items-center gap-6 mt-10">
                {['Aucune carte requise', 'Installation en 2 min', 'Support inclus'].map((t) => (
                  <div key={t} className="flex items-center gap-1.5 text-white/50 text-sm">
                    <span className="text-green-400">✓</span> {t}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="py-14 bg-black/40 backdrop-blur-md border-y border-white/10">
          <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-bold text-white">{s.value}</p>
                <p className="text-white/45 text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ── */}
        <section className="py-24 bg-[#05090f]/55 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-14">
              <p className="text-[#70B1C4] text-sm font-bold uppercase tracking-widest mb-3">Fonctionnalités</p>
              <h2 className="text-3xl font-bold text-white">Tout ce dont votre cabinet a besoin</h2>
              <p className="text-white/45 mt-3 max-w-xl mx-auto">Une solution complète pensée par des professionnels de santé, pour des professionnels de santé.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map((f) => (
                <div key={f.title} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all hover:-translate-y-0.5 backdrop-blur-sm">
                  <div className="w-12 h-12 rounded-2xl bg-[#70B1C4]/20 border border-[#70B1C4]/30 flex items-center justify-center text-2xl mb-4">{f.icon}</div>
                  <h3 className="font-bold text-white mb-2">{f.title}</h3>
                  <p className="text-white/45 text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Specialisations ── */}
        <section className="py-12 bg-black/40 backdrop-blur-md border-y border-white/10">
          <div className="max-w-5xl mx-auto px-6 text-center">
            <p className="text-white/30 text-sm font-medium mb-6 uppercase tracking-widest">Adapté à toutes les spécialités</p>
            <div className="flex flex-wrap justify-center gap-3">
              {SPECIALISATIONS.map((s) => (
                <span key={s} className="bg-white/5 border border-white/15 text-white/70 text-sm font-medium px-4 py-1.5 rounded-full">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-24 bg-[#05090f]/90 backdrop-blur-md text-center">
          <div className="max-w-2xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-white mb-4">Prêt à moderniser votre cabinet ?</h2>
            <p className="text-white/50 mb-8 text-lg">Créez votre compte en 2 minutes. Aucune installation, aucune carte bancaire requise.</p>
            <Link href="/inscription" className="inline-block bg-[#70B1C4] hover:bg-[#5a9db8] text-white font-bold px-10 py-4 rounded-xl shadow-lg shadow-[#70B1C4]/30 transition-all hover:-translate-y-0.5 text-lg">
              Commencer gratuitement →
            </Link>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="bg-black/60 backdrop-blur-md text-white/30 text-sm py-8 text-center border-t border-white/10">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg bg-[#70B1C4] flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
              </svg>
            </div>
            <span className="text-white/50 font-semibold">VisionCare</span>
          </div>
          <p>© 2026 VisionCare. Tous droits réservés. · Données sécurisées · Conformité RGPD</p>
        </footer>

      </div>
    </>
  )
}
