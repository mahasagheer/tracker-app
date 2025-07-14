const pool = require('../db');
const bcrypt = require('bcrypt');

// Admin signup handler - Robust and clear for new structure
exports.signup = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      timezone,
      company_domain,
      company_name
    } = req.body;

    if (!name || !email || !password || !timezone || !company_domain || !company_name) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // Check if admin email already exists
    const existingAdmin = await pool.query('SELECT id FROM admins WHERE email = $1', [email]);
    if (existingAdmin.rows.length > 0) {
      return res.status(409).json({ error: 'Admin with this email already exists.' });
    }

    // Always trim and lowercase the company domain
    const cleanDomain = company_domain.trim().toLowerCase();

    // Check if company already exists by domain
    let company = await pool.query('SELECT id FROM companies WHERE domain = $1', [cleanDomain]);
    let companyId;
    if (company.rows.length === 0) {
      // Create new company if not exists
      const newCompany = await pool.query(
        'INSERT INTO companies (name, domain) VALUES ($1, $2) RETURNING id',
        [company_name, cleanDomain]
      );
      companyId = newCompany.rows[0].id;
    } else {
      companyId = company.rows[0].id;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new admin with company_id as foreign key
    await pool.query(
      `INSERT INTO admins (name, email, password, timezone, company_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [name, email, hashedPassword, timezone, companyId]
    );

    res.status(201).json({ message: 'Admin registered successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// Admin login handler - Updated to join with companies table
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    // Join with companies table to get company details
    const result = await pool.query(`
      SELECT a.*, c.name as company_name, c.domain as company_domain 
      FROM admins a 
      LEFT JOIN companies c ON a.company_id = c.id 
      WHERE a.email = $1
    `, [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    const admin = result.rows[0];
    const match = await bcrypt.compare(password, admin.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    // Return success with admin and company details
    res.json({
      message: 'Login successful',
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        company_domain: admin.company_domain,
        company_name: admin.company_name,
        company_id: admin.company_id
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// Admin logout handler (stateless placeholder)
exports.logout = (req, res) => {
  res.json({ message: 'Logout successful' });
}; 