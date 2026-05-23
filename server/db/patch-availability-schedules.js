/**
 * Adds missing columns to availability_schedules (safe to run multiple times).
 * Run: node server/db/patch-availability-schedules.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const pool = require('./index');

const EXPECTED_COLUMNS = {
  id: 'uuid',
  user_id: 'uuid',
  name: 'character varying',
  is_default: 'boolean',
  timezone: 'character varying',
  created_at: 'timestamp with time zone',
};

async function listColumns() {
  const result = await pool.query(
    `SELECT column_name, data_type
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'availability_schedules'
     ORDER BY ordinal_position`
  );
  return result.rows;
}

async function patch() {
  const before = await listColumns();
  console.log('availability_schedules columns (before):');
  before.forEach((c) => console.log(`  - ${c.column_name}: ${c.data_type}`));

  await pool.query(`
    ALTER TABLE availability_schedules
    ADD COLUMN IF NOT EXISTS timezone VARCHAR(100) DEFAULT 'Asia/Kolkata'
  `);

  await pool.query(`
    UPDATE availability_schedules
    SET timezone = 'Asia/Kolkata'
    WHERE timezone IS NULL
  `);

  const after = await listColumns();
  console.log('\navailability_schedules columns (after):');
  after.forEach((c) => console.log(`  - ${c.column_name}: ${c.data_type}`));

  const afterNames = new Set(after.map((c) => c.column_name));
  const missing = Object.keys(EXPECTED_COLUMNS).filter((col) => !afterNames.has(col));
  if (missing.length > 0) {
    console.warn('\nStill missing columns expected by the app:', missing.join(', '));
  } else {
    console.log('\nAll expected availability_schedules columns are present.');
  }

  await pool.end();
}

patch().catch((err) => {
  console.error('Patch failed:', err.message);
  process.exit(1);
});
