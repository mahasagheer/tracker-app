const express = require('express');
const router = express.Router();
const pool = require('../db');

// Helper: upsert for a table
async function upsertRecord(table, data, idField = 'id') {
  // Build dynamic query for upsert
  const fields = Object.keys(data);
  const values = fields.map((_, i) => `$${i + 1}`);
  const updates = fields.filter(f => f !== idField).map(f => `${f} = EXCLUDED.${f}`);
  const sql = `INSERT INTO ${table} (${fields.join(',')}) VALUES (${values.join(',')})
    ON CONFLICT (${idField}) DO UPDATE SET ${updates.join(', ')}
    WHERE ${table}.last_modified < EXCLUDED.last_modified`;
  await pool.query(sql, fields.map(f => data[f]));
}

const allowedTables = ['companies', 'employees', 'sessions', 'screenshots', 'activitylogs'];

// POST /api/sync/upload
router.post('/upload', async (req, res) => {
  const { table, changes } = req.body;
  if (!allowedTables.includes(table)) {
    return res.status(400).json({ error: 'Invalid table' });
  }
  for (const change of changes) {
    await upsertRecord(table, change);
  }
  console.log(`[SYNC] Uploaded ${changes.length} changes to ${table}`);
  res.json({ status: 'ok' });
});

// GET /api/sync/download?table=...&since=...&employee_id=...
router.get('/download', async (req, res) => {
  const { table, since, employee_id } = req.query;
  if (!allowedTables.includes(table)) {
    return res.status(400).json({ error: 'Invalid table' });
  }
  let sql, params;
  if (table === 'companies') {
    // Always return all companies to ensure foreign key integrity
    sql = `SELECT * FROM companies`;
    params = [];
  } else {
    sql = `SELECT * FROM ${table} WHERE last_modified > $1`;
    params = [since];
    // Only filter by employee_id for tables that have that column
    const tablesWithEmployeeId = ['sessions', 'screenshots', 'activitylogs'];
    if (employee_id && tablesWithEmployeeId.includes(table)) {
      sql += ' AND employee_id = $2';
      params.push(employee_id);
    }
  }
  const result = await pool.query(sql, params);
  console.log(`[SYNC] Downloaded ${result.rows.length} changes from ${table}`);
  res.json({ changes: result.rows });
});

module.exports = router; 