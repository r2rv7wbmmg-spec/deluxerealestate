// Asistenti për pyetje të shpejta: kupton qytetin, llojin, buxhetin dhe pyetjet e zakonshme.
// Përgjigjet e pyetjeve të shpeshta mund t’i ndryshoni te FAQ më poshtë.
const { db } = require('./db');
const { site } = require('./config');
const { ZONES } = require('./zones');
const P = require('./chat-persona')(site);
const ZONE_INDEX = Object.entries(ZONES).flatMap(([city, list]) => list.map(z => ({ city, zone: z, key: String(z).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') }))).sort((a, b) => b.key.length - a.key.length);

const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s+.,€-]/g, ' ');

const CITIES = { tirane: 'Tiranë', tirana: 'Tiranë', durres: 'Durrës', vlore: 'Vlorë', vlora: 'Vlorë', shkoder: 'Shkodër', shkodra: 'Shkodër', sarande: 'Sarandë', saranda: 'Sarandë', pogradec: 'Pogradec' };
const TYPES = { apartament: 'Apartament', banes: 'Apartament', garsonier: 'Apartament', studio: 'Apartament', penthouse: 'Apartament', vil: 'Vilë', shtepi: 'Vilë', zyr: 'Zyrë', ofic: 'Zyrë', dyqan: 'Dyqan', lokal: 'Dyqan', tok: 'Tokë', truall: 'Tokë' };

// Tekstet e bisedës (përshëndetjet, pyetjet e shpeshta, toni) janë te src/chat-persona.js

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
  if (!t.trim()) return { reply: P.empty() };
  const smallTalk = P.small(t.trim());

  const filters = {};
  for (const [k, v] of Object.entries(CITIES)) if (t.includes(k)) filters.city = v;
  // “bllok”, “blloku”, “kombinat”, “laprake”… – pranon edhe format pa mbaresë
  const zm = ZONE_INDEX.find(z => {
    if (z.key.length < 4) return false;
    const words = z.key.split(/\s+/).map(w => { const e = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); return w.length > 3 ? e.replace(/[uiae]$/, '') + '[a-z]{0,2}' : e; });
    return new RegExp(`(^|\\s)${words.join('\\s+')}(\\s|$)`).test(t);
  });
  if (zm) { filters.zone = zm.zone; filters.city = zm.city; }
  for (const [k, v] of Object.entries(TYPES)) if (t.includes(k)) { filters.type = v; break; }
  if (/\bqira\b|qera|me qira|rent/.test(t)) filters.deal = 'qira';
  else if (/\bblej|\bblerje|shitje|ne shitje|te blej/.test(t)) filters.deal = 'shitje';
  const r = t.match(/(\d)\s*\+\s*1/); if (r) filters.rooms = Number(r[1]);
  const budget = parseBudget(t); if (budget) filters.max = budget;

  const sellingOwn = /pronen time|te shes|dua te shes|ta shes|jap me qira/.test(t);
  const faq = P.faq(t);
  const strong = filters.city || filters.type || filters.rooms;
  const hasSearch = !sellingOwn && (strong || (!faq && (filters.deal || filters.max)));

  if (hasSearch) {
    const where = ["status = 'active'", "approval = 'approved'"], params = [];
    if (filters.city) { where.push('city = ?'); params.push(filters.city); }
    if (filters.zone) { where.push('zone = ?'); params.push(filters.zone); }
    if (filters.type) { where.push('type = ?'); params.push(filters.type); }
    if (filters.deal) { where.push('deal = ?'); params.push(filters.deal); }
    if (filters.rooms) { where.push('rooms >= ?'); params.push(filters.rooms); if (!filters.type) where.push("type IN ('Apartament','Vilë')"); }
    if (filters.max) { where.push('price <= ?'); params.push(filters.max); }
    const rows = db.prepare(`SELECT id, code, title, deal, city, zone, price, images FROM properties WHERE ${where.join(' AND ')} ORDER BY featured DESC, created_at DESC LIMIT 3`).all(...params);
    const total = db.prepare(`SELECT COUNT(*) AS n FROM properties WHERE ${where.join(' AND ')}`).get(...params).n;
    const qs = new URLSearchParams(Object.fromEntries(Object.entries(filters).map(([k, v]) => [k, String(v)]))).toString();
    const desc = [filters.type ? filters.type.toLowerCase() : 'prona', filters.deal ? (filters.deal === 'qira' ? 'me qira' : 'në shitje') : '', filters.rooms ? `me ${filters.rooms}+ dhoma` : '', filters.zone ? `në ${filters.zone}` : filters.city ? `në ${filters.city}` : '', filters.max ? `deri në ${Math.round(filters.max).toLocaleString('de-DE')} €` : ''].filter(Boolean).join(' ');
    if (!total) return { reply: P.none(desc), whatsapp: true, quick: QUICK };
    return {
      reply: P.found(total, desc), after: P.after(total),
      properties: rows.map(p => ({ ...p, image: (JSON.parse(p.images || '[]')[0]) || null, images: undefined })),
      link: `/properties.html?${qs}`
    };
  }
  if (faq) return { reply: faq.a(), quick: QUICK };
  if (smallTalk) return { reply: smallTalk, quick: QUICK };
  return { reply: P.fallback(), whatsapp: true, quick: QUICK };
}

const QUICK = P.QUICK;
module.exports = { answer, QUICK };
