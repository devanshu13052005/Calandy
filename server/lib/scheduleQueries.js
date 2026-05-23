const pool = require('../db');
const { rulesToWeeklyAvailability } = require('./scheduleDays');

async function fetchRulesForSchedule(scheduleId) {
  const result = await pool.query(
    `SELECT day_of_week, start_time, end_time, is_active
     FROM availability_rules
     WHERE schedule_id = $1
     ORDER BY day_of_week, start_time`,
    [scheduleId]
  );
  return result.rows;
}

async function replaceScheduleRules(scheduleId, weeklyAvailability) {
  const { weeklyAvailabilityToRules } = require('./scheduleDays');
  const rules = weeklyAvailabilityToRules(weeklyAvailability);

  await pool.query('DELETE FROM availability_rules WHERE schedule_id = $1', [scheduleId]);

  for (const rule of rules) {
    await pool.query(
      `INSERT INTO availability_rules (schedule_id, day_of_week, start_time, end_time, is_active)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        scheduleId,
        rule.day_of_week,
        rule.start_time,
        rule.end_time,
        rule.is_active !== false,
      ]
    );
  }
}

async function formatScheduleRow(row) {
  const rules = await fetchRulesForSchedule(row.id);
  const weeklyAvailability = rulesToWeeklyAvailability(rules);
  return {
    id: row.id,
    name: row.name,
    isDefault: row.is_default,
    userId: row.user_id,
    timezone: row.timezone || 'Asia/Kolkata',
    weeklyAvailability,
    createdAt: row.created_at,
  };
}

async function resolveScheduleId(userId, scheduleId) {
  if (scheduleId) {
    const linked = await pool.query(
      'SELECT id FROM availability_schedules WHERE id = $1 AND user_id = $2',
      [scheduleId, userId]
    );
    if (linked.rows.length > 0) return linked.rows[0].id;
  }

  const defaultResult = await pool.query(
    'SELECT id FROM availability_schedules WHERE user_id = $1 AND is_default = true LIMIT 1',
    [userId]
  );
  return defaultResult.rows[0]?.id || null;
}

module.exports = {
  fetchRulesForSchedule,
  replaceScheduleRules,
  formatScheduleRow,
  resolveScheduleId,
};
