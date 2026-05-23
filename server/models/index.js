const extension = require('./extension');
const user = require('./user');
const eventType = require('./eventType');
const availabilitySchedule = require('./availabilitySchedule');
const availabilityRule = require('./availabilityRule');
const dateOverride = require('./dateOverride');
const booking = require('./booking');
const bookingQuestion = require('./bookingQuestion');
const bookingAnswer = require('./bookingAnswer');
const indexes = require('./indexes');
const alterations = require('./alterations');

const schemas = [
  extension,
  user,
  eventType,
  availabilitySchedule,
  availabilityRule,
  dateOverride,
  booking,
  bookingQuestion,
  bookingAnswer,
  indexes,
];

async function runMigrations(pool) {
  for (const sql of schemas) {
    await pool.query(sql);
  }
  await pool.query(alterations);
}

module.exports = { schemas, runMigrations };
