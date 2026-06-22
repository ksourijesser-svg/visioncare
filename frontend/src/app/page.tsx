import Link from 'next/link'

const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Sécurité maximale',
    desc: 'Chiffrement 256-bit, authentification JWT et conformité totale avec les normes médicales françaises.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
        <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round"/>
        <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round"/>
        <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" strokeLinecap="round" strokeWidth={2.5}/>
      </svg>
    ),
    title: 'Agenda intelligent',
    desc: 'Calendrier mensuel, hebdomadaire et journalier avec rappels automatiques et gestion des statuts.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Dossiers médicaux',
    desc: 'Historique complet, diagnostics, traitements et ordonnances centralisés en un seul endroit.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
        <path d="M18 20V10M12 20V4M6 20v-6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Tableau de bord',
    desc: 'Statistiques en temps réel, évolution de votre activité et indicateurs de performance.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 8v4l3 3" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Support 24h/24',
    desc: 'Notre équipe répond en moins de 2h, 7j/7, pour résoudre chaque problème rapidement.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <path d="M8 21h8M12 17v4" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Multi-appareils',
    desc: 'Accédez à votre cabinet depuis n\'importe quel ordinateur, tablette ou smartphone, sans installation.',
  },
]

const STATS = [
  { value: '500+',    label: 'Médecins actifs' },
  { value: '50 000+', label: 'Rendez-vous gérés' },
  { value: '98%',     label: 'Satisfaction client' },
  { value: '< 2h',    label: 'Temps de réponse' },
]

const SPECIALISATIONS = [
  'Ophtalmologie', 'Cardiologie', 'Dermatologie', 'Médecine générale',
  'Pédiatrie', 'Gynécologie', 'Orthopédie', 'Neurologie', 'Psychiatrie',
]

const STEPS = [
  { n: '01', title: 'Créez votre compte',    desc: 'Inscription en 2 minutes, aucune carte bancaire requise.' },
  { n: '02', title: 'Configurez votre cabinet', desc: 'Ajoutez vos informations, votre spécialité et votre équipe.' },
  { n: '03', title: 'Gérez vos patients',    desc: 'Prenez des rendez-vous, rédigez des dossiers, suivez vos stats.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen text-[#1A2B3C]">

      {/* ── Navigation ─────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#060F1E]/85 backdrop-blur-md border-b border-white/8">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#3d8fa8] flex items-center justify-center shadow-md shadow-[#3d8fa8]/40">
              <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
              </svg>
            </div>
            <span className="text-lg font-bold text-white">VisionCare</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/55">
            <a href="#fonctionnalites" className="hover:text-white transition-colors">Fonctionnalités</a>
            <a href="#comment" className="hover:text-white transition-colors">Comment ça marche</a>
            <a href="#specialites" className="hover:text-white transition-colors">Spécialités</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/prise-rdv" className="btn-neon hidden md:inline-flex items-center gap-1.5 text-sm font-semibold border border-[#3d8fa8]/50 hover:border-[#3d8fa8] text-[#70B1C4] hover:text-white px-4 py-2 rounded-xl hover:bg-[#3d8fa8]/15">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
              </svg>
              Prendre RDV
            </Link>
            <Link href="/login" className="text-sm font-medium text-white/60 hover:text-white transition-colors px-4 py-2">
              Se connecter
            </Link>
            <Link href="/inscription" className="btn-neon text-sm font-semibold bg-[#3d8fa8] hover:bg-[#2d7a94] text-white px-5 py-2.5 rounded-xl shadow-lg shadow-[#3d8fa8]/30">
              Essai gratuit
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="pt-32 pb-24 px-6 relative overflow-hidden bg-[#060F1E]">
        {/* Dot grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(112,177,196,0.14) 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}
        />

        {/* Gradient orbs */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: '-180px', right: '-80px',
            width: '700px', height: '700px',
            background: 'radial-gradient(circle, rgba(61,143,168,0.22) 0%, transparent 65%)',
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: '-120px', left: '-60px',
            width: '500px', height: '500px',
            background: 'radial-gradient(circle, rgba(112,177,196,0.16) 0%, transparent 65%)',
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            top: '40%', left: '35%',
            width: '350px', height: '350px',
            background: 'radial-gradient(circle, rgba(29,100,140,0.12) 0%, transparent 70%)',
          }}
        />

        {/* Horizontal accent line */}
        <div
          className="absolute left-0 right-0 pointer-events-none"
          style={{
            top: '42%', height: '1px',
            background: 'linear-gradient(to right, transparent 5%, rgba(112,177,196,0.15) 40%, rgba(112,177,196,0.15) 60%, transparent 95%)',
          }}
        />

        <div className="max-w-6xl mx-auto relative">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/8 border border-white/12 text-white/80 text-sm font-semibold rounded-full px-4 py-1.5 mb-6 backdrop-blur-sm">
              <span className="w-2 h-2 bg-[#70B1C4] rounded-full animate-pulse" />
              Support 7j/7 — Réponse en moins de 2h
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Prenez soin de vos{' '}
              <span className="text-[#70B1C4]">patients</span>
              {'. '}
              On s&apos;occupe du reste.
            </h1>

            <p className="text-lg text-white/60 leading-relaxed mb-10">
              Rendez-vous en ligne, dossiers médicaux, agenda intelligent — tout centralisé
              pour les médecins, les secrétaires et les patients.
            </p>

            <div className="flex flex-wrap gap-4 mb-10">
              <Link href="/inscription" className="btn-neon inline-flex items-center gap-2 bg-[#3d8fa8] hover:bg-[#2d7a94] text-white font-semibold px-8 py-3.5 rounded-xl shadow-lg shadow-[#3d8fa8]/35">
                Commencer gratuitement →
              </Link>
              <Link href="/login" className="btn-neon-outline inline-flex items-center gap-2 border border-white/18 hover:border-white/35 bg-white/6 hover:bg-white/10 text-white font-medium px-8 py-3.5 rounded-xl backdrop-blur-sm">
                Voir la démo
              </Link>
            </div>

            <div className="flex items-center gap-6 flex-wrap">
              {['Aucune carte requise', 'Installation en 2 min', 'Support inclus'].map((t) => (
                <div key={t} className="flex items-center gap-1.5 text-white/45 text-sm">
                  <svg className="w-4 h-4 text-[#70B1C4]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {t}
                </div>
              ))}
            </div>

            {/* Patient CTA */}
            <div className="mt-8 pt-8 border-t border-white/10">
              <p className="text-white/45 text-sm mb-3">Vous êtes patient ?</p>
              <Link
                href="/prise-rdv"
                className="btn-neon-outline inline-flex items-center gap-2.5 bg-white/8 hover:bg-white/14 border border-white/15 hover:border-[#70B1C4]/40 text-white font-medium px-6 py-3 rounded-xl backdrop-blur-sm text-sm"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-[#70B1C4]">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                </svg>
                Prendre un rendez-vous en ligne
                <span className="text-[#70B1C4]">→</span>
              </Link>
            </div>
          </div>

          {/* Dashboard preview card */}
          <div className="absolute right-0 top-0 w-[480px] hidden lg:block">
            <div className="bg-[#0D1E30] rounded-2xl shadow-2xl shadow-black/40 border border-white/10 overflow-hidden">
              {/* Mock top bar */}
              <div className="h-10 bg-[#0A1828] flex items-center px-4 gap-2 border-b border-white/6">
                <div className="w-3 h-3 rounded-full bg-red-400/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-400/70" />
                <div className="w-3 h-3 rounded-full bg-green-400/70" />
                <div className="flex-1 mx-4 h-5 bg-white/8 rounded-md" />
              </div>
              {/* Mock dashboard */}
              <div className="p-5 bg-[#0D1E30]">
                {/* Stat row */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[['24', 'Patients'], ['8', 'RDV aujourd\'hui'], ['3', 'En attente']].map(([v, l]) => (
                    <div key={l} className="bg-white/8 border border-white/10 rounded-xl p-3">
                      <p className="text-xl font-bold text-white">{v}</p>
                      <p className="text-[10px] text-white/45 mt-0.5">{l}</p>
                    </div>
                  ))}
                </div>
                {/* Mock chart */}
                <div className="bg-white/6 border border-white/8 rounded-xl p-4 mb-4">
                  <div className="flex items-end gap-2 h-20">
                    {[40, 65, 55, 80, 70, 90, 75].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t-sm"
                        style={{ height: `${h}%`, background: i === 5 ? '#3d8fa8' : 'rgba(112,177,196,0.25)' }}
                      />
                    ))}
                  </div>
                </div>
                {/* Mock list */}
                <div className="bg-white/6 border border-white/8 rounded-xl p-3 space-y-2">
                  {['Martin Dupont — 09:00', 'Claire Bernard — 09:30', 'Paul Richard — 10:00'].map((r) => (
                    <div key={r} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#3d8fa8]/30 flex items-center justify-center text-[10px] font-bold text-[#70B1C4]">
                          {r[0]}
                        </div>
                        <span className="text-xs text-white/65">{r}</span>
                      </div>
                      <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full font-medium border border-emerald-400/20">Confirmé</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────────────────────────────── */}
      <section className="py-14 border-y border-white/6 bg-[#081220]">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-bold text-white">{s.value}</p>
              <p className="text-sm text-white/45 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────────── */}
      <section id="fonctionnalites" className="py-24 bg-[#F0F6FA]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="text-[#3d8fa8] text-sm font-bold uppercase tracking-widest">Fonctionnalités</span>
            <h2 className="text-3xl font-bold text-[#1A2B3C] mt-3">Tout ce dont votre cabinet a besoin</h2>
            <p className="text-[#1A2B3C]/65 mt-3 max-w-xl mx-auto">
              Une solution complète pensée par des professionnels de santé.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 shadow-md border border-gray-200/80 hover:shadow-lg hover:-translate-y-0.5 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-[#3d8fa8]/12 text-[#3d8fa8] flex items-center justify-center mb-4 group-hover:bg-[#3d8fa8] group-hover:text-white transition-colors">
                  {f.icon}
                </div>
                <h3 className="font-bold text-[#1A2B3C] mb-2">{f.title}</h3>
                <p className="text-sm text-[#1A2B3C]/65 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────────────── */}
      <section id="comment" className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="text-[#3d8fa8] text-sm font-bold uppercase tracking-widest">Simple & Rapide</span>
            <h2 className="text-3xl font-bold text-[#1A2B3C] mt-3">Démarrez en 3 étapes</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((s, i) => (
              <div key={s.n} className="relative text-center">
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px bg-gradient-to-r from-[#3d8fa8]/50 to-transparent" />
                )}
                <div className="btn-neon w-16 h-16 rounded-2xl bg-[#3d8fa8] text-white text-xl font-bold flex items-center justify-center mx-auto mb-5 shadow-lg shadow-[#3d8fa8]/35 cursor-default">
                  {s.n}
                </div>
                <h3 className="font-bold text-[#1A2B3C] text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-[#1A2B3C]/65 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Specialisations ────────────────────────────────────────────────── */}
      <section id="specialites" className="py-14 bg-[#F0F6FA] border-y border-gray-200">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-[#1A2B3C]/55 text-sm font-medium mb-6 uppercase tracking-widest">Adapté à toutes les spécialités</p>
          <div className="flex flex-wrap justify-center gap-3">
            {SPECIALISATIONS.map((s) => (
              <span key={s} className="bg-white border border-gray-300 text-[#1A2B3C]/75 text-sm font-medium px-4 py-1.5 rounded-full hover:border-[#3d8fa8]/60 hover:text-[#3d8fa8] transition-colors cursor-default shadow-sm">
                {s}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-gradient-to-br from-[#0A1828] to-[#1a3a5c] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(112,177,196,0.08) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <div
          className="absolute -top-32 -right-32 w-96 h-96 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(61,143,168,0.18) 0%, transparent 70%)' }}
        />
        <div className="max-w-2xl mx-auto px-6 text-center relative">
          <h2 className="text-3xl font-bold text-white mb-4">Prêt à moderniser votre cabinet ?</h2>
          <p className="text-white/60 mb-8 text-lg">
            Créez votre compte en 2 minutes. Aucune installation, aucune carte bancaire requise.
          </p>
          <Link href="/inscription" className="btn-neon inline-block bg-[#3d8fa8] hover:bg-[#2d7a94] text-white font-bold px-10 py-4 rounded-xl shadow-xl shadow-[#3d8fa8]/35 text-lg">
            Commencer gratuitement →
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="bg-[#060F1E] text-white/40 text-sm py-10 border-t border-white/6">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#3d8fa8] flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
              </svg>
            </div>
            <span className="text-white/65 font-semibold text-base">VisionCare</span>
          </div>
          <p>© 2026 VisionCare. Tous droits réservés. · Données sécurisées · Conformité RGPD</p>
          <div className="flex items-center gap-6 text-white/40">
            <a href="#" className="hover:text-white/70 transition-colors">Confidentialité</a>
            <a href="#" className="hover:text-white/70 transition-colors">CGU</a>
            <a href="#" className="hover:text-white/70 transition-colors">Contact</a>
          </div>
        </div>
      </footer>

    </div>
  )
}
