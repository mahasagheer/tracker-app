const pool = require('./db');

async function migrate() {
  try {
    // Enable uuid-ossp extension for UUID generation (optional, uncomment if you want auto-generated UUIDs)
    // await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

    // Enable pgcrypto extension for UUID generation
    await pool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');

    // Companies
    await pool.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id UUID PRIMARY KEY,
        name VARCHAR NOT NULL,
        domain VARCHAR UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT now()
      );
    `);

    // Employees
    await pool.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id UUID PRIMARY KEY,
        name VARCHAR,
        email VARCHAR UNIQUE,
        password VARCHAR,
        company_id UUID REFERENCES companies(id),
        assigned_email VARCHAR,
        device_id VARCHAR UNIQUE NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT now()
      );
    `);

    // Admins
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR,
        email VARCHAR UNIQUE NOT NULL,
        password VARCHAR NOT NULL,
        timezone VARCHAR,
        company_domain VARCHAR,
        company_name VARCHAR,
        created_at TIMESTAMP DEFAULT now()
      );
    `);
    // Ensure new columns exist if table was created before
    await pool.query(`
      ALTER TABLE admins
        ADD COLUMN IF NOT EXISTS timezone VARCHAR,
        ADD COLUMN IF NOT EXISTS company_domain VARCHAR,
        ADD COLUMN IF NOT EXISTS company_name VARCHAR;
    `);
    // Ensure id column has default for UUID generation
    await pool.query('ALTER TABLE admins ALTER COLUMN id SET DEFAULT gen_random_uuid();');

    // Sessions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY,
        employee_id UUID REFERENCES employees(id),
        start_time TIMESTAMP,
        end_time TIMESTAMP,
        total_duration_minutes INT,
        is_synced BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT now()
      );
    `);

    // Screenshots
    await pool.query(`
      CREATE TABLE IF NOT EXISTS screenshots (
        id UUID PRIMARY KEY,
        session_id UUID REFERENCES sessions(id),
        employee_id UUID REFERENCES employees(id),
        image_path TEXT,
        captured_at TIMESTAMP,
        is_synced BOOLEAN DEFAULT false
      );
    `);

    // ActivityLogs
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activitylogs (
        id UUID PRIMARY KEY,
        session_id UUID REFERENCES sessions(id),
        employee_id UUID REFERENCES employees(id),
        click_count INT,
        key_count INT,
        timestamp TIMESTAMP,
        is_synced BOOLEAN DEFAULT false
      );
    `);

    // Settings
    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id UUID PRIMARY KEY,
        employee_id UUID REFERENCES employees(id),
        screenshot_interval_minutes INT,
        track_mouse BOOLEAN,
        track_keyboard BOOLEAN
      );
    `);

    console.log('Migration complete!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate(); 