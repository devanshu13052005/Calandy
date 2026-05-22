const express = require('express');
const pool = require('../db');
const { generateSlots } = require('../lib/slots');
const {
  sendConfirmationEmail,
  sendCancellationEmail,
  sendRescheduleEmail,
} = require('../lib/emails');

const router = express.Router();

function formatTime(t) {
  if (!t) return null;
  if (typeof t === 'string') return t.slice(0, 5);
  return t.toISOString ? t.toISOString().slice(11, 16) : String(t).slice(0, 5);
}

router.get('/cancel/:token', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, et.name as event_name, et.duration_minutes, et.slug, u.name as host_name
       FROM bookings b JOIN event_types et ON b.event_type_id=et.id JOIN users u ON et.user_id=u.id
       WHERE b.cancel_token=$1`,
      [req.params.token]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const booking = result.rows[0];
    if (booking.status === 'cancelled') return res.status(410).json({ error: 'Already cancelled' });
    if (booking.status === 'rescheduled') {
      return res.status(410).json({ error: 'This link has expired. Check your latest email.' });
    }
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/cancel/:token', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE bookings SET status='cancelled', updated_at=NOW()
       WHERE cancel_token=$1 AND status='confirmed' RETURNING *`,
      [req.params.token]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const booking = result.rows[0];
    const etResult = await pool.query('SELECT * FROM event_types WHERE id=$1', [booking.event_type_id]);
    const eventType = etResult.rows[0];

    try {
      await sendCancellationEmail(booking, eventType, 'invitee');
    } catch (emailErr) {
      console.error('Email send failed:', emailErr.message);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/reschedule/:token', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, et.name as event_name, et.duration_minutes, et.slug, u.name as host_name, u.timezone as host_timezone
       FROM bookings b JOIN event_types et ON b.event_type_id=et.id JOIN users u ON et.user_id=u.id
       WHERE b.reschedule_token=$1`,
      [req.params.token]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const booking = result.rows[0];
    if (booking.status === 'cancelled') return res.status(410).json({ error: 'Already cancelled' });
    if (booking.status === 'rescheduled') {
      return res.status(410).json({ error: 'This link has expired. Check your latest email.' });
    }
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/reschedule/:token', async (req, res) => {
  try {
    const { date, time } = req.body;

    const bookingResult = await pool.query(
      'SELECT * FROM bookings WHERE reschedule_token=$1 AND status=$2',
      [req.params.token, 'confirmed']
    );
    if (bookingResult.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const oldBooking = bookingResult.rows[0];

    const etResult = await pool.query('SELECT * FROM event_types WHERE id=$1', [oldBooking.event_type_id]);
    const eventType = etResult.rows[0];

    const newStart = new Date(`${date}T${time}:00.000Z`);
    const newEnd = new Date(newStart.getTime() + eventType.duration_minutes * 60000);

    const conflict = await pool.query(
      `SELECT id FROM bookings
       WHERE event_type_id=$1 AND status='confirmed'
       AND id != $2 AND start_time < $3 AND end_time > $4`,
      [eventType.id, oldBooking.id, newEnd.toISOString(), newStart.toISOString()]
    );
    if (conflict.rows.length > 0) {
      return res.status(409).json({ error: 'Slot no longer available' });
    }

    await pool.query(
      `UPDATE bookings SET status='rescheduled', updated_at=NOW() WHERE id=$1`,
      [oldBooking.id]
    );

    const newBookingResult = await pool.query(
      `INSERT INTO bookings (event_type_id, invitee_name, invitee_email, start_time, end_time, invitee_timezone, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        eventType.id,
        oldBooking.invitee_name,
        oldBooking.invitee_email,
        newStart.toISOString(),
        newEnd.toISOString(),
        oldBooking.invitee_timezone,
        oldBooking.notes,
      ]
    );
    const newBooking = newBookingResult.rows[0];

    try {
      await sendRescheduleEmail(oldBooking, newBooking, eventType);
    } catch (emailErr) {
      console.error('Email send failed:', emailErr.message);
    }

    res.json({ ...newBooking, event_type_name: eventType.name, duration_minutes: eventType.duration_minutes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT et.*, u.name as host_name, u.timezone as host_timezone, u.email as host_email
       FROM event_types et JOIN users u ON et.user_id = u.id
       WHERE et.slug=$1 AND et.is_active=true`,
      [req.params.slug]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:slug/slots', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'date required' });

    const etResult = await pool.query(
      'SELECT * FROM event_types WHERE slug=$1 AND is_active=true',
      [req.params.slug]
    );
    if (etResult.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const eventType = etResult.rows[0];

    const scheduleResult = await pool.query(
      'SELECT * FROM availability_schedules WHERE user_id=$1 AND is_default=true LIMIT 1',
      [eventType.user_id]
    );
    if (scheduleResult.rows.length === 0) return res.json({ slots: [] });
    const schedule = scheduleResult.rows[0];

    const overrideResult = await pool.query(
      'SELECT * FROM date_overrides WHERE schedule_id=$1 AND override_date=$2',
      [schedule.id, date]
    );

    let startTime;
    let endTime;

    if (overrideResult.rows.length > 0) {
      const override = overrideResult.rows[0];
      if (override.is_off) return res.json({ slots: [] });
      startTime = formatTime(override.start_time);
      endTime = formatTime(override.end_time);
    } else {
      const dayOfWeek = new Date(`${date}T12:00:00`).getDay();
      const ruleResult = await pool.query(
        `SELECT start_time, end_time FROM availability_rules
         WHERE schedule_id=$1 AND day_of_week=$2 AND is_active=true`,
        [schedule.id, dayOfWeek]
      );
      if (ruleResult.rows.length === 0) return res.json({ slots: [] });
      startTime = formatTime(ruleResult.rows[0].start_time);
      endTime = formatTime(ruleResult.rows[0].end_time);
    }

    const bookingsResult = await pool.query(
      `SELECT start_time, end_time FROM bookings
       WHERE event_type_id=$1 AND status='confirmed'
       AND DATE(start_time AT TIME ZONE 'UTC') = $2`,
      [eventType.id, date]
    );

    const slots = generateSlots(
      startTime,
      endTime,
      eventType.duration_minutes,
      bookingsResult.rows
    );

    res.json({ slots });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:slug/book', async (req, res) => {
  try {
    const { date, time, invitee_name, invitee_email, invitee_timezone, notes, answers } = req.body;

    const etResult = await pool.query(
      'SELECT et.*, u.name as host_name, u.email as host_email FROM event_types et JOIN users u ON et.user_id = u.id WHERE et.slug=$1 AND et.is_active=true',
      [req.params.slug]
    );
    if (etResult.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const eventType = etResult.rows[0];

    const start_time = new Date(`${date}T${time}:00.000Z`);
    const end_time = new Date(start_time.getTime() + eventType.duration_minutes * 60000);

    const conflict = await pool.query(
      `SELECT id FROM bookings
       WHERE event_type_id=$1 AND status='confirmed'
       AND start_time < $2 AND end_time > $3`,
      [eventType.id, end_time.toISOString(), start_time.toISOString()]
    );
    if (conflict.rows.length > 0) {
      return res.status(409).json({ error: 'Slot no longer available' });
    }

    const bookingResult = await pool.query(
      `INSERT INTO bookings (event_type_id, invitee_name, invitee_email, start_time, end_time, invitee_timezone, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        eventType.id,
        invitee_name,
        invitee_email,
        start_time.toISOString(),
        end_time.toISOString(),
        invitee_timezone || 'Asia/Kolkata',
        notes || null,
      ]
    );
    const booking = bookingResult.rows[0];

    if (answers && answers.length > 0) {
      for (const ans of answers) {
        await pool.query(
          'INSERT INTO booking_answers (booking_id, question_id, answer_text) VALUES ($1, $2, $3)',
          [booking.id, ans.question_id, ans.answer_text]
        );
      }
    }

    const host = { name: eventType.host_name, email: eventType.host_email };
    try {
      await sendConfirmationEmail(booking, eventType, host);
    } catch (emailErr) {
      console.error('Email send failed:', emailErr.message);
    }

    res.status(201).json({ ...booking, event_type_name: eventType.name, duration_minutes: eventType.duration_minutes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
