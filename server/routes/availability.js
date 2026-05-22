const express = require('express');
const pool = require('../db');
const { getDefaultUserId } = require('../lib/defaultUser');

const router = express.Router();

async function getDefaultSchedule(userId) {
  const result = await pool.query(
    'SELECT * FROM availability_schedules WHERE user_id = $1 AND is_default = true LIMIT 1',
    [userId]
  );
  return result.rows[0];
}

router.get('/', async (req, res) => {
  try {
    const schedule = await getDefaultSchedule(getDefaultUserId());
    if (!schedule) return res.json({ schedule: null, rules: [] });

    const rules = await pool.query(
      `SELECT ar.* FROM availability_rules ar
       JOIN availability_schedules s ON ar.schedule_id = s.id
       WHERE s.user_id = $1 AND s.is_default = true
       ORDER BY ar.day_of_week`,
      [getDefaultUserId()]
    );
    res.json({ schedule, rules: rules.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/', async (req, res) => {
  try {
    const schedule = await getDefaultSchedule(getDefaultUserId());
    if (!schedule) return res.status(404).json({ error: 'No default schedule' });

    await pool.query('DELETE FROM availability_rules WHERE schedule_id = $1', [schedule.id]);

    const rules = req.body.rules || req.body;
    for (const rule of rules) {
      await pool.query(
        `INSERT INTO availability_rules (schedule_id, day_of_week, start_time, end_time, is_active)
         VALUES ($1, $2, $3, $4, $5)`,
        [schedule.id, rule.day_of_week, rule.start_time, rule.end_time, rule.is_active !== false]
      );
    }

    const updated = await pool.query(
      'SELECT * FROM availability_rules WHERE schedule_id = $1 ORDER BY day_of_week',
      [schedule.id]
    );
    res.json({ schedule, rules: updated.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/overrides', async (req, res) => {
  try {
    const schedule = await getDefaultSchedule(getDefaultUserId());
    if (!schedule) return res.json([]);

    const result = await pool.query(
      'SELECT * FROM date_overrides WHERE schedule_id = $1 ORDER BY override_date',
      [schedule.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/overrides', async (req, res) => {
  try {
    const schedule = await getDefaultSchedule(getDefaultUserId());
    if (!schedule) return res.status(404).json({ error: 'No default schedule' });

    const { override_date, is_off, start_time, end_time, reason } = req.body;
    const result = await pool.query(
      `INSERT INTO date_overrides (schedule_id, override_date, is_off, start_time, end_time, reason)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [schedule.id, override_date, is_off || false, start_time || null, end_time || null, reason || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/overrides/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM date_overrides WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
