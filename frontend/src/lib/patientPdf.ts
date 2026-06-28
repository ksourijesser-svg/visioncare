/**
 * Builds a well-structured printable dossier and opens the browser print dialog
 * so the doctor can "Save as PDF". No external dependency — uses a clean
 * print-styled HTML document (always light, as a medical document should be).
 */

export interface DossierConsultation {
  date: string
  motif?: string
  diagnostic?: string
  traitement?: string
  notes?: string
}

export interface DossierData {
  prenom: string
  nom: string
  id: number
  age: number | null
  date_naissance?: string
  telephone?: string
  email?: string
  adresse?: string
  notes?: string
  consultations: DossierConsultation[]
  documents: { filename: string; created_at: string; dataUrl?: string | null }[]
  doctorName?: string
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

export function exportPatientDossierPdf(data: DossierData) {
  const initials = `${data.prenom[0] || ''}${data.nom[0] || ''}`.toUpperCase()
  const printedAt = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  const infoRows = [
    ['Date de naissance', data.date_naissance ? frDate(data.date_naissance) : 'Non renseignée'],
    ['Âge', data.age !== null ? `${data.age} ans` : 'Inconnu'],
    ['Téléphone', data.telephone || 'Non renseigné'],
    ['Email', data.email || 'Non renseigné'],
    ['Adresse', data.adresse || 'Non renseignée'],
  ].map(([k, v]) => `<tr><td class="k">${esc(k)}</td><td class="v">${esc(v)}</td></tr>`).join('')

  const consultations = data.consultations.length
    ? data.consultations.map((c) => `
        <div class="card">
          <div class="card-head">
            <span class="badge">${frDate(c.date)}</span>
            ${c.motif ? `<span class="motif">${esc(c.motif)}</span>` : ''}
          </div>
          ${c.diagnostic ? `<div class="row"><span class="lbl">Diagnostic</span><span class="val">${esc(c.diagnostic)}</span></div>` : ''}
          ${c.traitement ? `<div class="row"><span class="lbl">Traitement</span><span class="val">${esc(c.traitement)}</span></div>` : ''}
          ${c.notes ? `<div class="row"><span class="lbl">Notes</span><span class="val">${esc(c.notes)}</span></div>` : ''}
        </div>`).join('')
    : `<p class="empty">Aucun compte-rendu enregistré.</p>`

  const images = data.documents.filter((d) => !!d.dataUrl)
  const others = data.documents.filter((d) => !d.dataUrl)

  const imageGallery = images.length
    ? `<div class="gallery">${images.map((d) => `
        <figure class="shot">
          <img src="${d.dataUrl}" alt="${esc(d.filename)}" />
          <figcaption>${esc(d.filename)} · ${frDate(d.created_at)}</figcaption>
        </figure>`).join('')}</div>`
    : ''

  const otherList = others.length
    ? `<ul class="docs">${others.map((d) => `<li><span class="doc-name">${esc(d.filename)}</span><span class="doc-date">${frDate(d.created_at)}</span></li>`).join('')}</ul>`
    : ''

  const documents = data.documents.length
    ? `${imageGallery}${otherList}`
    : `<p class="empty">Aucun document joint.</p>`

  const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8" />
<title>Dossier patient — ${esc(data.prenom)} ${esc(data.nom)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", Roboto, Arial, sans-serif; color: #1A2B3C; margin: 0; padding: 36px 40px; }
  .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #3d8fa8; padding-bottom: 16px; margin-bottom: 24px; }
  .brand { display: flex; align-items: center; gap: 12px; }
  .logo { width: 42px; height: 42px; border-radius: 11px; background: linear-gradient(135deg,#3d8fa8,#1e5f7a); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:20px; }
  .brand h1 { font-size: 18px; margin: 0; color:#1A2B3C; }
  .brand p { font-size: 11px; margin: 2px 0 0; color:#3d8fa8; }
  .meta { text-align:right; font-size: 11px; color:#7a8a99; }
  .patient { display:flex; align-items:center; gap:16px; background:#F0F5F8; border-radius:14px; padding:18px 20px; margin-bottom:24px; }
  .avatar { width:58px; height:58px; border-radius:50%; background:#3d8fa8; color:#fff; display:flex; align-items:center; justify-content:center; font-size:22px; font-weight:700; }
  .patient h2 { margin:0; font-size:20px; }
  .patient .sub { color:#6b7c8c; font-size:13px; margin-top:3px; }
  h3 { font-size:12px; text-transform:uppercase; letter-spacing:1.5px; color:#3d8fa8; margin:26px 0 10px; }
  table.info { width:100%; border-collapse:collapse; }
  table.info td { padding:7px 0; border-bottom:1px solid #eef3f6; font-size:13px; vertical-align:top; }
  table.info td.k { color:#7a8a99; width:180px; }
  table.info td.v { font-weight:600; }
  .notes-box { background:#FFF8E6; border:1px solid #F0E3B8; border-radius:10px; padding:12px 14px; font-size:13px; line-height:1.55; }
  .card { border:1px solid #e3ebf0; border-radius:10px; padding:13px 15px; margin-bottom:10px; }
  .card-head { display:flex; align-items:center; gap:10px; margin-bottom:8px; }
  .badge { background:#E4EEF4; color:#1e5f7a; font-weight:700; font-size:12px; padding:3px 9px; border-radius:6px; }
  .motif { color:#6b7c8c; font-size:13px; }
  .row { display:flex; gap:10px; margin:4px 0; font-size:13px; }
  .row .lbl { color:#7a8a99; width:90px; flex:none; font-weight:600; }
  .row .val { color:#27384a; }
  .docs { list-style:none; padding:0; margin:0; }
  .docs li { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #eef3f6; font-size:13px; }
  .doc-date { color:#7a8a99; }
  .gallery { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:12px; }
  .shot { margin:0; border:1px solid #e3ebf0; border-radius:10px; overflow:hidden; break-inside:avoid; }
  .shot img { display:block; width:100%; max-height:300px; object-fit:contain; background:#f4f7f9; }
  .shot figcaption { font-size:11px; color:#7a8a99; padding:7px 10px; border-top:1px solid #eef3f6; }
  .empty { color:#9aa8b4; font-style:italic; font-size:13px; }
  .footer { margin-top:36px; padding-top:14px; border-top:1px solid #eef3f6; font-size:10.5px; color:#9aa8b4; text-align:center; }
  @media print { body { padding:0 8px; } .card, .patient { break-inside: avoid; } }
</style></head>
<body>
  <div class="header">
    <div class="brand">
      <div class="logo">◉</div>
      <div><h1>Ophtech</h1><p>Cabinet d'Ophtalmologie</p></div>
    </div>
    <div class="meta">
      <div><strong>Dossier patient</strong></div>
      <div>Édité le ${esc(printedAt)}</div>
      ${data.doctorName ? `<div>Dr. ${esc(data.doctorName)}</div>` : ''}
    </div>
  </div>

  <div class="patient">
    <div class="avatar">${esc(initials)}</div>
    <div>
      <h2>${esc(data.prenom)} ${esc(data.nom)}</h2>
      <div class="sub">${data.age !== null ? `${data.age} ans · ` : ''}Patient #${data.id}</div>
    </div>
  </div>

  <h3>Informations</h3>
  <table class="info"><tbody>${infoRows}</tbody></table>

  <h3>Notes médicales</h3>
  ${data.notes ? `<div class="notes-box">${esc(data.notes)}</div>` : `<p class="empty">Aucune note médicale.</p>`}

  <h3>Historique des consultations</h3>
  ${consultations}

  <h3>Documents joints</h3>
  ${documents}

  <div class="footer">Document généré par Ophtech — confidentiel · usage médical strictement réservé.</div>
  <script>
    (function () {
      var printed = false;
      function go() {
        if (printed) return;
        printed = true;
        window.focus();
        window.print();
      }
      // Wait for all images (data URLs) to decode before printing.
      function ready() {
        var imgs = Array.prototype.slice.call(document.images);
        var pending = imgs.filter(function (i) { return !i.complete; });
        if (pending.length === 0) { setTimeout(go, 150); return; }
        var left = pending.length;
        pending.forEach(function (i) {
          i.addEventListener('load', done);
          i.addEventListener('error', done);
        });
        function done() { if (--left <= 0) setTimeout(go, 150); }
        // Safety net: never hang.
        setTimeout(go, 2500);
      }
      if (document.readyState === 'complete') ready();
      else window.addEventListener('load', ready);
    })();
  </script>
</body></html>`

  const win = window.open('', '_blank', 'width=900,height=1000')
  if (!win) return false
  win.document.open()
  win.document.write(html)
  win.document.close()
  return true
}
