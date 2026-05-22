const express = require('express');
const pool = require('../db');
const { getDefaultUserId } = require('../lib/defaultUser');
const { sendCancellationEmail } = require('../lib/emails');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
    const userId = getDefaultUserId();

    let query;
    if (type === 'past') {
      query = `
        SELECT b.*, et.name as event_type_name, et.duration_minutes, et.color as event_type_color
        FROM bookings b JOIN event_types et ON b.event_type_id = et.id
        WHERE et.user_id=$1 AND b.status='confirmed' AND b.start_time < NOW()
        ORDER BY b.start_time DESC`;
    } else {
      query = `
        SELECT b.*, et.name as event_type_name, et.duration_minutes, et.color as event_type_color
        FROM bookings b JOIN event_types et ON b.event_type_id = et.id
        WHERE et.user_id=$1 AND b.status='confirmed' AND b.start_time > NOW()
        ORDER BY b.start_time ASC`;
    }

    const result = await pool.query(query, [userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/cancel', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE bookings SET status='cancelled', updated_at=NOW()
       WHERE id=$1 AND status='confirmed' RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const booking = result.rows[0];
    const etResult = await pool.query('SELECT * FROM event_types WHERE id=$1', [booking.event_type_id]);
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
});

module.exports = router;
