const pool = require('../db');

/** Convert YYYY-MM-DD + HH:mm wall clock in IANA timezone to UTC timestamptz. */
async function wallClockToUtc(dateStr, timeStr, timeZone) {
  const result = await pool.query(
    `SELECT (($1::date + $2::time) AT TIME ZONE $3)::timestamptz AS ts`,
    [dateStr, timeStr, timeZone]
  );
  return result.rows[0].ts;
}

/** Day of week 0–6 (Sunday=0), same as JavaScript Date.getDay(). */
async function getDayOfWeek(dateStr) {
  const result = await pool.query(
    `SELECT EXTRACT(DOW FROM $1::date)::int AS dow`,
    [dateStr]
  );
  return result.rows[0].dow;
}

module.exports = { wallClockToUtc, getDayOfWeek };
