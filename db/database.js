const path = require('path');
const { app } = require('electron');
const Database = require('better-sqlite3');
const fs = require('fs');

// Ensure this runs only in main process
const dbPath = path.join(app.getPath('userData'), 'trackerapp.db');
const db = new Database(dbPath);

// Schema setup (run only once)
db.exec(`
CREATE TABLE IF NOT EXISTS Companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  domain TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TEXT DEFAULT (datetime('now')),
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS Employees (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  password TEXT,
  company_id TEXT,
  assigned_email TEXT,
  role TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TEXT DEFAULT (datetime('now')),
  deleted_at TEXT,
  FOREIGN KEY (company_id) REFERENCES Companies(id)
);

CREATE TABLE IF NOT EXISTS Admins (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Sessions (
  id TEXT PRIMARY KEY,
  employee_id TEXT,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  total_duration_minutes INTEGER,
  is_synced BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TEXT DEFAULT (datetime('now')),
  deleted_at TEXT,
  FOREIGN KEY (employee_id) REFERENCES Employees(id)
);

CREATE TABLE IF NOT EXISTS Screenshots (
  id TEXT PRIMARY KEY,
  session_id TEXT,
  employee_id TEXT,
  image_path TEXT,
  captured_at TIMESTAMP,
  is_synced BOOLEAN DEFAULT 0,
  last_modified TEXT DEFAULT (datetime('now')),
  deleted_at TEXT,
  FOREIGN KEY (session_id) REFERENCES Sessions(id),
  FOREIGN KEY (employee_id) REFERENCES Employees(id)
);

CREATE TABLE IF NOT EXISTS ActivityLogs (
  id TEXT PRIMARY KEY,
  session_id TEXT,
  employee_id TEXT,
  click_count INTEGER,
  key_count INTEGER,
  timestamp TIMESTAMP,
  is_synced BOOLEAN DEFAULT 0,
  last_modified TEXT DEFAULT (datetime('now')),
  deleted_at TEXT,
  FOREIGN KEY (session_id) REFERENCES Sessions(id),
  FOREIGN KEY (employee_id) REFERENCES Employees(id)
);

CREATE TABLE IF NOT EXISTS Settings (
  id TEXT PRIMARY KEY,
  employee_id TEXT,
  screenshot_interval_minutes INTEGER,
  track_mouse BOOLEAN,
  track_keyboard BOOLEAN,
  FOREIGN KEY (employee_id) REFERENCES Employees(id)
);
`);

// Ensure last_modified and deleted_at columns exist for Employees (for existing DBs)
try {
  db.exec(`ALTER TABLE Employees ADD COLUMN last_modified TEXT DEFAULT (datetime('now'));`);
} catch (e) {
  if (!e.message.includes('duplicate column name')) throw e;
}
try {
  db.exec(`ALTER TABLE Employees ADD COLUMN deleted_at TEXT;`);
} catch (e) {
  if (!e.message.includes('duplicate column name')) throw e;
}
// Ensure last_modified and deleted_at columns exist for Companies (for existing DBs)
try {
  db.exec(`ALTER TABLE Companies ADD COLUMN last_modified TEXT DEFAULT (datetime('now'));`);
} catch (e) {
  if (!e.message.includes('duplicate column name')) throw e;
}
try {
  db.exec(`ALTER TABLE Companies ADD COLUMN deleted_at TEXT;`);
} catch (e) {
  if (!e.message.includes('duplicate column name')) throw e;
}

// Upsert helpers for sync
function upsert(table, row) {
  // Convert booleans to 0/1 for SQLite
  for (const key in row) {
    if (typeof row[key] === 'boolean') {
      row[key] = row[key] ? 1 : 0;
    }
  }
  const fields = Object.keys(row);
  const placeholders = fields.map(f => `@${f}`);
  const updates = fields.filter(f => f !== 'id').map(f => `${f} = @${f}`);
  const sql = `INSERT INTO ${table} (${fields.join(',')}) VALUES (${placeholders.join(',')})\nON CONFLICT(id) DO UPDATE SET ${updates.join(', ')}\nWHERE last_modified < @last_modified`;
  db.prepare(sql).run(row);
}

function getUnsynced(table, lastSync) {
  return db.prepare(`SELECT * FROM ${table} WHERE last_modified > ?`).all(lastSync);
}

module.exports = {
  db,
  upsert,
  getUnsynced
}; 