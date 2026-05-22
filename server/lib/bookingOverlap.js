const pool = require('../db');

const SLOT_TAKEN_MESSAGE = 'This slot is already taken, please choose another time';

/**
 * Returns true when [newStart, newEnd) overlaps [existingStart, existingEnd).
 * Condition: newStart < existingEnd && newEnd > existingStart
 */
function timesOverlap(newStart, newEnd, existingStart, existingEnd) {
  const ns = new Date(newStart).getTime();
  const ne = new Date(newEnd).getTime();
  const es = new Date(existingStart).getTime();
  const ee = new Date(existingEnd).getTime();
  return ns < ee && ne > es;
}

/**
 * Fetch confirmed bookings for a host that overlap the proposed window.
 * @param {string} userId - Host user id
 * @param {Date|string} newStart - Proposed start (UTC)
 * @param {Date|string} newEnd - Proposed end (UTC)
 * @param {string|null} excludeBookingId - Booking id to ignore (reschedule)
 */
async function findOverlappingBookings(userId, newStart, newEnd, excludeBookingId = null) {
  const params = [userId, new Date(newStart).toISOString(), new Date(newEnd).toISOString()];
  let excludeClause = '';
  if (excludeBookingId) {
    params.push(excludeBookingId);
    excludeClause = ` AND b.id != $${params.length}`;
  }

  const result = await pool.query(
    `SELECT b.id, b.start_time, b.end_time, et.name AS event_type_name, et.duration_minutes
     FROM bookings b
     JOIN event_types et ON b.event_type_id = et.id
     WHERE et.user_id = $1
       AND b.status = 'confirmed'
       AND b.start_time < $2
       AND b.end_time > $3
       ${excludeClause}`,
    params
  );
  return result.rows;
}

async function hasBookingOverlap(userId, newStart, newEnd, excludeBookingId = null) {
  const overlapping = await findOverlappingBookings(userId, newStart, newEnd, excludeBookingId);
  return overlapping.length > 0;
}

module.exports = {
  SLOT_TAKEN_MESSAGE,
  timesOverlap,
  findOverlappingBookings,
  hasBookingOverlap,
};
