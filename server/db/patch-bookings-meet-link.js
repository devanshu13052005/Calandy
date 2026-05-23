require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const pool = require('./index');

async function patch() {
  await pool.query(`
    ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS meet_link VARCHAR(255)
  `);
  console.log('bookings.meet_link column ready');
  await pool.end();
}

patch().catch((err) => {
  console.error('Patch failed:', err.message);
  process.exit(1);
});
