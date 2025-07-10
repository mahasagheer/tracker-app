const pool = require('../db');
const bcrypt = require('bcrypt');

// Admin signup handler
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

    // Check if email already exists
    const existing = await pool.query('SELECT id FROM admins WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Admin with this email already exists.' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new admin (let DB generate id)
    await pool.query(
      `INSERT INTO admins (name, email, password, timezone, company_domain, company_name)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [name, email, hashedPassword, timezone, company_domain, company_name]
    );

    res.status(201).json({ message: 'Admin registered successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
}; 