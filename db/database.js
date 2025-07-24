const path = require('path');
const { app } = require('electron');
const Database = require('better-sqlite3');
const fs = require('fs');

// Ensure this runs only in main process
const dbPath = path.join(app.getPath('userData'), 'trackerapp.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

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
  mouse_events INTEGER,
  keyboard_events INTEGER,
  productivity REAL,
  mouse_activity_percent REAL,
  keyboard_activity_percent REAL,
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

// Ensure mouse_events, keyboard_events, and productivity columns exist for ActivityLogs (for existing DBs)
try {
  db.exec(`ALTER TABLE ActivityLogs ADD COLUMN mouse_events INTEGER;`);
} catch (e) {
  if (!e.message.includes('duplicate column name')) throw e;
}
try {
  db.exec(`ALTER TABLE ActivityLogs ADD COLUMN keyboard_events INTEGER;`);
} catch (e) {
  if (!e.message.includes('duplicate column name')) throw e;
}
try {
  db.exec(`ALTER TABLE ActivityLogs ADD COLUMN productivity REAL;`);
} catch (e) {
  if (!e.message.includes('duplicate column name')) throw e;
}
try {
  db.exec(`ALTER TABLE ActivityLogs ADD COLUMN mouse_activity_percent REAL;`);
} catch (e) {
  if (!e.message.includes('duplicate column name')) throw e;
}
try {
  db.exec(`ALTER TABLE ActivityLogs ADD COLUMN keyboard_activity_percent REAL;`);
} catch (e) {
  if (!e.message.includes('duplicate column name')) throw e;
}
try {
  db.exec(`ALTER TABLE ActivityLogs ADD COLUMN productivity_percent REAL;`);
} catch (e) {
  if (!e.message.includes('duplicate column name')) throw e;
}

// Remove click_count and key_count columns from ActivityLogs if they exist, and ensure id is PRIMARY KEY
try {
  const pragma = db.prepare("PRAGMA table_info(ActivityLogs)").all();
  const hasClick = pragma.some(col => col.name === 'click_count');
  const hasKey = pragma.some(col => col.name === 'key_count');
  const hasPK = pragma.some(col => col.name === 'id' && col.pk === 1);
  if (hasClick || hasKey || !hasPK) {
    // Create new table with correct schema
    db.exec(`CREATE TABLE IF NOT EXISTS ActivityLogs_new (
      id TEXT PRIMARY KEY,
      session_id TEXT,
      employee_id TEXT,
      mouse_events INTEGER,
      keyboard_events INTEGER,
      productivity REAL,
      mouse_activity_percent REAL,
      keyboard_activity_percent REAL,
      timestamp TIMESTAMP,
      is_synced BOOLEAN DEFAULT 0,
      last_modified TEXT DEFAULT (datetime('now')),
      deleted_at TEXT,
      FOREIGN KEY (session_id) REFERENCES Sessions(id),
      FOREIGN KEY (employee_id) REFERENCES Employees(id)
    );`);
    // Copy data from old table (only columns that exist in new schema)
    const keepCols = [
      'id','session_id','employee_id','mouse_events','keyboard_events','productivity',
      'mouse_activity_percent','keyboard_activity_percent','timestamp','is_synced','last_modified','deleted_at'
    ];
    const existingCols = pragma.map(col => col.name).filter(name => keepCols.includes(name));
    db.exec(`INSERT INTO ActivityLogs_new (${existingCols.join(',')}) SELECT ${existingCols.join(',')} FROM ActivityLogs`);
    db.exec(`DROP TABLE ActivityLogs`);
    db.exec(`ALTER TABLE ActivityLogs_new RENAME TO ActivityLogs`);
  }
} catch (e) {
  // Ignore errors if columns do not exist
}

// Upsert helpers for sync
function upsert(table, row) {
  // Convert booleans to 0/1 for SQLite
  for (const key in row) {
    if (typeof row[key] === 'boolean') {
      row[key] = row[key] ? 1 : 0;
    }
  }

  if (table === 'Employees' && row.email) {
    const existing = db.prepare('SELECT id, last_modified FROM Employees WHERE email = ?').get(row.email);
    if (existing) {
      // If the id is different, update the id to match the incoming row
      if (existing.id !== row.id) {
        db.prepare('UPDATE Employees SET id = @id WHERE email = @email').run({ id: row.id, email: row.email });
      }
      // Only update if the incoming record is newer
      if (!row.last_modified || new Date(row.last_modified) > new Date(existing.last_modified)) {
        const fields = Object.keys(row).filter(f => f !== 'id');
        const updates = fields.map(f => `${f} = @${f}`).join(', ');
        const sql = `UPDATE Employees SET ${updates} WHERE id = @id`;
        db.prepare(sql).run(row);
      }
      return;
    }
  }
  if (table === 'Companies' && row.domain) {
    const existing = db.prepare('SELECT id, last_modified FROM Companies WHERE domain = ?').get(row.domain);
    if (existing) {
      if (existing.id !== row.id) {
        db.prepare('UPDATE Companies SET id = @id WHERE domain = @domain').run({ id: row.id, domain: row.domain });
      }
      if (!row.last_modified || new Date(row.last_modified) > new Date(existing.last_modified)) {
        const fields = Object.keys(row).filter(f => f !== 'id');
        const updates = fields.map(f => `${f} = @${f}`).join(', ');
        const sql = `UPDATE Companies SET ${updates} WHERE id = @id`;
        db.prepare(sql).run(row);
      }
      return;
    }
  }

  // Default upsert by id
  const fields = Object.keys(row);
  const placeholders = fields.map(f => `@${f}`);
  const updates = fields.filter(f => f !== 'id').map(f => `${f} = @${f}`);
  const sql = `INSERT INTO ${table} (${fields.join(',')}) VALUES (${placeholders.join(',')})\nON CONFLICT(id) DO UPDATE SET ${updates.join(', ')}\nWHERE last_modified < @last_modified`;
  db.prepare(sql).run(row);
}

function getUnsynced(table, lastSync) {
  return db.prepare(`SELECT * FROM ${table} WHERE last_modified > ?`).all(lastSync);
}

// Utility to delete all data from all tables (but keep schema)
function clearAllData() {
  const tables = [
    'ActivityLogs',
    'Screenshots',
    'Sessions',
    'Employees',
    'Companies',
    'Admins',
    'Settings'
  ];
  for (const table of tables) {
    db.exec(`DELETE FROM ${table}`);
  }
}

module.exports = {
  db,
  upsert,
  getUnsynced,
  clearAllData
}; 