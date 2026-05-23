const pool = require('../db');
const { generateSlots } = require('../lib/slots');
const { wallClockToUtc } = require('../lib/timezone');
const { SLOT_TAKEN_MESSAGE, hasBookingOverlap } = require('../lib/bookingOverlap');
const {
  normalizeDateParam,
  getAvailabilityForDate,
  isSlotWithinAvailability,
  AVAILABILITY_CHANGED_MESSAGE,
} = require('../lib/availability');
const { fetchRulesForSchedule, resolveScheduleId } = require('../lib/scheduleQueries');
const {
  sendConfirmationEmail,
  sendCancellationEmail,
  sendRescheduleEmail,
} = require('../lib/emails');
const { generateMeetLink } = require('../lib/meetLink');

async function getCancelBooking(req, res) {
  try {
    const result = await pool.query(
      `SELECT b.*, et.name as event_name, et.duration_minutes, et.slug, u.name as host_name, u.timezone as host_timezone
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
}

async function cancelBooking(req, res) {
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
}

async function getRescheduleBooking(req, res) {
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
}

async function rescheduleBooking(req, res) {
  try {
    const { date, time } = req.body;

    const bookingResult = await pool.query(
      'SELECT * FROM bookings WHERE reschedule_token=$1 AND status=$2',
      [req.params.token, 'confirmed']
    );
    if (bookingResult.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const oldBooking = bookingResult.rows[0];

    const etResult = await pool.query(
      `SELECT et.*, u.timezone as host_timezone FROM event_types et
       JOIN users u ON et.user_id = u.id WHERE et.id=$1`,
      [oldBooking.event_type_id]
    );
    const eventType = etResult.rows[0];
    const hostTimezone = eventType.host_timezone || 'Asia/Kolkata';

    const dateKey = normalizeDateParam(date);
    const newStart = await wallClockToUtc(dateKey, time, hostTimezone);
    const newEnd = new Date(new Date(newStart).getTime() + eventType.duration_minutes * 60000);

    const withinAvailability = await isSlotWithinAvailability(
      eventType.user_id,
      dateKey,
      time,
      eventType.duration_minutes,
      hostTimezone,
      eventType.schedule_id
    );
    if (!withinAvailability) {
      return res.status(409).json({ error: AVAILABILITY_CHANGED_MESSAGE });
    }

    const overlap = await hasBookingOverlap(
      eventType.user_id,
      newStart,
      newEnd,
      oldBooking.id
    );
    if (overlap) {
      return res.status(409).json({ error: SLOT_TAKEN_MESSAGE });
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
        new Date(newStart).toISOString(),
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

async function getEventType(req, res) {
  try {
    const result = await pool.query(
      `SELECT et.*, u.name as host_name, u.timezone as host_timezone, u.email as host_email
       FROM event_types et JOIN users u ON et.user_id = u.id
       WHERE et.slug=$1 AND et.is_active=true`,
      [req.params.slug]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const eventType = result.rows[0];
    const scheduleId = await resolveScheduleId(eventType.user_id, eventType.schedule_id);
    const rules = scheduleId ? await fetchRulesForSchedule(scheduleId) : [];
    const available_days = rules.filter((r) => r.is_active).map((r) => r.day_of_week);
    res.json({ ...eventType, available_days });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getSlots(req, res) {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'date required' });
    const dateKey = normalizeDateParam(date);

    const etResult = await pool.query(
      `SELECT et.*, u.timezone as host_timezone FROM event_types et
       JOIN users u ON et.user_id = u.id
       WHERE et.slug=$1 AND et.is_active=true`,
      [req.params.slug]
    );
    if (etResult.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const eventType = etResult.rows[0];
    const hostTimezone = eventType.host_timezone || 'Asia/Kolkata';

    const availability = await getAvailabilityForDate(
      eventType.user_id,
      dateKey,
      eventType.schedule_id
    );
    if (!availability || availability.isOff) return res.json({ slots: [] });

    const bookingsResult = await pool.query(
      `SELECT
         (EXTRACT(HOUR FROM (b.start_time AT TIME ZONE $3))::int * 60
          + EXTRACT(MINUTE FROM (b.start_time AT TIME ZONE $3))::int) AS start_min,
         (EXTRACT(HOUR FROM (b.end_time AT TIME ZONE $3))::int * 60
          + EXTRACT(MINUTE FROM (b.end_time AT TIME ZONE $3))::int) AS end_min
       FROM bookings b
       JOIN event_types et ON b.event_type_id = et.id
       WHERE et.user_id = $1 AND b.status = 'confirmed'
       AND (b.start_time AT TIME ZONE $3)::date = $2::date`,
      [eventType.user_id, dateKey, hostTimezone]
    );

    const slotSet = new Set();
    for (const window of availability.windows) {
      const daySlots = generateSlots(
        window.startTime,
        window.endTime,
        eventType.duration_minutes,
        bookingsResult.rows
      );
      daySlots.forEach((s) => slotSet.add(s));
    }
    const slots = [...slotSet].sort();

    res.json({ slots });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function book(req, res) {
  try {
    const { date, time, invitee_name, invitee_email, invitee_timezone, notes, answers } = req.body;

    const etResult = await pool.query(
      `SELECT et.*, u.name as host_name, u.email as host_email, u.timezone as host_timezone
       FROM event_types et JOIN users u ON et.user_id = u.id WHERE et.slug=$1 AND et.is_active=true`,
      [req.params.slug]
    );
    if (etResult.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const eventType = etResult.rows[0];
    const hostTimezone = eventType.host_timezone || 'Asia/Kolkata';

    const dateKey = normalizeDateParam(date);
    const start_time = await wallClockToUtc(dateKey, time, hostTimezone);
    const end_time = new Date(new Date(start_time).getTime() + eventType.duration_minutes * 60000);

    const withinAvailability = await isSlotWithinAvailability(
      eventType.user_id,
      dateKey,
      time,
      eventType.duration_minutes,
      hostTimezone,
      eventType.schedule_id
    );
    if (!withinAvailability) {
      return res.status(409).json({ error: AVAILABILITY_CHANGED_MESSAGE });
    }

    const overlap = await hasBookingOverlap(eventType.user_id, start_time, end_time);
    if (overlap) {
      return res.status(409).json({ error: SLOT_TAKEN_MESSAGE });
    }

    const meetLink = generateMeetLink();

    const bookingResult = await pool.query(
      `INSERT INTO bookings (event_type_id, invitee_name, invitee_email, start_time, end_time, invitee_timezone, notes, meet_link)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        eventType.id,
        invitee_name,
        invitee_email,
        new Date(start_time).toISOString(),
        end_time.toISOString(),
        invitee_timezone || 'Asia/Kolkata',
        notes || null,
        meetLink,
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

    res.status(201).json({
      ...booking,
      event_type_name: eventType.name,
      duration_minutes: eventType.duration_minutes,
      host_timezone: hostTimezone,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getCancelBooking,
  cancelBooking,
  getRescheduleBooking,
  rescheduleBooking,
  getEventType,
  getSlots,
  book,
};
