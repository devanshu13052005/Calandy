const pool = require('../db');
const { getDefaultUserId } = require('../lib/defaultUser');

/** Past confirmed meetings (completed) for contacts list. */
async function list(req, res) {
  try {
    const userId = getDefaultUserId();
    const result = await pool.query(
      `SELECT
         b.id,
         b.invitee_name,
         b.invitee_email,
         b.start_time,
         b.end_time,
         b.status,
         et.name AS event_type_name,
         et.duration_minutes,
         et.slug AS event_type_slug,
         u.timezone AS host_timezone
       FROM bookings b
       JOIN event_types et ON b.event_type_id = et.id
       JOIN users u ON et.user_id = u.id
       WHERE et.user_id = $1
         AND b.status = 'confirmed'
         AND b.end_time < NOW()
       ORDER BY b.start_time DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { list };
