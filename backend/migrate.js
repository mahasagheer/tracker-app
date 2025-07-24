const pool = require('./db');

async function migrate() {
  try {
    // Enable pgcrypto extension for UUID generation
    await pool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');

    // Drop and recreate companies table to ensure proper UUID generation
    await pool.query('DROP TABLE IF EXISTS companies CASCADE;');
    
    // Companies - Recreate with proper UUID generation
    await pool.query(`
      CREATE TABLE companies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR NOT NULL,
        domain VARCHAR UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT now(),
        last_modified TIMESTAMP DEFAULT now(),
        deleted_at TIMESTAMP
      );
    `);

    // Drop and recreate admins table to ensure proper foreign key relationship
    await pool.query('DROP TABLE IF EXISTS admins CASCADE;');
    
    // Admins - Updated to include company_id foreign key
    await pool.query(`
      CREATE TABLE admins (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR,
        email VARCHAR UNIQUE NOT NULL,
        password VARCHAR NOT NULL,
        timezone VARCHAR,
        company_id UUID REFERENCES companies(id),
        created_at TIMESTAMP DEFAULT now()
      );
    `);

    // Drop and recreate projects table
    await pool.query('DROP TABLE IF EXISTS projects CASCADE;');
    await pool.query(`
      CREATE TABLE projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        status TEXT NOT NULL,
        completion_rate INTEGER NOT NULL,
        daily_work_limit INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        admin_id UUID NOT NULL REFERENCES admins(id),
        company_id UUID NOT NULL REFERENCES companies(id)
      );
    `);

    // Drop and recreate project_members table
    await pool.query('DROP TABLE IF EXISTS project_members CASCADE;');
    await pool.query(`
      CREATE TABLE project_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (project_id, employee_id)
      );
    `);

    // Drop and recreate employees table
    await pool.query('DROP TABLE IF EXISTS employees CASCADE;');
    
    // Employees
    await pool.query(`
      CREATE TABLE employees (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR,
        email VARCHAR UNIQUE,
        password VARCHAR,
        company_id UUID REFERENCES companies(id),
        assigned_email VARCHAR,
        role VARCHAR,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT now()
      );
    `);

    // Sessions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_id UUID REFERENCES employees(id),
        start_time TIMESTAMP,
        end_time TIMESTAMP,
        total_duration_minutes INT,
        is_synced BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT now(),
        last_modified TIMESTAMP DEFAULT now(),
        deleted_at TIMESTAMP
      );
    `);

    // Screenshots
    await pool.query(`
      CREATE TABLE IF NOT EXISTS screenshots (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID REFERENCES sessions(id),
        employee_id UUID REFERENCES employees(id),
        image_path TEXT,
        captured_at TIMESTAMP,
        is_synced BOOLEAN DEFAULT false,
        last_modified TIMESTAMP DEFAULT now(),
        deleted_at TIMESTAMP
      );
    `);

    // ActivityLogs
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activitylogs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID REFERENCES sessions(id),
        employee_id UUID REFERENCES employees(id),
        mouse_events INT,
        keyboard_events INT,
        productivity FLOAT,
        timestamp TIMESTAMP,
        is_synced BOOLEAN DEFAULT false,
        last_modified TIMESTAMP DEFAULT now(),
        deleted_at TIMESTAMP
      );
    `);

    // Settings
    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_id UUID REFERENCES employees(id),
        screenshot_interval_minutes INT,
        track_mouse BOOLEAN,
        track_keyboard BOOLEAN
      );
    `);

    // Ensure last_modified and deleted_at columns exist for sync (safe for existing data)
    await pool.query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS last_modified TIMESTAMP DEFAULT now();`);
    await pool.query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;`);
    await pool.query(`ALTER TABLE screenshots ADD COLUMN IF NOT EXISTS last_modified TIMESTAMP DEFAULT now();`);
    await pool.query(`ALTER TABLE screenshots ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;`);
    await pool.query(`ALTER TABLE activitylogs ADD COLUMN IF NOT EXISTS last_modified TIMESTAMP DEFAULT now();`);
    await pool.query(`ALTER TABLE activitylogs ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;`);
    await pool.query(`ALTER TABLE activitylogs ADD COLUMN IF NOT EXISTS mouse_events INT;`);
    await pool.query(`ALTER TABLE activitylogs ADD COLUMN IF NOT EXISTS keyboard_events INT;`);
    await pool.query(`ALTER TABLE activitylogs ADD COLUMN IF NOT EXISTS productivity FLOAT;`);

    // Ensure last_modified and deleted_at columns exist for companies (safe for existing data)
    // These lines are now moved up

    // Ensure last_modified and deleted_at columns exist for employees (safe for existing data)
    await pool.query(`ALTER TABLE employees ADD COLUMN IF NOT EXISTS last_modified TIMESTAMP DEFAULT now();`);
    await pool.query(`ALTER TABLE employees ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;`);

    // Ensure all employees have a valid last_modified for sync
    await pool.query(`UPDATE employees SET last_modified = NOW() WHERE last_modified IS NULL OR last_modified < '1970-01-01';`);

    // Ensure all companies have a valid last_modified for sync
    await pool.query(`UPDATE companies SET last_modified = NOW() WHERE last_modified IS NULL OR last_modified < '1970-01-01';`);

    console.log('Migration complete!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate(); 