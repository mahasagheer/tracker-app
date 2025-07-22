const express = require('express');
const router = express.Router();
const pool = require('../db');

// Helper: upsert for a table
async function upsertRecord(table, data, idField = 'id') {
  if (table === 'employees') {
    // Check if an employee with the same email exists
    const existing = await pool.query('SELECT id, last_modified FROM employees WHERE email = $1', [data.email]);
    if (existing.rows.length > 0) {
      // If the incoming record is newer, update the existing one
      if (!data.last_modified || new Date(data.last_modified) > new Date(existing.rows[0].last_modified)) {
        const fields = Object.keys(data).filter(f => f !== 'id');
        const updates = fields.map((f, i) => `${f} = $${i + 2}`);
        const sql = `UPDATE employees SET ${updates.join(', ')} WHERE id = $1`;
        await pool.query(sql, [existing.rows[0].id, ...fields.map(f => data[f])]);
      }
      return;
    }
  }
  // Default upsert logic for all other tables
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

// GET /api/sessions/weekly-duration
router.get('/sessions/weekly-duration', async (req, res) => {
  try {
    // Get current date and week info
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 (Sun) - 6 (Sat)
    // Calculate Monday of current week
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    // Calculate Friday of current week (or today if before Friday)
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    friday.setHours(23, 59, 59, 999);
    const endDate = today < friday ? today : friday;
    endDate.setHours(23, 59, 59, 999);

    // Query sessions for current week (Mon-Fri, up to today)
    const sql = `
      SELECT start_time, total_duration_minutes
      FROM sessions
      WHERE start_time >= $1 AND start_time <= $2
        AND total_duration_minutes IS NOT NULL
    `;
    const params = [monday.toISOString(), endDate.toISOString()];
    const result = await pool.query(sql, params);

    // Aggregate durations per day
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const durations = {};
    for (const day of days) durations[day] = 0;
    for (const row of result.rows) {
      const date = new Date(row.start_time);
      const weekday = date.getDay(); // 0 (Sun) - 6 (Sat)
      if (weekday >= 1 && weekday <= 5) { // Mon-Fri
        const dayName = days[weekday - 1];
        durations[dayName] += row.total_duration_minutes || 0;
      }
    }
    // Format durations as 'Xh Ym'
    const formatted = {};
    for (const day of days) {
      const mins = durations[day];
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      formatted[day] = `${h}h ${m}m`;
    }
    res.json({ week: formatted });
  } catch (err) {
    console.error('Error calculating weekly session durations:', err);
    res.status(500).json({ error: 'Failed to calculate weekly durations' });
  }
});

// GET /api/sync/sessions/monthly-weekly-duration
router.get('/sessions/monthly-weekly-duration', async (req, res) => {
  try {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth(); // 0-based
    // Find the first day of the month
    const firstOfMonth = new Date(year, month, 1);
    // Find the first Monday on or after the 1st
    let firstMonday = new Date(firstOfMonth);
    while (firstMonday.getDay() !== 1) {
      firstMonday.setDate(firstMonday.getDate() + 1);
    }
    // Find the last day to include (today)
    const lastDay = new Date(today);
    lastDay.setHours(23, 59, 59, 999);

    // Query all sessions for this month up to today
    const sql = `
      SELECT start_time, total_duration_minutes
      FROM sessions
      WHERE start_time >= $1 AND start_time <= $2
        AND total_duration_minutes IS NOT NULL
    `;
    const params = [firstMonday.toISOString(), lastDay.toISOString()];
    const result = await pool.query(sql, params);

    // Helper to get week number in month (1-based, starting from first Monday)
    function getWeekNumber(date) {
      const diff = date - firstMonday;
      return Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;
    }
    // Helper to get week start/end for a given week number
    function getWeekStartEnd(weekNum) {
      const start = new Date(firstMonday);
      start.setDate(firstMonday.getDate() + (weekNum - 1) * 7);
      const end = new Date(start);
      end.setDate(start.getDate() + 4); // Friday
      end.setHours(23, 59, 59, 999);
      // Don't go past today
      if (end > lastDay) end.setTime(lastDay.getTime());
      return { start, end };
    }

    // Build week/day structure
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const weeks = {};
    let weekNum = 1;
    while (true) {
      const { start, end } = getWeekStartEnd(weekNum);
      if (start > lastDay) break;
      weeks[weekNum] = {};
      for (let i = 0; i < days.length; i++) {
        const dayDate = new Date(start);
        dayDate.setDate(start.getDate() + i);
        // Only include up to today
        if (dayDate > lastDay) break;
        // Only include days in this month
        if (dayDate.getMonth() !== month) continue;
        weeks[weekNum][days[i]] = 0;
      }
      weekNum++;
    }

    // Aggregate durations
    for (const row of result.rows) {
      const date = new Date(row.start_time);
      if (date < firstMonday || date > lastDay) continue;
      if (date.getDay() < 1 || date.getDay() > 5) continue; // Mon-Fri only
      const week = getWeekNumber(date);
      const dayName = days[date.getDay() - 1];
      if (weeks[week] && weeks[week][dayName] !== undefined) {
        weeks[week][dayName] += row.total_duration_minutes || 0;
      }
    }

    // Format durations as 'Xh Ym' and calculate total per week
    const formatted = {};
    for (const w in weeks) {
      let weekTotalMins = 0;
      formatted[`Week ${w}`] = {};
      for (const d in weeks[w]) {
        const mins = weeks[w][d];
        weekTotalMins += mins;
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        formatted[`Week ${w}`][d] = `${h}h ${m}m`;
      }
      // Add total for the week
      const h = Math.floor(weekTotalMins / 60);
      const m = weekTotalMins % 60;
      formatted[`Week ${w}`]['Total'] = `${h}h ${m}m`;
    }
    res.json({ month: formatted });
  } catch (err) {
    console.error('Error calculating monthly weekly session durations:', err);
    res.status(500).json({ error: 'Failed to calculate monthly weekly durations' });
  }
});

module.exports = router; 