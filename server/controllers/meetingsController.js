const pool = require('../db');
const { getDefaultUserId } = require('../lib/defaultUser');
const { sendCancellationEmail, sendRescheduleEmail } = require('../lib/emails');
const { wallClockToUtc } = require('../lib/timezone');
const { SLOT_TAKEN_MESSAGE, hasBookingOverlap } = require('../lib/bookingOverlap');
const {
  normalizeDateParam,
  isSlotWithinAvailability,
  AVAILABILITY_CHANGED_MESSAGE,
} = require('../lib/availability');

async function list(req, res) {
  try {
    const { type } = req.query;
    const userId = getDefaultUserId();

    let query;
    if (type === 'past') {
      query = `
        SELECT b.*, et.name as event_type_name, et.duration_minutes, et.color as event_type_color,
               et.slug as event_type_slug, u.timezone as host_timezone
        FROM bookings b
        JOIN event_types et ON b.event_type_id = et.id
        JOIN users u ON et.user_id = u.id
        WHERE et.user_id=$1 AND b.status='confirmed' AND b.start_time < NOW()
        ORDER BY b.start_time DESC`;
    } else {
      query = `
        SELECT b.*, et.name as event_type_name, et.duration_minutes, et.color as event_type_color,
               et.slug as event_type_slug, u.timezone as host_timezone
        FROM bookings b
        JOIN event_types et ON b.event_type_id = et.id
        JOIN users u ON et.user_id = u.id
        WHERE et.user_id=$1 AND b.status='confirmed' AND b.start_time > NOW()
        ORDER BY b.start_time ASC`;
    }

    const result = await pool.query(query, [userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function cancel(req, res) {
  try {
    const result = await pool.query(
      `UPDATE bookings SET status='cancelled', updated_at=NOW()
       WHERE id=$1 AND status='confirmed' RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const booking = result.rows[0];
    const etResult = await pool.query(
      `SELECT et.*, u.timezone as host_timezone FROM event_types et
       JOIN users u ON et.user_id = u.id WHERE et.id=$1`,
      [booking.event_type_id]
    );
    const eventType = etResult.rows[0];

    try {
      await sendCancellationEmail(booking, eventType, 'host');
    } catch (emailErr) {
      console.error('Email send failed:', emailErr.message);
    }

    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function reschedule(req, res) {
  try {
    const { date, time } = req.body;
    if (!date || !time) {
      return res.status(400).json({ error: 'date and time required' });
    }

    const bookingResult = await pool.query(
      `SELECT b.*, et.user_id, et.name as event_type_name, et.duration_minutes,
              et.slug, u.timezone as host_timezone
       FROM bookings b
       JOIN event_types et ON b.event_type_id = et.id
       JOIN users u ON et.user_id = u.id
       WHERE b.id=$1 AND b.status='confirmed' AND et.user_id=$2`,
      [req.params.id, getDefaultUserId()]
    );
    if (bookingResult.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const oldBooking = bookingResult.rows[0];
    const hostTimezone = oldBooking.host_timezone || 'Asia/Kolkata';
    const dateKey = normalizeDateParam(date);

    const newStart = await wallClockToUtc(dateKey, time, hostTimezone);
    const newEnd = new Date(new Date(newStart).getTime() + oldBooking.duration_minutes * 60000);

    const withinAvailability = await isSlotWithinAvailability(
      oldBooking.user_id,
      dateKey,
      time,
      oldBooking.duration_minutes,
      hostTimezone
    );
    if (!withinAvailability) {
      return res.status(409).json({ error: AVAILABILITY_CHANGED_MESSAGE });
    }

    const overlap = await hasBookingOverlap(
      oldBooking.user_id,
      newStart,
      newEnd,
      oldBooking.id
    );
    if (overlap) {
      return res.status(409).json({ error: SLOT_TAKEN_MESSAGE });
    }

    const updateResult = await pool.query(
      `UPDATE bookings SET start_time=$1, end_time=$2, updated_at=NOW()
       WHERE id=$3 RETURNING *`,
      [new Date(newStart).toISOString(), newEnd.toISOString(), oldBooking.id]
    );
    const newBooking = updateResult.rows[0];

    const eventType = {
      name: oldBooking.event_type_name,
      duration_minutes: oldBooking.duration_minutes,
      slug: oldBooking.slug,
      host_timezone: hostTimezone,
    };

    try {
      await sendRescheduleEmail(oldBooking, newBooking, eventType);
    } catch (emailErr) {
      console.error('Email send failed:', emailErr.message);
    }

    res.json({
      ...newBooking,
      event_type_name: eventType.name,
      duration_minutes: eventType.duration_minutes,
      host_timezone: hostTimezone,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { list, cancel, reschedule };
