// Databaza SQLite (modul i integruar në Node.js ≥ 22.13 – pa varësi të jashtme)
const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(path.join(DATA_DIR, 'deluxe.db'));
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

db.exec(`
CREATE TABLE IF NOT EXISTS agents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'Agjent',
  phone TEXT,
  email TEXT,
  photo TEXT,
  bio TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS properties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  deal TEXT NOT NULL CHECK (deal IN ('shitje','qira')),
  type TEXT NOT NULL,
  city TEXT NOT NULL,
  zone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  price INTEGER NOT NULL DEFAULT 0,
  area INTEGER DEFAULT 0,
  rooms INTEGER DEFAULT 0,
  bathrooms INTEGER DEFAULT 0,
  floor TEXT DEFAULT '',
  year_built INTEGER,
  furnished INTEGER DEFAULT 0,
  parking INTEGER DEFAULT 0,
  features TEXT DEFAULT '[]',
  images TEXT DEFAULT '[]',
  lat REAL,
  lng REAL,
  featured INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','sold','rented','hidden')),
  agent_id INTEGER REFERENCES agents(id) ON DELETE SET NULL,
  views INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_prop_search ON properties(status, deal, city, type, price);
CREATE TABLE IF NOT EXISTS inquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT DEFAULT 'contact' CHECK (kind IN ('contact','property','visit','valuation')),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  message TEXT,
  property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new','contacted','closed')),
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
`);

// CRM: leads (portofoli i klientëve), opportunitete (marrëveshjet në faza) dhe historiku i kontakteve
db.exec(`
CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  phone_norm TEXT DEFAULT '',
  email TEXT DEFAULT '',
  client_type TEXT DEFAULT 'bleres',
  source TEXT DEFAULT 'tjeter',
  status TEXT DEFAULT 'active',
  budget_min INTEGER,
  budget_max INTEGER,
  city TEXT DEFAULT '',
  ptype TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  agent_id INTEGER REFERENCES agents(id) ON DELETE SET NULL,
  created_by INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_leads_agent ON leads(agent_id);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone_norm);
CREATE TABLE IF NOT EXISTS opportunities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  agent_id INTEGER REFERENCES agents(id) ON DELETE SET NULL,
  property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  deal TEXT DEFAULT 'shitje',
  stage TEXT DEFAULT 'new',
  value INTEGER DEFAULT 0,
  commission INTEGER DEFAULT 0,
  next_action TEXT DEFAULT '',
  next_date TEXT DEFAULT '',
  lost_reason TEXT DEFAULT '',
  closed_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_opp_agent ON opportunities(agent_id, stage);
CREATE TABLE IF NOT EXISTS activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  opp_id INTEGER REFERENCES opportunities(id) ON DELETE CASCADE,
  user_id INTEGER,
  author TEXT DEFAULT '',
  type TEXT DEFAULT 'note',
  text TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_act_lead ON activities(lead_id);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT DEFAULT '');
`);

// Migrime: shton kolonat e reja në databazat ekzistuese pa humbur të dhëna
const cols = t => db.prepare(`PRAGMA table_info(${t})`).all().map(c => c.name);
const addCol = (t, c, def) => { if (!cols(t).includes(c)) db.exec(`ALTER TABLE ${t} ADD COLUMN ${c} ${def}`); };
addCol('agents', 'level', 'INTEGER DEFAULT 2');  // 1 = praktikant … 10 = themelues & CEO (renditja në faqe)
addCol('users', 'role', "TEXT DEFAULT 'admin'");      // 'admin' ose 'agent'
addCol('users', 'agent_id', 'INTEGER');               // lidhja me profilin e agjentit
addCol('users', 'active', 'INTEGER DEFAULT 1');       // 0 = hyrja e çaktivizuar
addCol('properties', 'approval', "TEXT DEFAULT 'approved'"); // 'pending' | 'approved' | 'rejected'
addCol('properties', 'review_note', "TEXT DEFAULT ''");
addCol('properties', 'created_by', 'INTEGER');
addCol('inquiries', 'lead_id', 'INTEGER');

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}
function verifyPassword(password, hash, salt) {
  const test = crypto.scryptSync(password, salt, 64);
  const known = Buffer.from(hash, 'hex');
  return known.length === test.length && crypto.timingSafeEqual(known, test);
}

// Përdoruesi i parë i administrimit
if (db.prepare('SELECT COUNT(*) AS n FROM users').get().n === 0) {
  const username = process.env.ADMIN_USER || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const { hash, salt } = hashPassword(password);
  db.prepare("INSERT INTO users (username, password_hash, salt, role) VALUES (?,?,?,'admin')").run(username, hash, salt);
  console.log(`\n  Përdoruesi i administrimit u krijua: ${username} / ${password}`);
  console.log('  Ndryshojeni fjalëkalimin nga paneli pas hyrjes së parë.\n');
}

module.exports = { db, hashPassword, verifyPassword };
