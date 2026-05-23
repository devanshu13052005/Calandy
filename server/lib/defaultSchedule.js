const pool = require('../db');

const DEFAULT_SCHEDULE_NAME = 'Working Hours (default)';

async function createDefaultScheduleForUser(userId, timezone = 'Asia/Kolkata') {
  const existing = await pool.query(
    'SELECT id FROM availability_schedules WHERE user_id = $1 AND is_default = true LIMIT 1',
    [userId]
  );
  if (existing.rows.length > 0) {
    return existing.rows[0];
  }

  const scheduleResult = await pool.query(
    `INSERT INTO availability_schedules (user_id, name, is_default, timezone)
     VALUES ($1, $2, true, $3)
     RETURNING *`,
    [userId, DEFAULT_SCHEDULE_NAME, timezone]
  );
  const schedule = scheduleResult.rows[0];

  for (let day = 1; day <= 5; day++) {
    await pool.query(
      `INSERT INTO availability_rules (schedule_id, day_of_week, start_time, end_time, is_active)
       VALUES ($1, $2, '09:00', '17:00', true)`,
      [schedule.id, day]
    );
  }

  return schedule;
}

async function ensureDefaultScheduleForUser(userId) {
  return createDefaultScheduleForUser(userId);
}

module.exports = {
  DEFAULT_SCHEDULE_NAME,
  createDefaultScheduleForUser,
  ensureDefaultScheduleForUser,
};
