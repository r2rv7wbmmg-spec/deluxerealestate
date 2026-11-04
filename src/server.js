// De Luxe Real Estate – serveri HTTP, API dhe skedarët statikë (pa varësi të jashtme)
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { db, hashPassword, verifyPassword } = require('./db');
const config = require('./config');
const chat = require('./chat');
const crm = require('./crm');

if (db.prepare('SELECT COUNT(*) AS n FROM properties').get().n === 0) require('./seed');

const PUBLIC = path.join(__dirname, '..', 'public');
const UPLOADS = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');
fs.mkdirSync(UPLOADS, { recursive: true });

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };
const TYPES = ['Apartament', 'Vilë', 'Zyrë', 'Dyqan', 'Tokë'];
const SORTS = { newest: 'created_at DESC', price_asc: 'price ASC', price_desc: 'price DESC', area_desc: 'area DESC', popular: 'views DESC' };

class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }

/* ---------- ndihmës ---------- */
function send(res, status, data, headers = {}) {
  const body = typeof data === 'string' ? data : JSON.stringify(data);
  res.writeHead(status, { 'Content-Type': typeof data === 'string' ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8', ...headers });
  res.end(body);
}
function readBody(req, limit = 1e6) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > limit) { reject(new HttpError(413, 'Skedari është shumë i madh.')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); } catch { reject(new HttpError(400, 'Të dhëna të pavlefshme.')); }
    });
    req.on('error', reject);
  });
}
const cookies = req => Object.fromEntries((req.headers.cookie || '').split(';').map(c => c.trim().split('=')).filter(p => p[0]).map(([k, ...v]) => [k, decodeURIComponent(v.join('='))]));
const str = (v, max = 500) => String(v ?? '').trim().slice(0, max);
const int = (v, def = 0) => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : def; };
const num = v => { const n = parseFloat(v); return Number.isFinite(n) ? n : null; };
const isEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);

function hydrate(p) {
  if (!p) return p;
  return { ...p, features: JSON.parse(p.features || '[]'), images: JSON.parse(p.images || '[]'), furnished: !!p.furnished, featured: !!p.featured };
}

// Kufizim i thjeshtë kërkesash për formularët publikë
const hits = new Map();
function rateLimit(req, key, max = 8, windowMs = 10 * 60 * 1000) {
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  const id = key + ip, now = Date.now();
  const list = (hits.get(id) || []).filter(t => now - t < windowMs);
  if (list.length >= max) throw new HttpError(429, 'Keni dërguar shumë kërkesa. Provoni sërish pas pak minutash.');
  list.push(now); hits.set(id, list);
}

/* ---------- autentikimi ---------- */
function currentUser(req) {
  const token = cookies(req).sid;
  if (!token) return null;
  const row = db.prepare('SELECT u.id, u.username, u.role, u.agent_id, u.active, s.expires_at FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?').get(token);
  if (!row || row.expires_at < Date.now() || !row.active) return null;
  if (row.role === 'agent' && !row.agent_id) return null;
  return row;
}
// Çdo përdorues i hyrë (administrator ose agjent)
function requireStaff(req) {
  const u = currentUser(req);
  if (!u) throw new HttpError(401, 'Ju lutem hyni në panel.');
  return u;
}
// Vetëm administratori
function requireAdmin(req) {
  const u = requireStaff(req);
  if (u.role !== 'admin') throw new HttpError(403, 'Kjo pjesë është vetëm për administratorin.');
  return u;
}
const isAdmin = u => u.role === 'admin';
// Agjenti mund të prekë vetëm pronat e veta
function ownProperty(u, id) {
  const p = db.prepare('SELECT * FROM properties WHERE id = ?').get(id);
  if (!p) throw new HttpError(404, 'Prona nuk u gjet.');
  if (!isAdmin(u) && p.agent_id !== u.agent_id) throw new HttpError(403, 'Kjo pronë nuk është e juaja.');
  return p;
}

/* ---------- validimi i pronës ---------- */
function propertyInput(b) {
  const p = {
    title: str(b.title, 160), description: str(b.description, 5000), deal: b.deal === 'qira' ? 'qira' : 'shitje',
    type: TYPES.includes(b.type) ? b.type : null, city: str(b.city, 60), zone: str(b.zone, 80), address: str(b.address, 160),
    price: Math.max(0, int(b.price)), area: Math.max(0, int(b.area)), rooms: Math.max(0, int(b.rooms)), bathrooms: Math.max(0, int(b.bathrooms)),
    floor: str(b.floor, 20), year_built: b.year_built ? int(b.year_built, null) : null, furnished: b.furnished ? 1 : 0, parking: Math.max(0, int(b.parking)),
    features: JSON.stringify((Array.isArray(b.features) ? b.features : String(b.features || '').split(',')).map(f => str(f, 60)).filter(Boolean).slice(0, 30)),
    images: JSON.stringify((Array.isArray(b.images) ? b.images : []).map(i => str(i, 600)).filter(i => /^(\/uploads\/|https?:\/\/)/.test(i)).slice(0, 20)),
    lat: num(b.lat), lng: num(b.lng), featured: b.featured ? 1 : 0,
    status: ['active', 'sold', 'rented', 'hidden'].includes(b.status) ? b.status : 'active',
    agent_id: b.agent_id ? int(b.agent_id, null) : null
  };
  if (!p.title) throw new HttpError(400, 'Titulli është i detyrueshëm.');
  if (!p.type) throw new HttpError(400, 'Zgjidhni llojin e pronës.');
  if (!p.city) throw new HttpError(400, 'Qyteti është i detyrueshëm.');
  if (!p.price) throw new HttpError(400, 'Vendosni çmimin.');
  return p;
}

/* ---------- rrugët e API-t ---------- */
const routes = [];
const route = (method, pattern, handler) => routes.push({ method, re: new RegExp('^' + pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '/?$'), handler });

// Publike
route('GET', '/api/meta', () => {
  const LIVE = "status='active' AND approval='approved'";
  const cities = db.prepare(`SELECT city, COUNT(*) AS count FROM properties WHERE ${LIVE} GROUP BY city ORDER BY count DESC`).all();
  const types = db.prepare(`SELECT type, COUNT(*) AS count FROM properties WHERE ${LIVE} GROUP BY type`).all();
  const totals = db.prepare(`SELECT COUNT(*) AS active, SUM(deal='shitje') AS sale, SUM(deal='qira') AS rent FROM properties WHERE ${LIVE}`).get();
  const closed = db.prepare("SELECT COUNT(*) AS n FROM properties WHERE status IN ('sold','rented') AND approval='approved'").get().n;
  return { site: config.site, cities, types, totals: { ...totals, closed }, allTypes: TYPES };
});

route('GET', '/api/properties', ({ query }) => {
  const where = ["status = 'active'", "approval = 'approved'"], params = [];
  const q = Object.fromEntries(query);
  if (q.ids) {
    const ids = q.ids.split(',').map(Number).filter(Boolean).slice(0, 100);
    if (!ids.length) return { items: [], total: 0, page: 1, pages: 1 };
    where.push(`id IN (${ids.map(() => '?').join(',')})`); params.push(...ids);
  }
  if (q.deal === 'shitje' || q.deal === 'qira') { where.push('deal = ?'); params.push(q.deal); }
  if (q.city) { where.push('city = ?'); params.push(q.city); }
  if (q.type && TYPES.includes(q.type)) { where.push('type = ?'); params.push(q.type); }
  if (q.min) { where.push('price >= ?'); params.push(int(q.min)); }
  if (q.max) { where.push('price <= ?'); params.push(int(q.max)); }
  if (q.rooms) { where.push('rooms >= ?'); params.push(int(q.rooms)); }
  if (q.minArea) { where.push('area >= ?'); params.push(int(q.minArea)); }
  if (q.furnished === '1') where.push('furnished = 1');
  if (q.parking === '1') where.push('parking > 0');
  if (q.featured === '1') where.push('featured = 1');
  if (q.exclude) { where.push('id != ?'); params.push(int(q.exclude)); }
  if (q.q) { where.push('(title LIKE ? OR zone LIKE ? OR city LIKE ? OR code LIKE ? OR address LIKE ?)'); const like = `%${str(q.q, 80)}%`; params.push(like, like, like, like, like); }
  const order = SORTS[q.sort] || 'featured DESC, created_at DESC';
  const limit = Math.min(48, Math.max(1, int(q.limit, 12)));
  const total = db.prepare(`SELECT COUNT(*) AS n FROM properties WHERE ${where.join(' AND ')}`).get(...params).n;
  const pages = Math.max(1, Math.ceil(total / limit));
  const page = Math.min(pages, Math.max(1, int(q.page, 1)));
  const items = db.prepare(`SELECT * FROM properties WHERE ${where.join(' AND ')} ORDER BY ${order}, id DESC LIMIT ? OFFSET ?`).all(...params, limit, (page - 1) * limit).map(hydrate);
  return { items, total, page, pages };
});

route('GET', '/api/properties/:id', ({ params, req }) => {
  const id = int(params.id);
  const staff = currentUser(req);
  const p = db.prepare('SELECT * FROM properties WHERE id = ?').get(id);
  // Stafi sheh edhe pronat në pritje (parapamje); vizitorët vetëm ato të miratuara
  const visible = p && (staff ? (isAdmin(staff) || p.agent_id === staff.agent_id || (p.approval === 'approved' && p.status !== 'hidden')) : (p.approval === 'approved' && p.status !== 'hidden'));
  if (!visible) throw new HttpError(404, 'Prona nuk u gjet ose nuk është më në ofertë.');
  if (!staff) db.prepare('UPDATE properties SET views = views + 1 WHERE id = ?').run(id);
  const agent = p.agent_id ? db.prepare('SELECT id, name, role, phone, email, photo FROM agents WHERE id = ?').get(p.agent_id) : null;
  return { ...hydrate(p), agent };
});

route('GET', '/api/agents', () => db.prepare('SELECT a.id, a.name, a.role, a.phone, a.email, a.photo, a.bio, a.level, (SELECT COUNT(*) FROM properties p WHERE p.agent_id = a.id AND p.status = \'active\' AND p.approval = \'approved\') AS listings FROM agents a ORDER BY a.level DESC, a.id').all());

route('POST', '/api/inquiries', async ({ req }) => {
  rateLimit(req, 'inq');
  const b = await readBody(req);
  if (b.website) return { ok: true }; // fushë kurth për spam
  const kind = ['contact', 'property', 'visit', 'valuation'].includes(b.kind) ? b.kind : 'contact';
  const name = str(b.name, 100), phone = str(b.phone, 40), email = str(b.email, 120), message = str(b.message, 2000);
  if (!name) throw new HttpError(400, 'Shkruani emrin tuaj.');
  if (!phone && !email) throw new HttpError(400, 'Lini një numër telefoni ose email që t’ju kontaktojmë.');
  if (email && !isEmail(email)) throw new HttpError(400, 'Adresa e email-it nuk duket e saktë.');
  if (phone && phone.replace(/\D/g, '').length < 7) throw new HttpError(400, 'Numri i telefonit duket i paplotë.');
  const pid = b.property_id ? int(b.property_id, null) : null;
  if (pid && !db.prepare("SELECT 1 FROM properties WHERE id = ? AND approval = 'approved'").get(pid)) throw new HttpError(400, 'Prona nuk ekziston.');
  const r = db.prepare('INSERT INTO inquiries (kind, name, phone, email, message, property_id) VALUES (?,?,?,?,?,?)').run(kind, name, phone, email, message, pid);
  try { crm.fromInquiry(Number(r.lastInsertRowid)); } catch (e) { console.error('CRM:', e); } // kërkesa ruhet edhe nëse CRM dështon
  return { ok: true, message: 'Faleminderit! Një agjent do t’ju kontaktojë së shpejti.' };
});

route('POST', '/api/subscribe', async ({ req }) => {
  rateLimit(req, 'sub', 5);
  const email = str((await readBody(req)).email, 120).toLowerCase();
  if (!isEmail(email)) throw new HttpError(400, 'Shkruani një email të vlefshëm.');
  const exists = db.prepare('SELECT 1 FROM subscribers WHERE email = ?').get(email);
  if (!exists) db.prepare('INSERT INTO subscribers (email) VALUES (?)').run(email);
  return { ok: true, message: exists ? 'Jeni tashmë në listë – faleminderit!' : 'U regjistruat. Do t’ju dërgojmë pronat e reja.' };
});

route('POST', '/api/chat', async ({ req }) => {
  rateLimit(req, 'chat', 60, 5 * 60 * 1000);
  const b = await readBody(req, 5000);
  return chat.answer(str(b.message, 400));
});
route('GET', '/api/chat/quick', () => ({ quick: chat.QUICK }));

// Administrimi
route('POST', '/api/admin/login', async ({ req, res }) => {
  rateLimit(req, 'login', 10, 15 * 60 * 1000);
  const b = await readBody(req);
  const u = db.prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE').get(str(b.username, 60));
  if (!u || !verifyPassword(str(b.password, 200), u.password_hash, u.salt)) throw new HttpError(401, 'Përdoruesi ose fjalëkalimi është i gabuar.');
  if (!u.active || (u.role === 'agent' && !u.agent_id)) throw new HttpError(403, 'Llogaria juaj është çaktivizuar. Kontaktoni administratorin.');
  const token = crypto.randomBytes(32).toString('hex');
  const maxAge = 7 * 24 * 3600;
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now());
  db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?,?,?)').run(token, u.id, Date.now() + maxAge * 1000);
  res.setHeader('Set-Cookie', `sid=${token}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
  return { ok: true, ...me(u) };
});
function me(u) {
  const agent = u.agent_id ? db.prepare('SELECT id, name FROM agents WHERE id = ?').get(u.agent_id) : null;
  return { username: u.username, role: u.role, agent };
}
route('POST', '/api/admin/logout', ({ req, res }) => {
  const t = cookies(req).sid; if (t) db.prepare('DELETE FROM sessions WHERE token = ?').run(t);
  res.setHeader('Set-Cookie', 'sid=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax');
  return { ok: true };
});
route('GET', '/api/admin/me', ({ req }) => me(requireStaff(req)));
route('POST', '/api/admin/password', async ({ req }) => {
  const u = requireStaff(req), b = await readBody(req);
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(u.id);
  if (!verifyPassword(str(b.current, 200), row.password_hash, row.salt)) throw new HttpError(400, 'Fjalëkalimi aktual është i gabuar.');
  if (str(b.next, 200).length < 8) throw new HttpError(400, 'Fjalëkalimi i ri duhet të ketë të paktën 8 karaktere.');
  const { hash, salt } = hashPassword(str(b.next, 200));
  db.prepare('UPDATE users SET password_hash = ?, salt = ? WHERE id = ?').run(hash, salt, u.id);
  return { ok: true, message: 'Fjalëkalimi u ndryshua.' };
});

route('GET', '/api/admin/stats', ({ req }) => {
  const u = requireStaff(req), admin = isAdmin(u);
  const pw = admin ? '1=1' : 'agent_id = ?', pp = admin ? [] : [u.agent_id];
  const iw = admin ? '1=1' : 'p.agent_id = ?';
  const s = db.prepare(`SELECT COUNT(*) AS total, SUM(status='active' AND approval='approved') AS active, SUM(status='sold') AS sold, SUM(status='rented') AS rented, SUM(views) AS views, SUM(approval='pending') AS pending, SUM(approval='rejected') AS rejected FROM properties WHERE ${pw}`).get(...pp);
  const inq = db.prepare(`SELECT COUNT(*) AS total, SUM(i.status='new') AS new FROM inquiries i LEFT JOIN properties p ON p.id = i.property_id WHERE ${iw}`).get(...pp);
  const subs = admin ? db.prepare('SELECT COUNT(*) AS n FROM subscribers').get().n : null;
  const top = db.prepare(`SELECT id, code, title, views FROM properties WHERE ${pw} ORDER BY views DESC LIMIT 5`).all(...pp);
  const recent = db.prepare(`SELECT i.*, p.title AS property_title, p.code AS property_code FROM inquiries i LEFT JOIN properties p ON p.id = i.property_id WHERE ${iw} ORDER BY i.created_at DESC, i.id DESC LIMIT 6`).all(...pp);
  return { properties: s, inquiries: inq, subscribers: subs, top, recent };
});

route('GET', '/api/admin/properties', ({ req, query }) => {
  const u = requireStaff(req);
  const q = str(query.get('q'), 80), status = query.get('status'), approval = query.get('approval');
  const where = ['1=1'], params = [];
  if (!isAdmin(u)) { where.push('p.agent_id = ?'); params.push(u.agent_id); }
  if (q) { where.push('(title LIKE ? OR code LIKE ? OR city LIKE ? OR zone LIKE ?)'); params.push(...Array(4).fill(`%${q}%`)); }
  if (['active', 'sold', 'rented', 'hidden'].includes(status)) { where.push('status = ?'); params.push(status); }
  if (['pending', 'approved', 'rejected'].includes(approval)) { where.push('approval = ?'); params.push(approval); }
  return db.prepare(`SELECT p.*, a.name AS agent_name FROM properties p LEFT JOIN agents a ON a.id = p.agent_id WHERE ${where.join(' AND ')} ORDER BY p.created_at DESC, p.id DESC`).all(...params).map(hydrate);
});
route('GET', '/api/admin/properties/:id', ({ req, params }) => hydrate(ownProperty(requireStaff(req), int(params.id))));
route('POST', '/api/admin/properties', async ({ req }) => {
  const u = requireStaff(req);
  const p = propertyInput(await readBody(req));
  p.created_by = u.id;
  if (isAdmin(u)) p.approval = 'approved';
  else { p.agent_id = u.agent_id; p.featured = 0; p.approval = 'pending'; p.review_note = ''; }
  const keys = Object.keys(p);
  const r = db.prepare(`INSERT INTO properties (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`).run(...Object.values(p));
  const id = Number(r.lastInsertRowid);
  db.prepare('UPDATE properties SET code = ? WHERE id = ?').run(`DLX-${1000 + id}`, id);
  return hydrate(db.prepare('SELECT * FROM properties WHERE id = ?').get(id));
});
route('PUT', '/api/admin/properties/:id', async ({ req, params }) => {
  const u = requireStaff(req), id = int(params.id);
  const old = ownProperty(u, id);
  const p = propertyInput(await readBody(req));
  // Ndryshimet e agjentit kthehen për miratim; agjenti nuk e ndryshon agjentin ose “të përzgjedhurën”
  if (!isAdmin(u)) { p.agent_id = u.agent_id; p.featured = old.featured; p.approval = 'pending'; p.review_note = ''; }
  db.prepare(`UPDATE properties SET ${Object.keys(p).map(k => `${k} = ?`).join(', ')}, updated_at = datetime('now') WHERE id = ?`).run(...Object.values(p), id);
  return hydrate(db.prepare('SELECT * FROM properties WHERE id = ?').get(id));
});
route('PATCH', '/api/admin/properties/:id', async ({ req, params }) => {
  const u = requireStaff(req), b = await readBody(req), id = int(params.id);
  ownProperty(u, id);
  if (('featured' in b || 'approval' in b) && !isAdmin(u)) throw new HttpError(403, 'Vetëm administratori mund ta bëjë këtë.');
  if ('featured' in b) db.prepare("UPDATE properties SET featured = ?, updated_at = datetime('now') WHERE id = ?").run(b.featured ? 1 : 0, id);
  if (['approved', 'rejected', 'pending'].includes(b.approval)) db.prepare("UPDATE properties SET approval = ?, review_note = ?, updated_at = datetime('now') WHERE id = ?").run(b.approval, b.approval === 'rejected' ? str(b.review_note, 500) : '', id);
  if (['active', 'sold', 'rented', 'hidden'].includes(b.status)) db.prepare("UPDATE properties SET status = ?, updated_at = datetime('now') WHERE id = ?").run(b.status, id);
  return hydrate(db.prepare('SELECT * FROM properties WHERE id = ?').get(id));
});
route('DELETE', '/api/admin/properties/:id', ({ req, params }) => {
  const u = requireStaff(req);
  const p = ownProperty(u, int(params.id));
  if (!isAdmin(u) && p.approval === 'approved') throw new HttpError(403, 'Pronat e miratuara nuk fshihen nga agjenti – shënojeni “E fshehur”, “E shitur” ose “E dhënë me qira”.');
  for (const img of JSON.parse(p.images || '[]')) if (img.startsWith('/uploads/')) fs.rm(path.join(UPLOADS, path.basename(img)), () => {});
  db.prepare('DELETE FROM properties WHERE id = ?').run(int(params.id));
  return { ok: true };
});

route('POST', '/api/admin/upload', async ({ req }) => {
  requireStaff(req);
  const b = await readBody(req, 12 * 1024 * 1024);
  const m = /^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/.exec(String(b.data || ''));
  if (!m) throw new HttpError(400, 'Lejohen vetëm foto JPG, PNG ose WEBP.');
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > 8 * 1024 * 1024) throw new HttpError(413, 'Fotoja duhet të jetë më e vogël se 8 MB.');
  const name = `${Date.now()}-${crypto.randomBytes(5).toString('hex')}.${m[1] === 'jpeg' ? 'jpg' : m[1]}`;
  fs.writeFileSync(path.join(UPLOADS, name), buf);
  return { url: `/uploads/${name}` };
});

route('GET', '/api/admin/inquiries', ({ req, query }) => {
  const u = requireStaff(req);
  const status = query.get('status'), where = [], params = [];
  if (!isAdmin(u)) { where.push('p.agent_id = ?'); params.push(u.agent_id); }
  if (['new', 'contacted', 'closed'].includes(status)) { where.push('i.status = ?'); params.push(status); }
  return db.prepare(`SELECT i.*, p.title AS property_title, p.code AS property_code FROM inquiries i LEFT JOIN properties p ON p.id = i.property_id ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY i.created_at DESC, i.id DESC`).all(...params);
});
route('PATCH', '/api/admin/inquiries/:id', async ({ req, params }) => {
  const u = requireStaff(req);
  const b = await readBody(req);
  if (!isAdmin(u)) {
    const own = db.prepare('SELECT 1 FROM inquiries i JOIN properties p ON p.id = i.property_id WHERE i.id = ? AND p.agent_id = ?').get(int(params.id), u.agent_id);
    if (!own) throw new HttpError(403, 'Kjo kërkesë nuk është për pronat tuaja.');
  }
  if (!['new', 'contacted', 'closed'].includes(b.status)) throw new HttpError(400, 'Status i pavlefshëm.');
  db.prepare('UPDATE inquiries SET status = ? WHERE id = ?').run(b.status, int(params.id));
  return { ok: true };
});
route('DELETE', '/api/admin/inquiries/:id', ({ req, params }) => { requireAdmin(req); db.prepare('DELETE FROM inquiries WHERE id = ?').run(int(params.id)); return { ok: true }; });

route('GET', '/api/admin/agents', ({ req }) => {
  const u = requireStaff(req);
  const rows = db.prepare('SELECT a.*, (SELECT COUNT(*) FROM properties p WHERE p.agent_id = a.id) AS listings, us.username, us.active AS login_active FROM agents a LEFT JOIN users us ON us.agent_id = a.id AND us.role = \'agent\' ORDER BY a.level DESC, a.id').all();
  return isAdmin(u) ? rows : rows.map(({ username, login_active, ...a }) => a);
});
// Krijon, ndryshon ose çaktivizon llogarinë e hyrjes së agjentit
function saveAgentLogin(agentId, b, isNew) {
  const username = str(b.username, 60).toLowerCase(), password = str(b.password, 200);
  const existing = db.prepare("SELECT * FROM users WHERE agent_id = ? AND role = 'agent'").get(agentId);
  const active = b.login_active === false || b.login_active === 'false' || b.login_active === 0 ? 0 : 1;
  if (!username && !existing) return;
  if (username && !/^[a-z0-9._-]{3,40}$/.test(username)) throw new HttpError(400, 'Përdoruesi duhet të ketë 3–40 shkronja latine, shifra, pikë ose vizë (pa hapësira).');
  const taken = username && db.prepare('SELECT id FROM users WHERE username = ? COLLATE NOCASE').get(username);
  if (taken && (!existing || taken.id !== existing.id)) throw new HttpError(400, `Përdoruesi “${username}” është i zënë. Zgjidhni një tjetër.`);
  if (password && password.length < 8) throw new HttpError(400, 'Fjalëkalimi i agjentit duhet të ketë të paktën 8 karaktere.');
  if (!existing) {
    if (!password) throw new HttpError(400, 'Vendosni një fjalëkalim për hyrjen e agjentit.');
    const { hash, salt } = hashPassword(password);
    db.prepare("INSERT INTO users (username, password_hash, salt, role, agent_id, active) VALUES (?,?,?,'agent',?,?)").run(username, hash, salt, agentId, active);
    return;
  }
  if (username && username !== existing.username) db.prepare('UPDATE users SET username = ? WHERE id = ?').run(username, existing.id);
  if (password) { const { hash, salt } = hashPassword(password); db.prepare('UPDATE users SET password_hash = ?, salt = ? WHERE id = ?').run(hash, salt, existing.id); }
  db.prepare('UPDATE users SET active = ? WHERE id = ?').run(active, existing.id);
  if (!active || password) db.prepare('DELETE FROM sessions WHERE user_id = ?').run(existing.id); // e nxjerr nga paneli
}
function agentInput(b) {
  const a = { name: str(b.name, 100), role: str(b.role, 80) || 'Agjent', phone: str(b.phone, 40), email: str(b.email, 120), photo: str(b.photo, 600), bio: str(b.bio, 600), level: Math.min(10, Math.max(1, int(b.level, 2))) };
  if (!a.name) throw new HttpError(400, 'Emri i agjentit është i detyrueshëm.');
  if (a.email && !isEmail(a.email)) throw new HttpError(400, 'Email i pavlefshëm.');
  return a;
}
route('POST', '/api/admin/agents', async ({ req }) => {
  requireAdmin(req); const b = await readBody(req), a = agentInput(b);
  db.exec('BEGIN');
  try {
    const r = db.prepare('INSERT INTO agents (name, role, phone, email, photo, bio, level) VALUES (?,?,?,?,?,?,?)').run(a.name, a.role, a.phone, a.email, a.photo, a.bio, a.level);
    const id = Number(r.lastInsertRowid);
    saveAgentLogin(id, b, true);
    db.exec('COMMIT');
    return db.prepare('SELECT * FROM agents WHERE id = ?').get(id);
  } catch (e) { db.exec('ROLLBACK'); throw e; }
});
route('PUT', '/api/admin/agents/:id', async ({ req, params }) => {
  requireAdmin(req); const b = await readBody(req), a = agentInput(b), id = int(params.id);
  if (!db.prepare('SELECT 1 FROM agents WHERE id = ?').get(id)) throw new HttpError(404, 'Agjenti nuk u gjet.');
  db.exec('BEGIN');
  try {
    db.prepare('UPDATE agents SET name=?, role=?, phone=?, email=?, photo=?, bio=?, level=? WHERE id=?').run(a.name, a.role, a.phone, a.email, a.photo, a.bio, a.level, id);
    saveAgentLogin(id, b, false);
    db.exec('COMMIT');
  } catch (e) { db.exec('ROLLBACK'); throw e; }
  return db.prepare('SELECT * FROM agents WHERE id = ?').get(id);
});
route('DELETE', '/api/admin/agents/:id', ({ req, params }) => {
  requireAdmin(req); const id = int(params.id);
  db.prepare("DELETE FROM users WHERE agent_id = ? AND role = 'agent'").run(id);
  db.prepare('DELETE FROM agents WHERE id = ?').run(id);
  return { ok: true };
});

route('GET', '/api/admin/subscribers', ({ req }) => { requireAdmin(req); return db.prepare('SELECT * FROM subscribers ORDER BY created_at DESC').all(); });
route('DELETE', '/api/admin/subscribers/:id', ({ req, params }) => { requireAdmin(req); db.prepare('DELETE FROM subscribers WHERE id = ?').run(int(params.id)); return { ok: true }; });

crm.register({ route, HttpError, readBody, requireStaff, isAdmin, str, int });

/* ---------- skedarët statikë ---------- */
function serveStatic(req, res, pathname) {
  let base = PUBLIC, rel = pathname;
  if (pathname.startsWith('/uploads/')) { base = UPLOADS; rel = pathname.slice('/uploads'.length); }
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.normalize(path.join(base, decodeURIComponent(rel)));
  if (!file.startsWith(base)) return send(res, 403, 'Ndalohet');
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) {
      const nf = path.join(PUBLIC, '404.html');
      res.writeHead(404, { 'Content-Type': MIME['.html'] });
      return fs.createReadStream(nf).on('error', () => res.end('Faqja nuk u gjet')).pipe(res);
    }
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600', 'X-Content-Type-Options': 'nosniff' });
    fs.createReadStream(file).pipe(res);
  });
}

/* ---------- serveri ---------- */
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (!url.pathname.startsWith('/api/')) {
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Metodë e palejuar');
    return serveStatic(req, res, url.pathname);
  }
  for (const r of routes) {
    if (r.method !== req.method) continue;
    const m = r.re.exec(url.pathname);
    if (!m) continue;
    try {
      const out = await r.handler({ req, res, params: m.groups || {}, query: url.searchParams });
      return send(res, 200, out);
    } catch (e) {
      if (!(e instanceof HttpError)) console.error(e);
      return send(res, e.status || 500, { error: e instanceof HttpError ? e.message : 'Ndodhi një gabim në server. Provoni sërish.' });
    }
  }
  send(res, 404, { error: 'Adresa e API-t nuk ekziston.' });
});

server.listen(config.port, () => console.log(`De Luxe Real Estate po punon në http://localhost:${config.port}  ·  Paneli: http://localhost:${config.port}/admin/`));
