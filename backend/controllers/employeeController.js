const pool = require('../db');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

exports.addEmployee = async (req, res) => {
  try {
    const { name, email, role, assigned_email, company_id } = req.body;
    
    // Validate required fields
    if (!name || !email || !role || !company_id) {
      return res.status(400).json({ 
        error: 'Name, email, role, and company_id are required.' 
      });
    }

    // Check if employee email already exists
    const existingEmployee = await pool.query(
      'SELECT id FROM employees WHERE email = $1', 
      [email]
    );
    if (existingEmployee.rows.length > 0) {
      return res.status(409).json({ 
        error: 'Employee with this email already exists.' 
      });
    }

    // Verify company exists
    const companyExists = await pool.query(
      'SELECT id FROM companies WHERE id = $1', 
      [company_id]
    );
    if (companyExists.rows.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid company_id. Company not found.' 
      });
    }

    // Generate temporary password
    const tempPassword = crypto.randomBytes(8).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 8);
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Insert new employee with all required fields
    const result = await pool.query(
      `INSERT INTO employees (name, email, password, role, assigned_email, company_id, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, email, role, assigned_email, company_id, is_active, created_at`,
      [name, email, hashedPassword, role, assigned_email, company_id, true]
    );

    const newEmployee = result.rows[0];

    // Send email with credentials (if email service is configured)
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER || 'your_email@gmail.com',
          pass: process.env.EMAIL_PASS || 'your_app_password',
        },
      });

      await transporter.sendMail({
        from: process.env.EMAIL_USER || 'your_email@gmail.com',
        to: email,
        subject: 'Your Employee Account Credentials',
        html: `
          <h2>Welcome to the Team!</h2>
          <p>Hello ${name},</p>
          <p>Your employee account has been created successfully.</p>
          <p><strong>Login Details:</strong></p>
          <ul>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Temporary Password:</strong> ${tempPassword}</li>
          </ul>
          <p>Please change your password after your first login.</p>
          <p>Best regards,<br>Your Team</p>
        `,
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail the request if email fails, just log it
    }

    res.status(201).json({ 
      message: 'Employee added successfully.',
      employee: {
        id: newEmployee.id,
        name: newEmployee.name,
        email: newEmployee.email,
        role: newEmployee.role,
        assigned_email: newEmployee.assigned_email,
        company_id: newEmployee.company_id,
        is_active: newEmployee.is_active,
        created_at: newEmployee.created_at
      },
      tempPassword: tempPassword // Include in response for admin reference
    });
  } catch (err) {
    console.error('Error adding employee:', err);
    res.status(500).json({ error: 'Server error while adding employee.' });
  }
};

// Get all employees for a company
exports.getEmployees = async (req, res) => {
  try {
    const { company_id } = req.params;
    
    if (!company_id) {
      return res.status(400).json({ error: 'Company ID is required.' });
    }

    const result = await pool.query(
      `SELECT id, name, email, role, assigned_email, is_active, created_at
       FROM employees 
       WHERE company_id = $1 
       ORDER BY created_at DESC`,
      [company_id]
    );

    res.json({ 
      employees: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('Error fetching employees:', err);
    res.status(500).json({ error: 'Server error while fetching employees.' });
  }
};

// Update employee status
exports.updateEmployeeStatus = async (req, res) => {
  try {
    const { employee_id } = req.params;
    const { is_active } = req.body;
    
    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ error: 'is_active must be a boolean value.' });
    }

    const result = await pool.query(
      'UPDATE employees SET is_active = $1 WHERE id = $2 RETURNING id, name, email, is_active',
      [is_active, employee_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    res.json({ 
      message: 'Employee status updated successfully.',
      employee: result.rows[0]
    });
  } catch (err) {
    console.error('Error updating employee status:', err);
    res.status(500).json({ error: 'Server error while updating employee status.' });
  }
}; 

// Get all employees for a given admin (by admin id)
exports.getEmployeesByAdmin = async (req, res) => {
  try {
    const { admin_id } = req.params;
    if (!admin_id) {
      return res.status(400).json({ error: 'Admin ID is required.' });
    }
    // Find all companies for this admin
    const companies = await pool.query('SELECT id FROM companies WHERE id IN (SELECT company_id FROM admins WHERE id = $1)', [admin_id]);
    if (companies.rows.length === 0) {
      return res.json({ employees: [], count: 0 });
    }
    const companyIds = companies.rows.map(c => c.id);
    // Get all employees for these companies
    const result = await pool.query(
      `SELECT * FROM employees WHERE company_id = ANY($1::uuid[]) ORDER BY created_at DESC`,
      [companyIds]
    );
    res.json({ employees: result.rows, count: result.rows.length });
  } catch (err) {
    console.error('Error fetching employees by admin:', err);
    res.status(500).json({ error: 'Server error while fetching employees.' });
  }
}; 