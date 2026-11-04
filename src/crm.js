// CRM për agjentët: leads (portofoli), opportunitete (fazat e marrëveshjes) dhe historiku
const { db } = require('./db');

const STAGES = ['new', 'contacted', 'visit', 'offer', 'negotiation', 'won', 'lost'];
const STAGE_LABEL = { new: 'E re', contacted: 'Kontaktuar', visit: 'Vizitë', offer: 'Ofertë', negotiation: 'Negocim', won: 'Fituar', lost: 'Humbur' };
const CLIENT_TYPES = ['bleres', 'qiramarres', 'shites', 'qiradhenes', 'investitor'];
const SOURCES = ['website', 'instagram', 'facebook', 'telefon', 'whatsapp', 'rekomandim', 'zyra', 'tjeter'];
const LEAD_STATUS = ['active', 'cold', 'closed'];
const ACT_TYPES = ['note', 'call', 'whatsapp', 'email', 'visit', 'meeting', 'stage', 'system'];
const OPEN = "stage NOT IN ('won','lost')";

const normPhone = p => { let d = String(p || '').replace(/\D/g, ''); if (d.startsWith('00')) d = d.slice(2); if (d.startsWith('0')) d = '355' + d.slice(1); return d.length >= 8 ? d : ''; };
const today = () => new Date().toISOString().slice(0, 10);

function register({ route, HttpError, readBody, requireStaff, isAdmin, str, int }) {
  const num = v => (v === '' || v == null) ? null : Math.max(0, int(v, 0));
  const isDate = d => /^\d{4}-\d{2}-\d{2}$/.test(d);
  const authorOf = u => u.agent_id ? (db.prepare('SELECT name FROM agents WHERE id = ?').get(u.agent_id)?.name || u.username) : u.username;
  const log = (u, leadId, type, text, oppId = null) => db.prepare('INSERT INTO activities (lead_id, opp_id, user_id, author, type, text) VALUES (?,?,?,?,?,?)').run(leadId, oppId, u ? u.id : null, u ? authorOf(u) : 'Faqja', type, text);

  function ownLead(u, id) {
    const l = db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
    if (!l) throw new HttpError(404, 'Lead-i nuk u gjet.');
    if (!isAdmin(u) && l.agent_id !== u.agent_id) throw new HttpError(403, 'Ky lead nuk është në portofolin tuaj.');
    return l;
  }
  function ownOpp(u, id) {
    const o = db.prepare('SELECT * FROM opportunities WHERE id = ?').get(id);
    if (!o) throw new HttpError(404, 'Opportunity-ja nuk u gjet.');
    if (!isAdmin(u) && o.agent_id !== u.agent_id) throw new HttpError(403, 'Kjo opportunity nuk është e juaja.');
    return o;
  }
  function leadInput(b, u) {
    const l = {
      name: str(b.name, 100), phone: str(b.phone, 40), email: str(b.email, 120),
      client_type: CLIENT_TYPES.includes(b.client_type) ? b.client_type : 'bleres',
      source: SOURCES.includes(b.source) ? b.source : 'tjeter',
      status: LEAD_STATUS.includes(b.status) ? b.status : 'active',
      budget_min: num(b.budget_min), budget_max: num(b.budget_max),
      city: str(b.city, 60), ptype: str(b.ptype, 30), notes: str(b.notes, 3000)
    };
    if (!l.name) throw new HttpError(400, 'Shkruani emrin e klientit.');
    if (!l.phone && !l.email) throw new HttpError(400, 'Vendosni të paktën telefonin ose email-in.');
    l.phone_norm = normPhone(l.phone);
    if (isAdmin(u)) l.agent_id = b.agent_id ? int(b.agent_id, null) : null;
    return l;
  }
  function oppInput(b, u, lead) {
    const o = {
      title: str(b.title, 160), deal: b.deal === 'qira' ? 'qira' : 'shitje',
      stage: STAGES.includes(b.stage) ? b.stage : 'new',
      value: num(b.value) || 0, commission: num(b.commission) || 0,
      next_action: str(b.next_action, 200), next_date: isDate(b.next_date) ? b.next_date : '',
      lost_reason: str(b.lost_reason, 300),
      property_id: b.property_id ? int(b.property_id, null) : null
    };
    if (o.property_id) {
      const p = db.prepare('SELECT id, code, title, price, deal FROM properties WHERE id = ?').get(o.property_id);
      if (!p) throw new HttpError(400, 'Prona e zgjedhur nuk ekziston.');
      if (!o.title) o.title = `${p.code} – ${p.title}`;
      if (!o.value) o.value = p.price;
    }
    if (!o.title) throw new HttpError(400, 'Jepini një titull opportunity-së (p.sh. “Blerje apartamenti 2+1”).');
    o.agent_id = isAdmin(u) ? (b.agent_id ? int(b.agent_id, null) : lead.agent_id) : u.agent_id;
    return o;
  }
  const oppSelect = `SELECT o.*, l.name AS lead_name, l.phone AS lead_phone, a.name AS agent_name, p.code AS property_code, p.title AS property_title
    FROM opportunities o JOIN leads l ON l.id = o.lead_id LEFT JOIN agents a ON a.id = o.agent_id LEFT JOIN properties p ON p.id = o.property_id`;

  /* ---------- leads ---------- */
  route('GET', '/api/admin/leads', ({ req, query }) => {
    const u = requireStaff(req), where = ['1=1'], params = [];
    if (!isAdmin(u)) { where.push('l.agent_id = ?'); params.push(u.agent_id); }
    else if (query.get('agent') === 'none') where.push('l.agent_id IS NULL');
    else if (query.get('agent')) { where.push('l.agent_id = ?'); params.push(int(query.get('agent'))); }
    const q = str(query.get('q'), 80);
    if (q) { where.push('(l.name LIKE ? OR l.phone LIKE ? OR l.email LIKE ? OR l.city LIKE ?)'); params.push(...Array(4).fill(`%${q}%`)); }
    for (const [k, list] of [['client_type', CLIENT_TYPES], ['source', SOURCES], ['status', LEAD_STATUS]]) if (list.includes(query.get(k))) { where.push(`l.${k} = ?`); params.push(query.get(k)); }
    return db.prepare(`SELECT l.*, a.name AS agent_name,
        (SELECT COUNT(*) FROM opportunities o WHERE o.lead_id = l.id AND o.${OPEN}) AS open_opps,
        (SELECT MIN(o.next_date) FROM opportunities o WHERE o.lead_id = l.id AND o.${OPEN} AND o.next_date != '') AS next_date,
        (SELECT MAX(created_at) FROM activities ac WHERE ac.lead_id = l.id) AS last_activity
      FROM leads l LEFT JOIN agents a ON a.id = l.agent_id WHERE ${where.join(' AND ')} ORDER BY COALESCE(last_activity, l.created_at) DESC, l.id DESC`).all(...params);
  });
  route('GET', '/api/admin/leads/:id', ({ req, params }) => {
    const u = requireStaff(req), l = ownLead(u, int(params.id));
    return {
      ...l, agent_name: l.agent_id ? db.prepare('SELECT name FROM agents WHERE id = ?').get(l.agent_id)?.name : null,
      opportunities: db.prepare(`${oppSelect} WHERE o.lead_id = ? ORDER BY ${OPEN.replace('stage', 'o.stage')} DESC, o.updated_at DESC`).all(l.id),
      activities: db.prepare('SELECT * FROM activities WHERE lead_id = ? ORDER BY created_at DESC, id DESC LIMIT 200').all(l.id)
    };
  });
  route('POST', '/api/admin/leads', async ({ req }) => {
    const u = requireStaff(req), l = leadInput(await readBody(req), u);
    if (!isAdmin(u)) l.agent_id = u.agent_id;
    if (l.phone_norm) {
      const dup = db.prepare('SELECT l.id, l.name, l.agent_id, a.name AS agent_name FROM leads l LEFT JOIN agents a ON a.id = l.agent_id WHERE phone_norm = ?').get(l.phone_norm);
      if (dup) throw new HttpError(409, dup.agent_id === l.agent_id || isAdmin(u) ? `Ky numër ekziston: ${dup.name}${dup.agent_name ? ' (' + dup.agent_name + ')' : ''}. Hapeni lead-in ekzistues.` : 'Ky klient është tashmë në portofolin e një agjenti tjetër. Kontaktoni administratorin.');
    }
    l.created_by = u.id;
    const keys = Object.keys(l);
    const id = Number(db.prepare(`INSERT INTO leads (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`).run(...Object.values(l)).lastInsertRowid);
    log(u, id, 'system', 'Lead-i u krijua.');
    return db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
  });
  route('PUT', '/api/admin/leads/:id', async ({ req, params }) => {
    const u = requireStaff(req), old = ownLead(u, int(params.id)), l = leadInput(await readBody(req), u);
    if (!isAdmin(u)) l.agent_id = old.agent_id;
    db.prepare(`UPDATE leads SET ${Object.keys(l).map(k => `${k} = ?`).join(', ')}, updated_at = datetime('now') WHERE id = ?`).run(...Object.values(l), old.id);
    if (isAdmin(u) && l.agent_id !== old.agent_id) {
      db.prepare(`UPDATE opportunities SET agent_id = ?, updated_at = datetime('now') WHERE lead_id = ? AND ${OPEN}`).run(l.agent_id, old.id);
      const name = l.agent_id ? db.prepare('SELECT name FROM agents WHERE id = ?').get(l.agent_id)?.name : 'askujt';
      log(u, old.id, 'system', `Lead-i iu caktua ${name}.`);
    }
    return db.prepare('SELECT * FROM leads WHERE id = ?').get(old.id);
  });
  route('DELETE', '/api/admin/leads/:id', ({ req, params }) => {
    const u = requireStaff(req), l = ownLead(u, int(params.id));
    if (!isAdmin(u)) throw new HttpError(403, 'Vetëm administratori fshin leads. Shënojeni “Mbyllur” nëse nuk është më aktiv.');
    db.prepare('UPDATE inquiries SET lead_id = NULL WHERE lead_id = ?').run(l.id);
    db.prepare('DELETE FROM leads WHERE id = ?').run(l.id);
    return { ok: true };
  });
  route('POST', '/api/admin/leads/:id/activities', async ({ req, params }) => {
    const u = requireStaff(req), l = ownLead(u, int(params.id)), b = await readBody(req);
    const type = ACT_TYPES.includes(b.type) && !['stage', 'system'].includes(b.type) ? b.type : 'note';
    const text = str(b.text, 2000);
    if (!text && type === 'note') throw new HttpError(400, 'Shkruani shënimin.');
    const oppId = b.opp_id ? int(b.opp_id, null) : null;
    if (oppId) { const o = ownOpp(u, oppId); if (o.lead_id !== l.id) throw new HttpError(400, 'Opportunity-ja nuk i përket këtij lead-i.'); }
    log(u, l.id, type, text, oppId);
    db.prepare("UPDATE leads SET updated_at = datetime('now') WHERE id = ?").run(l.id);
    return { ok: true };
  });

  /* ---------- opportunitete ---------- */
  route('GET', '/api/admin/opportunities', ({ req, query }) => {
    const u = requireStaff(req), where = ['1=1'], params = [];
    if (!isAdmin(u)) { where.push('o.agent_id = ?'); params.push(u.agent_id); }
    else if (query.get('agent') === 'none') where.push('o.agent_id IS NULL');
    else if (query.get('agent')) { where.push('o.agent_id = ?'); params.push(int(query.get('agent'))); }
    const q = str(query.get('q'), 80);
    if (q) { where.push('(o.title LIKE ? OR l.name LIKE ? OR p.code LIKE ?)'); params.push(...Array(3).fill(`%${q}%`)); }
    if (query.get('closed') !== 'all') where.push("(o.stage NOT IN ('won','lost') OR o.closed_at >= datetime('now','-60 days'))");
    return db.prepare(`${oppSelect} WHERE ${where.join(' AND ')} ORDER BY CASE WHEN o.next_date = '' THEN 1 ELSE 0 END, o.next_date, o.updated_at DESC`).all(...params);
  });
  route('POST', '/api/admin/opportunities', async ({ req }) => {
    const u = requireStaff(req), b = await readBody(req);
    const lead = ownLead(u, int(b.lead_id));
    const o = oppInput(b, u, lead);
    o.lead_id = lead.id; if (['won', 'lost'].includes(o.stage)) o.closed_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const keys = Object.keys(o);
    const id = Number(db.prepare(`INSERT INTO opportunities (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`).run(...Object.values(o)).lastInsertRowid);
    log(u, lead.id, 'system', `U krijua opportunity: ${o.title} (${STAGE_LABEL[o.stage]}).`, id);
    return db.prepare(`${oppSelect} WHERE o.id = ?`).get(id);
  });
  route('PUT', '/api/admin/opportunities/:id', async ({ req, params }) => {
    const u = requireStaff(req), old = ownOpp(u, int(params.id)), b = await readBody(req);
    const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(old.lead_id);
    const o = oppInput(b, u, lead);
    if (!isAdmin(u)) o.agent_id = old.agent_id;
    if (o.stage !== old.stage) {
      o.closed_at = ['won', 'lost'].includes(o.stage) ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null;
      log(u, old.lead_id, 'stage', `${STAGE_LABEL[old.stage]} → ${STAGE_LABEL[o.stage]}${o.stage === 'lost' && o.lost_reason ? ': ' + o.lost_reason : ''}`, old.id);
    }
    db.prepare(`UPDATE opportunities SET ${Object.keys(o).map(k => `${k} = ?`).join(', ')}, updated_at = datetime('now') WHERE id = ?`).run(...Object.values(o), old.id);
    return db.prepare(`${oppSelect} WHERE o.id = ?`).get(old.id);
  });
  route('PATCH', '/api/admin/opportunities/:id', async ({ req, params }) => {
    const u = requireStaff(req), old = ownOpp(u, int(params.id)), b = await readBody(req);
    if (!STAGES.includes(b.stage)) throw new HttpError(400, 'Fazë e pavlefshme.');
    if (b.stage === old.stage) return db.prepare(`${oppSelect} WHERE o.id = ?`).get(old.id);
    const closed = ['won', 'lost'].includes(b.stage) ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null;
    const reason = b.stage === 'lost' ? str(b.lost_reason, 300) : old.lost_reason;
    db.prepare("UPDATE opportunities SET stage = ?, closed_at = ?, lost_reason = ?, updated_at = datetime('now') WHERE id = ?").run(b.stage, closed, reason, old.id);
    log(u, old.lead_id, 'stage', `${STAGE_LABEL[old.stage]} → ${STAGE_LABEL[b.stage]}${b.stage === 'lost' && reason ? ': ' + reason : ''}`, old.id);
    return db.prepare(`${oppSelect} WHERE o.id = ?`).get(old.id);
  });
  route('DELETE', '/api/admin/opportunities/:id', ({ req, params }) => {
    const u = requireStaff(req), o = ownOpp(u, int(params.id));
    db.prepare('DELETE FROM opportunities WHERE id = ?').run(o.id);
    log(u, o.lead_id, 'system', `U fshi opportunity: ${o.title}.`);
    return { ok: true };
  });

  /* ---------- përmbledhja dhe raporti ---------- */
  route('GET', '/api/admin/crm', ({ req }) => {
    const u = requireStaff(req), admin = isAdmin(u);
    const ow = admin ? '1=1' : 'o.agent_id = ?', op = admin ? [] : [u.agent_id];
    const lw = admin ? '1=1' : 'agent_id = ?';
    const todayList = db.prepare(`${oppSelect} WHERE ${ow} AND o.${OPEN.replace('stage', 'stage')} AND o.next_date != '' AND o.next_date <= ? ORDER BY o.next_date LIMIT 30`).all(...op, today());
    const pipeline = db.prepare(`SELECT stage, COUNT(*) AS n, COALESCE(SUM(value),0) AS value, COALESCE(SUM(commission),0) AS commission FROM opportunities o WHERE ${ow} GROUP BY stage`).all(...op);
    const month = db.prepare(`SELECT SUM(stage='won') AS won, SUM(stage='lost') AS lost, COALESCE(SUM(CASE WHEN stage='won' THEN commission END),0) AS commission, COALESCE(SUM(CASE WHEN stage='won' THEN value END),0) AS value FROM opportunities o WHERE ${ow} AND closed_at >= strftime('%Y-%m-01','now')`).get(...op);
    const leads = db.prepare(`SELECT COUNT(*) AS total, SUM(created_at >= datetime('now','-7 days')) AS week, SUM(agent_id IS NULL) AS unassigned FROM leads WHERE ${lw}`).get(...op);
    const out = { today: today(), todayList, pipeline, month, leads };
    if (admin) {
      out.agents = db.prepare(`SELECT a.id, a.name,
          (SELECT COUNT(*) FROM leads l WHERE l.agent_id = a.id) AS leads,
          (SELECT COUNT(*) FROM opportunities o WHERE o.agent_id = a.id AND o.${OPEN.replace('stage', 'stage')}) AS open,
          (SELECT COALESCE(SUM(value),0) FROM opportunities o WHERE o.agent_id = a.id AND o.${OPEN.replace('stage', 'stage')}) AS open_value,
          (SELECT COUNT(*) FROM opportunities o WHERE o.agent_id = a.id AND o.stage = 'won' AND o.closed_at >= strftime('%Y-%m-01','now')) AS won_month,
          (SELECT COALESCE(SUM(commission),0) FROM opportunities o WHERE o.agent_id = a.id AND o.stage = 'won' AND o.closed_at >= strftime('%Y-%m-01','now')) AS commission_month,
          (SELECT COUNT(*) FROM opportunities o WHERE o.agent_id = a.id AND o.stage = 'won') AS won_total,
          (SELECT COUNT(*) FROM opportunities o WHERE o.agent_id = a.id AND o.stage = 'lost') AS lost_total,
          (SELECT COALESCE(SUM(commission),0) FROM opportunities o WHERE o.agent_id = a.id AND o.stage = 'won') AS commission_total
        FROM agents a ORDER BY a.level DESC, a.id`).all();
      out.sources = db.prepare(`SELECT l.source, COUNT(DISTINCT l.id) AS leads, COUNT(CASE WHEN o.stage = 'won' THEN 1 END) AS won FROM leads l LEFT JOIN opportunities o ON o.lead_id = l.id GROUP BY l.source ORDER BY leads DESC`).all();
    }
    return out;
  });

  /* ---------- kërkesë nga faqja → lead ---------- */
  route('POST', '/api/admin/inquiries/:id/lead', ({ req, params }) => {
    const u = requireStaff(req);
    const i = db.prepare('SELECT i.*, p.agent_id AS p_agent FROM inquiries i LEFT JOIN properties p ON p.id = i.property_id WHERE i.id = ?').get(int(params.id));
    if (!i) throw new HttpError(404, 'Kërkesa nuk u gjet.');
    if (!isAdmin(u) && i.p_agent !== u.agent_id) throw new HttpError(403, 'Kjo kërkesë nuk është për pronat tuaja.');
    return { lead_id: fromInquiry(i.id, u) };
  });
}

// Çdo kërkesë nga faqja shtohet në portofolin e agjentit të pronës (ose pa agjent, për administratorin)
function fromInquiry(inquiryId, u = null) {
  const i = db.prepare('SELECT * FROM inquiries WHERE id = ?').get(inquiryId);
  if (!i) return null;
  if (i.lead_id && db.prepare('SELECT 1 FROM leads WHERE id = ?').get(i.lead_id)) return i.lead_id;
  const p = i.property_id ? db.prepare('SELECT * FROM properties WHERE id = ?').get(i.property_id) : null;
  const phone_norm = normPhone(i.phone);
  let lead = phone_norm ? db.prepare('SELECT * FROM leads WHERE phone_norm = ?').get(phone_norm) : null;
  if (!lead && i.email) lead = db.prepare('SELECT * FROM leads WHERE email = ? COLLATE NOCASE').get(i.email);
  const client_type = i.kind === 'valuation' ? (/qira/i.test(i.message || '') ? 'qiradhenes' : 'shites') : (p && p.deal === 'qira' ? 'qiramarres' : 'bleres');
  const authorName = u ? (u.agent_id ? db.prepare('SELECT name FROM agents WHERE id = ?').get(u.agent_id)?.name : u.username) : 'Faqja';
  const act = (leadId, type, text, oppId = null) => db.prepare('INSERT INTO activities (lead_id, opp_id, user_id, author, type, text) VALUES (?,?,?,?,?,?)').run(leadId, oppId, u ? u.id : null, authorName, type, text);
  if (!lead) {
    const r = db.prepare('INSERT INTO leads (name, phone, phone_norm, email, client_type, source, city, ptype, agent_id, notes) VALUES (?,?,?,?,?,?,?,?,?,?)')
      .run(i.name, i.phone || '', phone_norm, i.email || '', client_type, 'website', p ? p.city : '', p ? p.type : '', p ? p.agent_id : null, '');
    lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(Number(r.lastInsertRowid));
    act(lead.id, 'system', 'Lead-i erdhi nga faqja.');
  }
  const kindText = { property: 'Pyetje për pronën', visit: 'Kërkesë për vizitë', valuation: 'Kërkesë për vlerësim', contact: 'Mesazh nga faqja' }[i.kind] || 'Kërkesë nga faqja';
  act(lead.id, 'note', `${kindText}${p ? ` ${p.code}` : ''}: ${i.message || '(pa mesazh)'}`);
  const needOpp = p ? !db.prepare(`SELECT 1 FROM opportunities WHERE lead_id = ? AND property_id = ? AND ${OPEN}`).get(lead.id, p.id) : i.kind === 'valuation';
  if (needOpp) {
    const title = p ? `${p.code} – ${p.title}` : `Vlerësim prone${lead.city ? ' – ' + lead.city : ''}`;
    const r = db.prepare("INSERT INTO opportunities (lead_id, agent_id, property_id, title, deal, stage, value, next_action, next_date) VALUES (?,?,?,?,?,'new',?,?,?)")
      .run(lead.id, lead.agent_id ?? (p ? p.agent_id : null), p ? p.id : null, title, p ? p.deal : (client_type === 'qiradhenes' ? 'qira' : 'shitje'), p ? p.price : 0, i.kind === 'visit' ? 'Konfirmo vizitën' : 'Kontakto klientin', today());
    act(lead.id, 'system', `U krijua opportunity: ${title} (E re).`, Number(r.lastInsertRowid));
  }
  db.prepare('UPDATE inquiries SET lead_id = ? WHERE id = ?').run(lead.id, i.id);
  db.prepare("UPDATE leads SET updated_at = datetime('now') WHERE id = ?").run(lead.id);
  return lead.id;
}

module.exports = { register, fromInquiry, STAGES, STAGE_LABEL };
