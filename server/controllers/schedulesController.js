const pool = require('../db');
const { getDefaultUserId } = require('../lib/defaultUser');
const { DEFAULT_SCHEDULE_NAME } = require('../lib/defaultSchedule');
const {
  defaultWeeklyAvailability,
  summarizeSchedule,
} = require('../lib/scheduleDays');
const {
  formatScheduleRow,
  replaceScheduleRules,
  fetchRulesForSchedule,
} = require('../lib/scheduleQueries');

async function list(req, res) {
  try {
    const userId = getDefaultUserId();
    const result = await pool.query(
      `SELECT * FROM availability_schedules
       WHERE user_id = $1
       ORDER BY is_default DESC, created_at ASC`,
      [userId]
    );
    const schedules = await Promise.all(result.rows.map(formatScheduleRow));
    res.json(schedules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function create(req, res) {
  try {
    const userId = getDefaultUserId();
    const { name, weeklyAvailability } = req.body;
    const timezone = req.body.timezone || 'Asia/Kolkata';
    if (!name?.trim()) {
      return res.status(400).json({ error: 'Schedule name is required' });
    }

    const result = await pool.query(
      `INSERT INTO availability_schedules (user_id, name, is_default, timezone)
       VALUES ($1, $2, false, $3)
       RETURNING *`,
      [userId, name.trim(), timezone]
    );
    const schedule = result.rows[0];

    await replaceScheduleRules(
      schedule.id,
      weeklyAvailability || defaultWeeklyAvailability()
    );

    const formatted = await formatScheduleRow(schedule);
    res.status(201).json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function update(req, res) {
  try {
    const userId = getDefaultUserId();
    const { name, weeklyAvailability } = req.body;
    const timezone = req.body.timezone || 'Asia/Kolkata';

    const existing = await pool.query(
      'SELECT * FROM availability_schedules WHERE id = $1 AND user_id = $2',
      [req.params.id, userId]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    const schedule = existing.rows[0];
    const resolvedTimezone =
      req.body.timezone !== undefined && req.body.timezone !== null && req.body.timezone !== ''
        ? timezone
        : schedule.timezone || 'Asia/Kolkata';

    const updated = await pool.query(
      `UPDATE availability_schedules
       SET name = COALESCE($1, name),
           timezone = $2
       WHERE id = $3
       RETURNING *`,
      [name?.trim() || schedule.name, resolvedTimezone, schedule.id]
    );

    if (weeklyAvailability) {
      await replaceScheduleRules(schedule.id, weeklyAvailability);
    }

    const formatted = await formatScheduleRow(updated.rows[0]);
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function remove(req, res) {
  try {
    const userId = getDefaultUserId();
    const existing = await pool.query(
      'SELECT * FROM availability_schedules WHERE id = $1 AND user_id = $2',
      [req.params.id, userId]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    if (existing.rows[0].is_default) {
      return res.status(400).json({ error: 'Cannot delete the default schedule' });
    }

    await pool.query(
      `UPDATE event_types SET schedule_id = NULL WHERE schedule_id = $1`,
      [req.params.id]
    );
    await pool.query('DELETE FROM availability_schedules WHERE id = $1', [
      req.params.id,
    ]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function duplicate(req, res) {
  try {
    const userId = getDefaultUserId();
    const existing = await pool.query(
      'SELECT * FROM availability_schedules WHERE id = $1 AND user_id = $2',
      [req.params.id, userId]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    const source = existing.rows[0];
    const rules = await fetchRulesForSchedule(source.id);
    const { rulesToWeeklyAvailability } = require('../lib/scheduleDays');
    const weeklyAvailability = rulesToWeeklyAvailability(rules);

    const copyName = `${source.name} (copy)`;
    const result = await pool.query(
      `INSERT INTO availability_schedules (user_id, name, is_default, timezone)
       VALUES ($1, $2, false, $3)
       RETURNING *`,
      [userId, copyName, source.timezone || 'Asia/Kolkata']
    );

    await replaceScheduleRules(result.rows[0].id, weeklyAvailability);
    const formatted = await formatScheduleRow(result.rows[0]);
    res.status(201).json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  list,
  create,
  update,
  remove,
  duplicate,
  summarizeSchedule,
  DEFAULT_SCHEDULE_NAME,
};
