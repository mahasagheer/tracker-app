const pool = require('../db');

exports.testDb = async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ time: result.rows[0].now });
  } catch (err) {
    console.error('DB Test Error:', err);
    res.status(500).json({ error: err.message });
  }
}; 