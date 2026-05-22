const pool = require('../db');
const { getDayOfWeek } = require('./timezone');

function formatTimeValue(t) {
  if (!t) return null;
  if (typeof t === 'string') return t.slice(0, 5);
  const s = String(t);
  if (/^\d{1,2}:\d{2}/.test(s)) return s.slice(0, 5);
  if (t.toISOString) return t.toISOString().slice(11, 16);
  return s.slice(0, 5);
}

function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function normalizeDateParam(dateStr) {
  return String(dateStr).slice(0, 10);
}

/**
 * Resolve working hours for a host on a calendar date (YYYY-MM-DD) in host timezone.
 * @returns {{ isOff: true } | { isOff: false, startTime: string, endTime: string } | null}
 */
async function getAvailabilityWindow(userId, dateStr, hostTimezone = 'Asia/Kolkata') {
  const date = normalizeDateParam(dateStr);

  const scheduleResult = await pool.query(
    'SELECT * FROM availability_schedules WHERE user_id=$1 AND is_default=true LIMIT 1',
    [userId]
  );
  if (scheduleResult.rows.length === 0) return null;
  const schedule = scheduleResult.rows[0];

  const overrideResult = await pool.query(
    `SELECT * FROM date_overrides
     WHERE schedule_id=$1 AND override_date = $2::date`,
    [schedule.id, date]
  );

  if (overrideResult.rows.length > 0) {
    const override = overrideResult.rows[0];
    if (override.is_off) return { isOff: true };
    return {
      isOff: false,
      startTime: formatTimeValue(override.start_time),
      endTime: formatTimeValue(override.end_time),
    };
  }

  const dayOfWeek = await getDayOfWeek(date);
  const ruleResult = await pool.query(
    `SELECT start_time, end_time FROM availability_rules
     WHERE schedule_id=$1 AND day_of_week=$2 AND is_active=true`,
    [schedule.id, dayOfWeek]
  );
  if (ruleResult.rows.length === 0) return { isOff: true };

  return {
    isOff: false,
    startTime: formatTimeValue(ruleResult.rows[0].start_time),
    endTime: formatTimeValue(ruleResult.rows[0].end_time),
  };
}

/** True if wall-clock slot fits within that day's availability window. */
async function isSlotWithinAvailability(userId, dateStr, timeStr, durationMinutes, hostTimezone) {
  const window = await getAvailabilityWindow(userId, dateStr, hostTimezone);
  if (!window || window.isOff) return false;

  const slotStart = timeToMinutes(timeStr);
  const slotEnd = slotStart + durationMinutes;
  const winStart = timeToMinutes(window.startTime);
  const winEnd = timeToMinutes(window.endTime);

  return slotStart >= winStart && slotEnd <= winEnd;
}

const AVAILABILITY_CHANGED_MESSAGE =
  'This time is no longer available. Please refresh the page and choose another slot.';

module.exports = {
  formatTimeValue,
  normalizeDateParam,
  getAvailabilityWindow,
  isSlotWithinAvailability,
  AVAILABILITY_CHANGED_MESSAGE,
};
