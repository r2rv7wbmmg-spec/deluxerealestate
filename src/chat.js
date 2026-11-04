// Asistenti për pyetje të shpejta: kupton qytetin, llojin, buxhetin dhe pyetjet e zakonshme.
// Përgjigjet e pyetjeve të shpeshta mund t’i ndryshoni te FAQ më poshtë.
const { db } = require('./db');
const { site } = require('./config');

const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s+.,€-]/g, ' ');

const CITIES = { tirane: 'Tiranë', tirana: 'Tiranë', durres: 'Durrës', vlore: 'Vlorë', vlora: 'Vlorë', shkoder: 'Shkodër', shkodra: 'Shkodër', sarande: 'Sarandë', saranda: 'Sarandë', pogradec: 'Pogradec' };
const TYPES = { apartament: 'Apartament', banes: 'Apartament', garsonier: 'Apartament', studio: 'Apartament', penthouse: 'Apartament', vil: 'Vilë', shtepi: 'Vilë', zyr: 'Zyrë', ofic: 'Zyrë', dyqan: 'Dyqan', lokal: 'Dyqan', tok: 'Tokë', truall: 'Tokë' };

const FAQ = [
  { k: ['orar', 'hapur', 'ore', 'kur punoni'], a: () => `Jemi të hapur ${site.hours}. Në WhatsApp ju përgjigjemi edhe jashtë orarit.` },
  { k: ['adres', 'ku ndodhe', 'zyra juaj', 'ku jeni'], a: () => `Zyra jonë është në ${site.address}. Na telefononi para se të vini, që t’ju presë agjenti i duhur.` },
  { k: ['telefon', 'numer', 'kontakt', 'whatsapp', 'email'], a: () => `Mund të na gjeni në ${site.phone} (edhe WhatsApp) ose në ${site.email}.` },
  { k: ['shes', 'shit', 'vleres', 'vlera e pron', 'jap me qira', 'pronen time'], a: () => 'Vlerësimi i pronës suaj është falas. Plotësoni formularin “Vlerëso pronën” në faqen kryesore ose na shkruani në WhatsApp vendndodhjen dhe sipërfaqen – një agjent ju kontakton brenda ditës.' },
  { k: ['komision', 'tarif', 'sa merrni', 'pagese per agjenc'], a: () => 'Komisioni varet nga lloji i pronës dhe i marrëveshjes. Agjenti jua tregon qartë para çdo vizite – pa kosto të fshehura.' },
  { k: ['dokument', 'noter', 'hipotek', 'certifikat', 'kartel'], a: () => 'Për blerje ju duhen dokumenti i identitetit dhe, nëse merrni kredi, miratimi i bankës. Ne kontrollojmë certifikatën e pronësisë dhe ju shoqërojmë deri te noteri.' },
  { k: ['kredi', 'bank', 'kest'], a: () => 'Shumica e pronave në shitje mund të blihen me kredi bankare. Te faqja e çdo prone në shitje gjeni kalkulatorin e këstit mujor.' },
  { k: ['vizit', 'te shoh', 'ta shoh', 'takim'], a: () => 'Vizitat i caktojmë sipas kohës suaj, edhe në fundjavë. Hapni pronën që ju intereson dhe shtypni “Cakto vizitë”, ose na shkruani në WhatsApp.' },
  { k: ['diaspor', 'jashte shtetit', 'nga italia', 'nga gjermania', 'video'], a: () => 'Punojmë shpesh me klientë nga diaspora: bëjmë vizita me video, dërgojmë dokumentet online dhe ju përfaqësojmë me prokurë kur nevojitet.' }
];

function parseBudget(t) {
  const m = t.match(/(\d[\d.,]*)\s*(k|mije|mij|milion|mil|m\b)?\s*(€|euro|eur)?/g);
  if (!m) return null;
  let best = null;
  for (const raw of m) {
    const mm = raw.match(/(\d[\d.,]*)\s*(k|mije|mij|milion|mil|m\b)?/);
    let n = parseFloat(mm[1].replace(/\./g, '').replace(',', '.'));
    if (!n) continue;
    const u = mm[2];
    if (u === 'k' || u === 'mije' || u === 'mij') n *= 1000;
    if (u === 'milion' || u === 'mil' || u === 'm') n *= 1000000;
    if (/^\d\+\d/.test(raw.trim())) continue;
    if (n >= 100 && (!best || n > best)) best = n;
  }
  return best;
}

function answer(message) {
  const t = norm(message);
  if (!t.trim()) return { reply: 'Shkruani pyetjen tuaj, p.sh. “apartament 2+1 me qira në Tiranë deri 800 €”.' };

  if (/^(pershendetje|tung|hello|hi|mirdita|miredita|mirembrema|ckemi|hey)\b/.test(t.trim()) && t.trim().split(/\s+/).length <= 3)
    return { reply: 'Përshëndetje! Mund t’ju ndihmoj të gjeni një pronë ose t’ju përgjigjem për çmime, vizita dhe dokumente. Çfarë po kërkoni?', quick: QUICK };

  const filters = {};
  for (const [k, v] of Object.entries(CITIES)) if (t.includes(k)) filters.city = v;
  for (const [k, v] of Object.entries(TYPES)) if (t.includes(k)) { filters.type = v; break; }
  if (/\bqira\b|qera|me qira|rent/.test(t)) filters.deal = 'qira';
  else if (/\bblej|\bblerje|shitje|ne shitje|te blej/.test(t)) filters.deal = 'shitje';
  const r = t.match(/(\d)\s*\+\s*1/); if (r) filters.rooms = Number(r[1]);
  const budget = parseBudget(t); if (budget) filters.max = budget;

  const sellingOwn = /pronen time|te shes|dua te shes|ta shes|jap me qira/.test(t);
  const faq = FAQ.find(f => f.k.some(k => t.includes(k)));
  const strong = filters.city || filters.type || filters.rooms;
  const hasSearch = !sellingOwn && (strong || (!faq && (filters.deal || filters.max)));

  if (hasSearch) {
    const where = ["status = 'active'", "approval = 'approved'"], params = [];
    if (filters.city) { where.push('city = ?'); params.push(filters.city); }
    if (filters.type) { where.push('type = ?'); params.push(filters.type); }
    if (filters.deal) { where.push('deal = ?'); params.push(filters.deal); }
    if (filters.rooms) { where.push('rooms >= ?'); params.push(filters.rooms); if (!filters.type) where.push("type IN ('Apartament','Vilë')"); }
    if (filters.max) { where.push('price <= ?'); params.push(filters.max); }
    const rows = db.prepare(`SELECT id, code, title, deal, city, zone, price, images FROM properties WHERE ${where.join(' AND ')} ORDER BY featured DESC, created_at DESC LIMIT 3`).all(...params);
    const total = db.prepare(`SELECT COUNT(*) AS n FROM properties WHERE ${where.join(' AND ')}`).get(...params).n;
    const qs = new URLSearchParams(Object.fromEntries(Object.entries(filters).map(([k, v]) => [k, String(v)]))).toString();
    const desc = [filters.type ? filters.type.toLowerCase() : 'prona', filters.deal ? (filters.deal === 'qira' ? 'me qira' : 'në shitje') : '', filters.rooms ? `me ${filters.rooms}+ dhoma` : '', filters.city ? `në ${filters.city}` : '', filters.max ? `deri në ${Math.round(filters.max).toLocaleString('de-DE')} €` : ''].filter(Boolean).join(' ');
    if (!total) return { reply: `Për momentin nuk kemi ${desc}. Na lini numrin në WhatsApp dhe ju njoftojmë sapo të dalë një pronë e tillë.`, whatsapp: true, quick: QUICK };
    return {
      reply: `Gjeta ${total} ${total === 1 ? 'pronë' : 'prona'} – ${desc}.${total > 3 ? ' Ja tri të parat:' : ''}`,
      properties: rows.map(p => ({ ...p, image: (JSON.parse(p.images || '[]')[0]) || null, images: undefined })),
      link: `/properties.html?${qs}`
    };
  }
  if (faq) return { reply: faq.a(), quick: QUICK };
  return { reply: 'Nuk jam i sigurt që e kuptova. Provoni p.sh. “vilë në Vlorë” ose “sa kushton vlerësimi”, ose flisni direkt me një agjent në WhatsApp.', whatsapp: true, quick: QUICK };
}

const QUICK = ['Apartament me qira në Tiranë', 'Vila në shitje', 'Dua të shes pronën time', 'Orari dhe adresa', 'Blerje me kredi'];
module.exports = { answer, QUICK };
