const pool = require('../db');
const { getDayOfWeek } = require('./timezone');
const { formatTimeValue } = require('./scheduleDays');
const { resolveScheduleId } = require('./scheduleQueries');

function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function normalizeDateParam(dateStr) {
  return String(dateStr).slice(0, 10);
}

/**
 * Resolve working windows for a host on a calendar date.
 * Overrides take priority over weekly rules.
 * @returns {{ isOff: true } | { isOff: false, windows: { startTime: string, endTime: string }[] } | null}
 */
async function getAvailabilityForDate(userId, dateStr, scheduleId = null) {
  const date = normalizeDateParam(dateStr);
  const resolvedScheduleId = await resolveScheduleId(userId, scheduleId);
  if (!resolvedScheduleId) return null;

  const overrideResult = await pool.query(
    `SELECT * FROM date_overrides
     WHERE schedule_id=$1 AND override_date = $2::date`,
    [resolvedScheduleId, date]
  );

  if (overrideResult.rows.length > 0) {
    const override = overrideResult.rows[0];
    if (override.is_off) return { isOff: true };
    return {
      isOff: false,
      windows: [
        {
          startTime: formatTimeValue(override.start_time),
          endTime: formatTimeValue(override.end_time),
        },
      ],
    };
  }

  const dayOfWeek = await getDayOfWeek(date);
  const ruleResult = await pool.query(
    `SELECT start_time, end_time FROM availability_rules
     WHERE schedule_id=$1 AND day_of_week=$2 AND is_active=true
     ORDER BY start_time`,
    [resolvedScheduleId, dayOfWeek]
  );
  if (ruleResult.rows.length === 0) return { isOff: true };

  return {
    isOff: false,
    windows: ruleResult.rows.map((row) => ({
      startTime: formatTimeValue(row.start_time),
      endTime: formatTimeValue(row.end_time),
    })),
  };
}

/** @deprecated alias — returns first window for backward compatibility */
async function getAvailabilityWindow(userId, dateStr, hostTimezone, scheduleId = null) {
  const availability = await getAvailabilityForDate(userId, dateStr, scheduleId);
  if (!availability || availability.isOff) return availability;
  return {
    isOff: false,
    startTime: availability.windows[0].startTime,
    endTime: availability.windows[0].endTime,
  };
}

/** True if wall-clock slot fits within any window for that day. */
async function isSlotWithinAvailability(
  userId,
  dateStr,
  timeStr,
  durationMinutes,
  hostTimezone,
  scheduleId = null
) {
  const availability = await getAvailabilityForDate(userId, dateStr, scheduleId);
  if (!availability || availability.isOff) return false;

  const slotStart = timeToMinutes(timeStr);
  const slotEnd = slotStart + Number(durationMinutes);

  return availability.windows.some((window) => {
    const winStart = timeToMinutes(window.startTime);
    const winEnd = timeToMinutes(window.endTime);
    return slotStart >= winStart && slotEnd <= winEnd;
  });
}

const AVAILABILITY_CHANGED_MESSAGE =
  'This time is no longer available. Please refresh the page and choose another slot.';

module.exports = {
  formatTimeValue,
  normalizeDateParam,
  getAvailabilityForDate,
  getAvailabilityWindow,
  isSlotWithinAvailability,
  AVAILABILITY_CHANGED_MESSAGE,
};
