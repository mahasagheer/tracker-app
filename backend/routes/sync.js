const express = require('express');
const router = express.Router();
const pool = require('../db');
const { DateTime } = require('luxon');

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
    // Get current date and week info (UTC)
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const dayOfWeek = today.getUTCDay(); // 0 (Sun) - 6 (Sat)
    // Calculate Monday of current week (UTC)
    const monday = new Date(today);
    monday.setUTCDate(today.getUTCDate() - ((dayOfWeek + 6) % 7));
    monday.setUTCHours(0, 0, 0, 0);
    // Calculate Friday of current week (or today if before Friday, UTC)
    const friday = new Date(monday);
    friday.setUTCDate(monday.getUTCDate() + 4);
    friday.setUTCHours(23, 59, 59, 999);
    const endDate = today < friday ? today : friday;
    endDate.setUTCHours(23, 59, 59, 999);

    // Query sessions for current week (Mon-Fri, up to today)
    const sql = `
      SELECT start_time, total_duration_minutes
      FROM sessions
      WHERE start_time >= $1 AND start_time <= $2
        AND total_duration_minutes IS NOT NULL
    `;
    const params = [monday.toISOString(), endDate.toISOString()];
    const result = await pool.query(sql, params);

    // Aggregate durations per day (UTC)
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const durations = {};
    for (const day of days) durations[day] = 0;
    for (const row of result.rows) {
      const date = new Date(row.start_time);
      const weekday = date.getUTCDay(); // 0 (Sun) - 6 (Sat)
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
    const { userId } = req.query;
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth(); // 0-based
    // Find the first day of the month (UTC)
    const firstOfMonth = new Date(Date.UTC(year, month, 1));
    // Find the last day to include (today, UTC)
    const lastDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    // Query all sessions for this month up to today, optionally filtered by userId
    let sql = `
      SELECT start_time, total_duration_minutes
      FROM sessions
      WHERE start_time >= $1 AND start_time <= $2
        AND total_duration_minutes IS NOT NULL
    `;
    const params = [firstOfMonth.toISOString(), lastDay.toISOString()];
    if (userId) {
      sql += ' AND employee_id = $3';
      params.push(userId);
    }
    const result = await pool.query(sql, params);

    // Build a flat date-to-duration map and a weekly total map
    const dateDurations = {};
    const weeklyTotals = {};
    // Helper to get week number in month (1-based, starting from Monday on or before the 1st)
    let baseMonday = new Date(firstOfMonth);
    while (baseMonday.getUTCDay() !== 1) {
      baseMonday.setUTCDate(baseMonday.getUTCDate() - 1);
    }
    for (const row of result.rows) {
      const date = new Date(row.start_time);
      if (date < firstOfMonth || date > lastDay) continue;
      if (date.getUTCDay() < 1 || date.getUTCDay() > 5) continue; // Mon-Fri only
      const dateStr = date.toISOString().slice(0, 10);
      if (!dateDurations[dateStr]) dateDurations[dateStr] = 0;
      dateDurations[dateStr] += row.total_duration_minutes || 0;
      // Calculate week number for this date
      const diffDays = Math.floor((date - baseMonday) / (1000 * 60 * 60 * 24));
      const weekNum = Math.floor(diffDays / 7) + 1;
      const weekLabel = `Week ${weekNum}`;
      if (!weeklyTotals[weekLabel]) weeklyTotals[weekLabel] = 0;
      weeklyTotals[weekLabel] += row.total_duration_minutes || 0;
    }

    // Format durations as 'Xh Ym'
    const formatted = {};
    for (const dateStr in dateDurations) {
      const mins = dateDurations[dateStr];
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      formatted[dateStr] = `${h}h ${m}m`;
    }
    // Format weekly totals
    const formattedWeekly = {};
    for (const weekLabel in weeklyTotals) {
      const mins = weeklyTotals[weekLabel];
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      formattedWeekly[weekLabel] = `${h}h ${m}m`;
    }

    res.json({ month: formatted, weekly: formattedWeekly });
  } catch (err) {
    console.error('Error calculating monthly weekly session durations:', err);
    res.status(500).json({ error: 'Failed to calculate monthly weekly durations' });
  }
});

// GET /api/sync/productivity-report?userId=...&date=YYYY-MM-DD&timezone=...
router.get('/productivity-report', async (req, res) => {
  try {
    const { userId, date } = req.query;
    const userTimezone = req.query.timezone || 'Asia/Karachi';
    if (!userId || !date) {
      return res.status(400).json({ error: 'userId and date are required' });
    }
    // Check if date is in the future (UTC)
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const reqDate = new Date(date + 'T00:00:00.000Z');
    if (reqDate > today) {
      return res.json({ message: "This is an upcoming date." });
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
    }
    // Calculate start and end of the user's local day, then convert to UTC for querying
    const localDayStart = DateTime.fromISO(date, { zone: userTimezone }).startOf('day');
    const localDayEnd = localDayStart.endOf('day');
    const utcDayStart = localDayStart.setZone('utc').toISO();
    const utcDayEnd = localDayEnd.setZone('utc').toISO();
    console.log('Query UTC range:', utcDayStart, utcDayEnd);

    // Get all screenshots for the user and day, grouped by hour (user's timezone)
    const screenshotsSql = `
      SELECT id, image_path, captured_at
      FROM screenshots
      WHERE employee_id = $1 AND captured_at >= $2 AND captured_at <= $3
      ORDER BY captured_at ASC
    `;
    const screenshotsResult = await pool.query(screenshotsSql, [userId, utcDayStart, utcDayEnd]);
    console.log('Screenshots fetched:', screenshotsResult.rows.map(r => r.captured_at));
    const screenshotsByHour = {};
    screenshotsResult.rows.forEach(row => {
      // Use fromJSDate for JS Date objects
      const hour = DateTime.fromJSDate(row.captured_at).setZone(userTimezone).hour;
      console.log('Screenshot:', row.captured_at, 'Local hour:', hour);
      if (!screenshotsByHour[hour]) screenshotsByHour[hour] = [];
      screenshotsByHour[hour].push({
        id: row.id,
        image_path: row.image_path,
        captured_at: row.captured_at
      });
    });

    // Get all activity logs for the user and day, grouped by hour (user's timezone)
    const activitySql = `
      SELECT timestamp, mouse_events, keyboard_events, productivity
      FROM activitylogs
      WHERE employee_id = $1 AND timestamp >= $2 AND timestamp <= $3
      ORDER BY timestamp ASC
    `;
    const activityResult = await pool.query(activitySql, [userId, utcDayStart, utcDayEnd]);
    const activityByHour = {};
    let totalMouse = 0, totalKeyboard = 0, totalProductivity = 0, count = 0;
    activityResult.rows.forEach(row => {
      // Use fromJSDate for JS Date objects
      const hour = DateTime.fromJSDate(row.timestamp).setZone(userTimezone).hour;
      if (!activityByHour[hour]) activityByHour[hour] = { mouse: 0, keyboard: 0, productivity: 0, count: 0 };
      activityByHour[hour].mouse += parseFloat(row.mouse_events) || 0;
      activityByHour[hour].keyboard += parseFloat(row.keyboard_events) || 0;
      activityByHour[hour].productivity += parseFloat(row.productivity) || 0;
      activityByHour[hour].count += 1;
      totalMouse += parseFloat(row.mouse_events) || 0;
      totalKeyboard += parseFloat(row.keyboard_events) || 0;
      totalProductivity += parseFloat(row.productivity) || 0;
      count++;
    });

    const maxMouseEventsPerInterval = 1000;
    const maxKeyboardEventsPerInterval = 1000;
    const num_hours = 12; // 10 AM to 9 PM

    // Build hourly breakdown for working hours only (10 AM to 9 PM, UTC)
    const hourly = [];
    for (let h = 10; h <= 21; h++) {
      const hourScreenshots = screenshotsByHour[h] || [];
      const act = activityByHour[h] || { mouse: 0, keyboard: 0, productivity: 0, count: 0 };
      // Calculate percentages
      const mouse_activity_percent = Math.min((act.mouse / maxMouseEventsPerInterval) * 100, 100).toFixed(2);
      const keyboard_activity_percent = Math.min((act.keyboard / maxKeyboardEventsPerInterval) * 100, 100).toFixed(2);
      const productivity_percent = ((parseFloat(mouse_activity_percent) + parseFloat(keyboard_activity_percent)) / 2).toFixed(2);
      // Format hour label
      const hour12 = ((h + 11) % 12 + 1);
      const ampm = h < 12 ? 'AM' : 'PM';
      const hourLabel = `${hour12} ${ampm}`;
      hourly.push({
        hour: h,
        label: hourLabel,
        screenshots: hourScreenshots,
        mouse_activity_percent,
        keyboard_activity_percent,
        productivity_percent
      });
    }

    // Overall summary in percentage
    const overall_mouse_activity_percent = Math.min((totalMouse / (maxMouseEventsPerInterval * num_hours)) * 100, 100).toFixed(2);
    const overall_keyboard_activity_percent = Math.min((totalKeyboard / (maxKeyboardEventsPerInterval * num_hours)) * 100, 100).toFixed(2);
    const overall_productivity_percent = ((parseFloat(overall_mouse_activity_percent) + parseFloat(overall_keyboard_activity_percent)) / 2).toFixed(2);

    res.json({
      userId,
      date,
      hourly,
      summary: {
        overall_mouse_activity_percent,
        overall_keyboard_activity_percent,
        overall_productivity_percent
      }
    });
  } catch (err) {
    console.error('Error generating productivity report:', err);
    res.status(500).json({ error: 'Failed to generate productivity report' });
  }
});

// GET /api/admin/summary?adminId=...&date=YYYY-MM-DD
router.get('/admin/summary', async (req, res) => {
  try {
    const { adminId, date } = req.query;
    if (!adminId || !date) {
      return res.status(400).json({ error: 'adminId and date are required' });
    }
    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
    }
    // Check if date is in the future (UTC)
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const reqDate = new Date(date + 'T00:00:00.000Z');
    if (reqDate > today) {
      // Return message for each reporter
      // Find all employees for this admin
      const employeesResult = await pool.query(
        'SELECT id, name, email FROM employees WHERE company_id IN (SELECT company_id FROM admins WHERE id = $1)',
        [adminId]
      );
      const reporters = employeesResult.rows.map(emp => ({
        reporterId: emp.id,
        name: emp.name,
        email: emp.email,
        message: 'This is an upcoming date.'
      }));
      return res.json(reporters);
    }
    // Calculate start and end of the day (UTC)
    const dayStart = new Date(date + 'T00:00:00.000Z');
    const dayEnd = new Date(date + 'T23:59:59.999Z');
    if (isNaN(dayStart.getTime()) || isNaN(dayEnd.getTime())) {
      return res.status(400).json({ error: 'Invalid date value.' });
    }
    // Find all employees for this admin
    const employeesResult = await pool.query(
      'SELECT id, name, email FROM employees WHERE company_id IN (SELECT company_id FROM admins WHERE id = $1)',
      [adminId]
    );
    const employees = employeesResult.rows;
    if (employees.length === 0) {
      return res.json([]);
    }
    // For each employee, fetch their productivity summary for the date
    const maxMouseEventsPerInterval = 1000;
    const maxKeyboardEventsPerInterval = 1000;
    const num_hours = 12; // 10 AM to 9 PM
    const results = await Promise.all(employees.map(async (emp) => {
      // Screenshots
      const screenshotsSql = `SELECT id, image_path, captured_at FROM screenshots WHERE employee_id = $1 AND captured_at >= $2 AND captured_at <= $3 ORDER BY captured_at ASC`;
      const screenshotsResult = await pool.query(screenshotsSql, [emp.id, dayStart.toISOString(), dayEnd.toISOString()]);
      const screenshotsByHour = {};
      screenshotsResult.rows.forEach(row => {
        const hour = new Date(row.captured_at).getUTCHours();
        if (!screenshotsByHour[hour]) screenshotsByHour[hour] = [];
        screenshotsByHour[hour].push({
          id: row.id,
          image_path: row.image_path,
          captured_at: row.captured_at
        });
      });
      // Activity logs
      const activitySql = `SELECT timestamp, mouse_events, keyboard_events, productivity FROM activitylogs WHERE employee_id = $1 AND timestamp >= $2 AND timestamp <= $3 ORDER BY timestamp ASC`;
      const activityResult = await pool.query(activitySql, [emp.id, dayStart.toISOString(), dayEnd.toISOString()]);
      const activityByHour = {};
      let totalMouse = 0, totalKeyboard = 0, totalProductivity = 0, count = 0;
      activityResult.rows.forEach(row => {
        const hour = new Date(row.timestamp).getUTCHours();
        if (!activityByHour[hour]) activityByHour[hour] = { mouse: 0, keyboard: 0, productivity: 0, count: 0 };
        activityByHour[hour].mouse += parseFloat(row.mouse_events) || 0;
        activityByHour[hour].keyboard += parseFloat(row.keyboard_events) || 0;
        activityByHour[hour].productivity += parseFloat(row.productivity) || 0;
        activityByHour[hour].count += 1;
        totalMouse += parseFloat(row.mouse_events) || 0;
        totalKeyboard += parseFloat(row.keyboard_events) || 0;
        totalProductivity += parseFloat(row.productivity) || 0;
        count++;
      });
      // Build hourly breakdown for working hours only (10 AM to 9 PM, UTC)
      const hourly = [];
      for (let h = 10; h <= 21; h++) {
        const hourScreenshots = screenshotsByHour[h] || [];
        const act = activityByHour[h] || { mouse: 0, keyboard: 0, productivity: 0, count: 0 };
        // Calculate percentages
        const mouse_activity_percent = Math.min((act.mouse / maxMouseEventsPerInterval) * 100, 100).toFixed(2);
        const keyboard_activity_percent = Math.min((act.keyboard / maxKeyboardEventsPerInterval) * 100, 100).toFixed(2);
        const productivity_percent = ((parseFloat(mouse_activity_percent) + parseFloat(keyboard_activity_percent)) / 2).toFixed(2);
        // Format hour label
        const hour12 = ((h + 11) % 12 + 1);
        const ampm = h < 12 ? 'AM' : 'PM';
        const hourLabel = `${hour12} ${ampm}`;
        hourly.push({
          hour: h,
          label: hourLabel,
          screenshots: hourScreenshots,
          mouse_activity_percent,
          keyboard_activity_percent,
          productivity_percent
        });
      }
      // Overall summary in percentage
      const overall_mouse_activity_percent = Math.min((totalMouse / (maxMouseEventsPerInterval * num_hours)) * 100, 100).toFixed(2);
      const overall_keyboard_activity_percent = Math.min((totalKeyboard / (maxKeyboardEventsPerInterval * num_hours)) * 100, 100).toFixed(2);
      const overall_productivity_percent = ((parseFloat(overall_mouse_activity_percent) + parseFloat(overall_keyboard_activity_percent)) / 2).toFixed(2);
      return {
        reporterId: emp.id,
        name: emp.name,
        email: emp.email,
        summary: {
          overall_mouse_activity_percent,
          overall_keyboard_activity_percent,
          overall_productivity_percent
        },
        hourly
      };
    }));
    res.json(results);
  } catch (err) {
    console.error('Error in /api/admin/summary:', err);
    res.status(500).json({ error: 'Server error while fetching admin summary.' });
  }
});

// GET /api/admin/monthly-weekly-summary?adminId=...
router.get('/admin/monthly-weekly-summary', async (req, res) => {
  try {
    const { adminId } = req.query;
    if (!adminId) {
      return res.status(400).json({ error: 'adminId is required' });
    }
    // Find all employees for this admin
    const employeesResult = await pool.query(
      'SELECT id, name, email FROM employees WHERE company_id IN (SELECT company_id FROM admins WHERE id = $1)',
      [adminId]
    );
    const employees = employeesResult.rows;
    if (employees.length === 0) {
      return res.json([]);
    }
    // Get current month range (same as /sessions/monthly-weekly-duration)
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth(); // 0-based
    const firstOfMonth = new Date(Date.UTC(year, month, 1));
    let firstMonday = new Date(firstOfMonth);
    while (firstMonday.getUTCDay() !== 1) {
      firstMonday.setUTCDate(firstMonday.getUTCDate() + 1);
    }
    const lastDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
    // Helper to get week number in month (1-based, starting from first Monday, UTC)
    function getWeekNumber(date) {
      const diff = date - firstMonday;
      return Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;
    }
    // Helper to get week start/end for a given week number (UTC)
    function getWeekStartEnd(weekNum) {
      const start = new Date(firstMonday);
      start.setUTCDate(firstMonday.getUTCDate() + (weekNum - 1) * 7);
      const end = new Date(start);
      end.setUTCDate(start.getUTCDate() + 4); // Friday
      end.setUTCHours(23, 59, 59, 999);
      // Don't go past today
      if (end > lastDay) end.setTime(lastDay.getTime());
      return { start, end };
    }
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    // For each employee, aggregate their sessions
    const results = await Promise.all(employees.map(async (emp) => {
      // Query all sessions for this employee for this month up to today
      const sql = `SELECT start_time, total_duration_minutes FROM sessions WHERE employee_id = $1 AND start_time >= $2 AND start_time <= $3 AND total_duration_minutes IS NOT NULL`;
      const params = [emp.id, firstMonday.toISOString(), lastDay.toISOString()];
      const result = await pool.query(sql, params);
      // Build a flat date-to-duration map and a weekly total map
      const dateDurations = {};
      const weeklyTotals = {};
      // Helper to get week number in month (1-based, starting from Monday on or before the 1st)
      let baseMonday = new Date(firstOfMonth);
      while (baseMonday.getUTCDay() !== 1) {
        baseMonday.setUTCDate(baseMonday.getUTCDate() - 1);
      }
      for (const row of result.rows) {
        const date = new Date(row.start_time);
        if (date < firstMonday || date > lastDay) continue;
        if (date.getUTCDay() < 1 || date.getUTCDay() > 5) continue; // Mon-Fri only
        const dateStr = date.toISOString().slice(0, 10);
        if (!dateDurations[dateStr]) dateDurations[dateStr] = 0;
        dateDurations[dateStr] += row.total_duration_minutes || 0;
        // Calculate week number for this date
        const diffDays = Math.floor((date - baseMonday) / (1000 * 60 * 60 * 24));
        const weekNum = Math.floor(diffDays / 7) + 1;
        const weekLabel = `Week ${weekNum}`;
        if (!weeklyTotals[weekLabel]) weeklyTotals[weekLabel] = 0;
        weeklyTotals[weekLabel] += row.total_duration_minutes || 0;
      }
      // Format durations as 'Xh Ym'
      const formatted = {};
      for (const dateStr in dateDurations) {
        const mins = dateDurations[dateStr];
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        formatted[dateStr] = `${h}h ${m}m`;
      }
      // Format weekly totals
      const formattedWeekly = {};
      for (const weekLabel in weeklyTotals) {
        const mins = weeklyTotals[weekLabel];
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        formattedWeekly[weekLabel] = `${h}h ${m}m`;
      }
      return {
        reporterId: emp.id,
        name: emp.name,
        email: emp.email,
        month: formatted,
        weekly: formattedWeekly
      };
    }));
    res.json(results);
  } catch (err) {
    console.error('Error in /api/admin/monthly-weekly-summary:', err);
    res.status(500).json({ error: 'Server error while fetching admin monthly weekly summary.' });
  }
});

module.exports = router; 