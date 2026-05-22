require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const pool = require('./index');

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

  const scheduleResult = await pool.query(
    `INSERT INTO availability_schedules (user_id, name, is_default)
     VALUES ($1, 'Working Hours', true)
     RETURNING *`,
    [user.id]
  );
  const schedule = scheduleResult.rows[0];

  for (let day = 1; day <= 5; day++) {
    await pool.query(
      `INSERT INTO availability_rules (schedule_id, day_of_week, start_time, end_time, is_active)
       VALUES ($1, $2, '09:00', '17:00', true)`,
      [schedule.id, day]
    );
  }

  const eventTypes = [
    { name: '15 Min Chat', slug: '15-min-chat', duration: 15, color: '#006BFF' },
    { name: '30 Minute Call', slug: '30-min-call', duration: 30, color: '#00A86B' },
    { name: '1 Hour Session', slug: '1-hour-session', duration: 60, color: '#8B5CF6' },
  ];

  const eventTypeRows = [];
  for (const et of eventTypes) {
    const r = await pool.query(
      `INSERT INTO event_types (user_id, name, slug, duration_minutes, color)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [user.id, et.name, et.slug, et.duration, et.color]
    );
    eventTypeRows.push(r.rows[0]);
  }

  const thirtyMinCall = eventTypeRows.find((e) => e.slug === '30-min-call');

  const now = new Date();
  const bookings = [
    {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      daysOffset: 2,
      hour: 10,
    },
    {
      name: 'Bob Smith',
      email: 'bob@example.com',
      daysOffset: 5,
      hour: 14,
    },
    {
      name: 'Carol Williams',
      email: 'carol@example.com',
      daysOffset: -3,
      hour: 11,
    },
    {
      name: 'David Brown',
      email: 'david@example.com',
      daysOffset: -6,
      hour: 15,
    },
  ];

  for (const b of bookings) {
    const start = new Date(now);
    start.setDate(start.getDate() + b.daysOffset);
    start.setUTCHours(b.hour, 0, 0, 0);
    const end = new Date(start.getTime() + 30 * 60000);
    await pool.query(
      `INSERT INTO bookings (event_type_id, invitee_name, invitee_email, start_time, end_time, status)
       VALUES ($1, $2, $3, $4, $5, 'confirmed')`,
      [thirtyMinCall.id, b.name, b.email, start.toISOString(), end.toISOString()]
    );
  }

  console.log('Seed complete');
  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
