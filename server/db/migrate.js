require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const pool = require('./index');
const { runMigrations } = require('../models');

async function migrate() {
  await runMigrations(pool);
  console.log('Migration complete');
  await pool.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
