require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const pool = require('./index');
const { wallClockToUtc } = require('../lib/timezone');
const { createDefaultScheduleForUser } = require('../lib/defaultSchedule');

async function seed() {
  const existing = await pool.query('SELECT id FROM users LIMIT 1');
  if (existing.rows.length > 0) {
    console.log('Seed skipped: user already exists');
    await pool.end();
    return;
  }

  const userResult = await pool.query(
    `INSERT INTO users (name, email, timezone)
     VALUES ('John Doe', 'john@example.com', 'Asia/Kolkata')
     RETURNING *`
  );
  const user = userResult.rows[0];

  const schedule = await createDefaultScheduleForUser(
    user.id,
    user.timezone || 'Asia/Kolkata'
  );

  const eventTypes = [
    { name: '15 Min Chat', slug: '15-min-chat', duration: 15, color: '#006BFF' },
    { name: '30 Minute Call', slug: '30-min-call', duration: 30, color: '#00A86B' },
    { name: '1 Hour Session', slug: '1-hour-session', duration: 60, color: '#8B5CF6' },
  ];

  const eventTypeRows = [];
  for (const et of eventTypes) {
    const r = await pool.query(
      `INSERT INTO event_types (user_id, name, slug, duration_minutes, color, schedule_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [user.id, et.name, et.slug, et.duration, et.color, schedule.id]
    );
    eventTypeRows.push(r.rows[0]);
  }

  const thirtyMinCall = eventTypeRows.find((e) => e.slug === '30-min-call');

  const hostTimezone = user.timezone || 'Asia/Kolkata';
  const now = new Date();
  const bookings = [
    { name: 'Alice Johnson', email: 'alice@example.com', daysOffset: 2, time: '10:00' },
    { name: 'Bob Smith', email: 'bob@example.com', daysOffset: 5, time: '14:00' },
    { name: 'Carol Williams', email: 'carol@example.com', daysOffset: -3, time: '11:00' },
    { name: 'David Brown', email: 'david@example.com', daysOffset: -6, time: '15:00' },
  ];

  for (const b of bookings) {
    const d = new Date(now);
    d.setDate(d.getDate() + b.daysOffset);
    const dateStr = d.toISOString().slice(0, 10);
    const start = await wallClockToUtc(dateStr, b.time, hostTimezone);
    const end = new Date(new Date(start).getTime() + 30 * 60000);
    await pool.query(
      `INSERT INTO bookings (event_type_id, invitee_name, invitee_email, start_time, end_time, status)
       VALUES ($1, $2, $3, $4, $5, 'confirmed')`,
      [thirtyMinCall.id, b.name, b.email, new Date(start).toISOString(), end.toISOString()]
    );
  }

  console.log('Seed complete');
  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
