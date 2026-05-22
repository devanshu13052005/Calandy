const pool = require('../db');

let defaultUserId = null;

async function initDefaultUser() {
  const result = await pool.query('SELECT id FROM users LIMIT 1');
  if (result.rows.length === 0) {
    throw new Error('No default user found. Run seed first.');
  }
  defaultUserId = result.rows[0].id;
  return defaultUserId;
}

function getDefaultUserId() {
  if (!defaultUserId) {
    throw new Error('Default user not initialized');
  }
  return defaultUserId;
}

module.exports = { initDefaultUser, getDefaultUserId };
