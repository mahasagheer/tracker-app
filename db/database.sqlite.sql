-- Enable foreign keys
PRAGMA foreign_keys = ON;

CREATE TABLE companies (
    id TEXT PRIMARY KEY, -- UUID as TEXT
    name TEXT NOT NULL,
    domain TEXT UNIQUE NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE admins (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    timezone TEXT,
    company_id TEXT REFERENCES companies(id),
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT NOT NULL,
    completion_rate INTEGER NOT NULL,
    daily_work_limit INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    admin_id TEXT NOT NULL REFERENCES admins(id),
    company_id TEXT NOT NULL REFERENCES companies(id)
);

CREATE TABLE employees (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT,
    company_id TEXT REFERENCES companies(id),
    assigned_email TEXT,
    role TEXT,
    is_active INTEGER DEFAULT 1, -- 1 for true, 0 for false
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE project_members (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    assigned_at TEXT DEFAULT (datetime('now')),
    UNIQUE (project_id, employee_id)
);

CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    employee_id TEXT REFERENCES employees(id),
    start_time TEXT,
    end_time TEXT,
    total_duration_minutes INTEGER,
    is_synced INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    last_modified TEXT DEFAULT (datetime('now')),
    deleted_at TEXT
);

CREATE TABLE screenshots (
    id TEXT PRIMARY KEY,
    session_id TEXT REFERENCES sessions(id),
    employee_id TEXT REFERENCES employees(id),
    image_path TEXT,
    captured_at TEXT,
    is_synced INTEGER DEFAULT 0,
    last_modified TEXT DEFAULT (datetime('now')),
    deleted_at TEXT
);

CREATE TABLE activitylogs (
    id TEXT PRIMARY KEY,
    session_id TEXT REFERENCES sessions(id),
    employee_id TEXT REFERENCES employees(id),
    click_count INTEGER,
    key_count INTEGER,
    timestamp TEXT,
    is_synced INTEGER DEFAULT 0,
    last_modified TEXT DEFAULT (datetime('now')),
    deleted_at TEXT
);

CREATE TABLE settings (
    id TEXT PRIMARY KEY,
    employee_id TEXT REFERENCES employees(id),
    screenshot_interval_minutes INTEGER,
    track_mouse INTEGER, -- 1 for true, 0 for false
    track_keyboard INTEGER -- 1 for true, 0 for false
);

-- Optional: Sync log for tracking changes
CREATE TABLE sync_log (
    id TEXT PRIMARY KEY,
    table_name TEXT,
    row_id TEXT,
    action TEXT, -- 'insert', 'update', 'delete'
    timestamp TEXT DEFAULT (datetime('now')),
    is_synced INTEGER DEFAULT 0
); 