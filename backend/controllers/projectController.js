const pool = require('../db');

// Create a new project
exports.createProject = async (req, res) => {
  try {
    const { name, status, completion_rate, admin_id, company_id, daily_work_limit } = req.body;
    if (!admin_id || !company_id) {
      return res.status(400).json({ error: 'admin_id and company_id are required' });
    }
    const result = await pool.query(
      `INSERT INTO projects (name, status, completion_rate, admin_id, company_id, daily_work_limit)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, status, completion_rate, admin_id, company_id, daily_work_limit || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all projects for the admin/company
exports.getProjects = async (req, res) => {
  try {
    const { company_id } = req.query;
    if (!company_id) {
      return res.status(400).json({ error: 'company_id is required' });
    }
    const result = await pool.query(
      `SELECT * FROM projects WHERE company_id = $1 ORDER BY created_at DESC`,
      [company_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a project (already exists, but ensure all fields are handled)
exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status, completion_rate, daily_work_limit } = req.body;
    const result = await pool.query(
      `UPDATE projects SET name = $1, status = $2, completion_rate = $3, daily_work_limit = $4 WHERE id = $5 RETURNING *`,
      [name, status, completion_rate, daily_work_limit, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Project not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a project
exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `DELETE FROM projects WHERE id = $1 RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Project not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Assign members to a project (bulk add)
exports.assignMembers = async (req, res) => {
  try {
    const { id } = req.params; // project id
    const { employee_ids } = req.body; // array of employee UUIDs
    if (!Array.isArray(employee_ids) || employee_ids.length === 0) {
      return res.status(400).json({ error: 'employee_ids must be a non-empty array' });
    }
    // Insert all members, ignore duplicates
    const values = employee_ids.map((eid, i) => `($1, $${i + 2})`).join(',');
    const params = [id, ...employee_ids];
    await pool.query(
      `INSERT INTO project_members (project_id, employee_id)
       VALUES ${values}
       ON CONFLICT (project_id, employee_id) DO NOTHING`,
      params
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all members for a project
exports.getMembers = async (req, res) => {
  try {
    const { id } = req.params; // project id
    const result = await pool.query(
      `SELECT e.* FROM project_members pm
       JOIN employees e ON pm.employee_id = e.id
       WHERE pm.project_id = $1`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Remove a member from a project
exports.removeMember = async (req, res) => {
  try {
    const { id, employee_id } = req.params;
    await pool.query(
      `DELETE FROM project_members WHERE project_id = $1 AND employee_id = $2`,
      [id, employee_id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 