const pool = require('../db');
const bcrypt = require('bcrypt');

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  // Try admin first
  let result = await pool.query(
    `SELECT a.*, c.name as company_name, c.domain as company_domain
     FROM admins a
     LEFT JOIN companies c ON a.company_id = c.id
     WHERE a.email = $1`, [email]
  );
  if (result.rows.length > 0) {
    const admin = result.rows[0];
    const match = await bcrypt.compare(password, admin.password);
    if (!match) return res.status(401).json({ error: 'Invalid email or password.' });
    return res.json({
      userType: 'admin',
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        company_id: admin.company_id,
        company_domain: admin.company_domain,
        company_name: admin.company_name,
        role: 'Admin'
      }
    });
  }

  // Try employee
  result = await pool.query(
    `SELECT e.*, c.name as company_name, c.domain as company_domain
     FROM employees e
     LEFT JOIN companies c ON e.company_id = c.id
     WHERE e.email = $1`, [email]
  );
  if (result.rows.length > 0) {
    const employee = result.rows[0];
    const match = await bcrypt.compare(password, employee.password);
    if (!match) return res.status(401).json({ error: 'Invalid email or password.' });
    return res.json({
      userType: 'employee',
      user: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        company_id: employee.company_id,
        company_domain: employee.company_domain,
        company_name: employee.company_name,
        role: employee.role
      }
    });
  }

  // Not found
  return res.status(401).json({ error: 'Invalid email or password.' });
}; 