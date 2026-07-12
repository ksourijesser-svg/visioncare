/**
 * Builds a printable French ophthalmology prescription (ordonnance) and opens
 * the browser print dialog. No dependency — clean print-styled HTML.
 *   - medicale : list of medications (médicament, posologie, durée, instructions)
 *   - lunettes : optical refraction table OD/OG (sphère, cylindre, axe, addition)
 */

export interface OrdonnanceMedicament {
  medicament: string
  posologie?: string
  duree?: string
  instructions?: string
}

export interface OrdonnanceEye {
  sphere?: string
  cylindre?: string
  axe?: string
  addition?: string
}

export interface OrdonnanceLensEye {
  puissance?: string
  rayon?: string
  diametre?: string
}

export interface OrdonnanceDoc {
  type: 'medicale' | 'lunettes' | 'lentilles'
  date_ordonnance: string
  medicaments: OrdonnanceMedicament[]
  verres: { type_correction?: string; ecart_pupillaire?: string; od: OrdonnanceEye; og: OrdonnanceEye } | null
  lentilles?: { type_lentille?: string; rythme_port?: string; produit_entretien?: string; od: OrdonnanceLensEye; og: OrdonnanceLensEye } | null
  notes?: string
  patient: { prenom: string; nom: string; age: number | null; date_naissance?: string }
  doctor: {
    prenom: string; nom: string; specialite?: string; rpps?: string
    cabinet_nom?: string; cabinet_adresse?: string; cabinet_telephone?: string; cabinet_email?: string
  }
}

function esc(s: string | undefined | null): string {
  if (!s) return ''
  return s.replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string
  ))
}

function frDate(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

const CORRECTION_LABEL: Record<string, string> = {
  loin: 'Vision de loin',
  pres: 'Vision de près',
  progressif: 'Verres progressifs',
}

const LENS_TYPE_LABEL: Record<string, string> = {
  souple: 'Souple',
  rigide: 'Rigide (LRPG)',
}

const RYTHME_LABEL: Record<string, string> = {
  journalier: 'Journalière',
  hebdomadaire: 'Hebdomadaire',
  mensuel: 'Mensuelle',
  trimestriel: 'Trimestrielle',
  annuel: 'Annuelle',
}

function eyeRow(label: string, e: OrdonnanceEye): string {
  const cell = (v?: string) => `<td>${esc(v) || '—'}</td>`
  return `<tr><th>${esc(label)}</th>${cell(e.sphere)}${cell(e.cylindre)}${cell(e.axe)}${cell(e.addition)}</tr>`
}

function lensRow(label: string, e: OrdonnanceLensEye): string {
  const cell = (v?: string) => `<td>${esc(v) || '—'}</td>`
  return `<tr><th>${esc(label)}</th>${cell(e.puissance)}${cell(e.rayon)}${cell(e.diametre)}</tr>`
}

export function exportOrdonnancePdf(data: OrdonnanceDoc, opts?: { autoPrint?: boolean }): boolean {
  const autoPrint = opts?.autoPrint ?? true
  const title = data.type === 'medicale'
    ? 'Ordonnance médicale'
    : data.type === 'lentilles'
      ? 'Ordonnance de lentilles'
      : 'Ordonnance de lunettes'

  let body: string
  if (data.type === 'medicale') {
    const meds = data.medicaments.filter((m) => (m.medicament || '').trim())
    body = meds.length
      ? `<ol class="meds">${meds.map((m) => `
          <li>
            <div class="med-name">${esc(m.medicament)}</div>
            ${m.posologie ? `<div class="med-line"><span>Posologie :</span> ${esc(m.posologie)}</div>` : ''}
            ${m.duree ? `<div class="med-line"><span>Durée :</span> ${esc(m.duree)}</div>` : ''}
            ${m.instructions ? `<div class="med-line"><span>Instructions :</span> ${esc(m.instructions)}</div>` : ''}
          </li>`).join('')}</ol>`
      : `<p class="empty">Aucun médicament.</p>`
  } else if (data.type === 'lentilles') {
    const l = data.lentilles
    body = l
      ? `
        <p class="corr"><strong>Lentilles ${esc(LENS_TYPE_LABEL[l.type_lentille || ''] || l.type_lentille || '')}</strong>${l.rythme_port ? ` · Renouvellement : ${esc(RYTHME_LABEL[l.rythme_port] || l.rythme_port)}` : ''}</p>
        <table class="rx">
          <thead><tr><th></th><th>Puissance</th><th>Rayon (mm)</th><th>Diamètre (mm)</th></tr></thead>
          <tbody>
            ${lensRow('Œil droit (OD)', l.od)}
            ${lensRow('Œil gauche (OG)', l.og)}
          </tbody>
        </table>
        ${l.produit_entretien ? `<p class="ep">Produit d'entretien : <strong>${esc(l.produit_entretien)}</strong></p>` : ''}`
      : `<p class="empty">Aucune mesure.</p>`
  } else {
    const v = data.verres
    body = v
      ? `
        ${v.type_correction ? `<p class="corr"><strong>${esc(CORRECTION_LABEL[v.type_correction] || v.type_correction)}</strong></p>` : ''}
        <table class="rx">
          <thead><tr><th></th><th>Sphère</th><th>Cylindre</th><th>Axe (°)</th><th>Addition</th></tr></thead>
          <tbody>
            ${eyeRow('Œil droit (OD)', v.od)}
            ${eyeRow('Œil gauche (OG)', v.og)}
          </tbody>
        </table>
        ${v.ecart_pupillaire ? `<p class="ep">Écart pupillaire : <strong>${esc(v.ecart_pupillaire)} mm</strong></p>` : ''}`
      : `<p class="empty">Aucune mesure.</p>`
  }

  const cab = [data.doctor.cabinet_adresse, data.doctor.cabinet_telephone, data.doctor.cabinet_email]
    .filter(Boolean).map(esc).join(' · ')

  const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8" />
<title>${esc(title)} — ${esc(data.patient.prenom)} ${esc(data.patient.nom)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", Roboto, Arial, sans-serif; color: #1A2B3C; margin: 0; padding: 40px 46px; }
  .top { display:flex; justify-content:space-between; align-items:flex-start; border-bottom: 2px solid #3d8fa8; padding-bottom: 16px; }
  .doctor h1 { font-size: 17px; margin: 0; }
  .doctor .spec { color:#3d8fa8; font-size:12px; margin-top:2px; font-weight:600; }
  .doctor .small { color:#6b7c8c; font-size:11px; margin-top:6px; line-height:1.5; max-width: 320px; }
  .brand { text-align:right; }
  .brand .logo { display:inline-flex; align-items:center; gap:8px; justify-content:flex-end; }
  .brand .logo .dot { width:30px; height:30px; border-radius:8px; background:linear-gradient(135deg,#3d8fa8,#1e5f7a); color:#fff; display:flex; align-items:center; justify-content:center; font-size:15px; }
  .brand .name { font-weight:700; font-size:15px; }
  .brand .sub { font-size:10px; color:#3d8fa8; }
  .meta { text-align:right; font-size:12px; color:#6b7c8c; margin-top:10px; }
  .title { text-align:center; font-size:15px; letter-spacing:2px; text-transform:uppercase; color:#1e5f7a; font-weight:700; margin:26px 0 4px; }
  .title-sub { text-align:center; height:2px; width:80px; background:#70B1C4; margin:0 auto 22px; border-radius:2px; }
  .patient { font-size:13px; margin-bottom:22px; }
  .patient strong { font-size:15px; }
  .patient .ln { color:#6b7c8c; margin-top:3px; }
  .meds { margin:0; padding-left:20px; }
  .meds li { margin-bottom:14px; }
  .med-name { font-weight:700; font-size:14px; color:#1A2B3C; }
  .med-line { font-size:13px; color:#27384a; margin-top:2px; }
  .med-line span { color:#6b7c8c; font-weight:600; }
  .corr { font-size:13px; margin:0 0 10px; }
  table.rx { width:100%; border-collapse:collapse; margin-top:6px; }
  table.rx th, table.rx td { border:1px solid #cdddE6; padding:10px 12px; text-align:center; font-size:13px; }
  table.rx thead th { background:#E4F0F4; color:#1e5f7a; font-weight:700; }
  table.rx tbody th { background:#F4F8FA; text-align:left; font-weight:700; color:#1A2B3C; }
  .ep { font-size:13px; margin-top:14px; }
  .empty { color:#9aa8b4; font-style:italic; font-size:13px; }
  .notes { margin-top:22px; font-size:12.5px; color:#27384a; }
  .notes .lbl { color:#6b7c8c; font-weight:600; text-transform:uppercase; letter-spacing:1px; font-size:10px; }
  .sign { margin-top:64px; display:flex; justify-content:flex-end; }
  .sign .box { width:240px; text-align:center; border-top:1px solid #b8c8d2; padding-top:8px; font-size:11px; color:#6b7c8c; }
  .footer { margin-top:40px; padding-top:12px; border-top:1px solid #eef3f6; font-size:10px; color:#9aa8b4; text-align:center; }
  @media print { body { padding: 6px 14px; } .sign { margin-top:90px; } }
</style></head>
<body>
  <div class="top">
    <div class="doctor">
      <h1>Dr. ${esc(data.doctor.prenom)} ${esc(data.doctor.nom)}</h1>
      <div class="spec">${esc(data.doctor.specialite || 'Ophtalmologue')}</div>
      <div class="small">
        ${data.doctor.cabinet_nom ? `${esc(data.doctor.cabinet_nom)}<br/>` : ''}
        ${cab ? `${cab}<br/>` : ''}
        ${data.doctor.rpps ? `RPPS : ${esc(data.doctor.rpps)}` : ''}
      </div>
    </div>
    <div class="brand">
      <div class="logo"><span class="dot">◉</span><span><span class="name">Ophtech</span><br/><span class="sub">Cabinet d'Ophtalmologie</span></span></div>
      <div class="meta">Le ${esc(frDate(data.date_ordonnance))}</div>
    </div>
  </div>

  <div class="title">${esc(title)}</div>
  <div class="title-sub"></div>

  <div class="patient">
    <strong>${esc(data.patient.prenom)} ${esc(data.patient.nom)}</strong>
    <div class="ln">${data.patient.age !== null ? `${data.patient.age} ans` : ''}${data.patient.date_naissance ? ` · né(e) le ${esc(frDate(data.patient.date_naissance))}` : ''}</div>
  </div>

  ${body}

  ${data.notes ? `<div class="notes"><div class="lbl">Remarques</div>${esc(data.notes)}</div>` : ''}

  <div class="sign"><div class="box">Signature et cachet du médecin</div></div>

  <div class="footer">Ophtech — Ordonnance générée électroniquement · document à valeur médicale.</div>
${autoPrint ? `
  <script>
    (function () {
      var printed = false;
      function go() { if (printed) return; printed = true; window.focus(); window.print(); }
      if (document.readyState === 'complete') setTimeout(go, 150);
      else window.addEventListener('load', function () { setTimeout(go, 150); });
    })();
  </script>` : ''}
</body></html>`

  const win = window.open('', '_blank', 'width=900,height=1100')
  if (!win) return false
  win.document.open()
  win.document.write(html)
  win.document.close()
  return true
}
