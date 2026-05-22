function generateSlots(startTime, endTime, durationMinutes, existingBookings) {
  const slots = [];
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  let current = startH * 60 + startM;
  const end = endH * 60 + endM;

  while (current + durationMinutes <= end) {
    const slotStart = current;
    const slotEnd = current + durationMinutes;
    const hasConflict = existingBookings.some((booking) => {
      const bStart = new Date(booking.start_time);
      const bEnd = new Date(booking.end_time);
      const bStartMin = bStart.getUTCHours() * 60 + bStart.getUTCMinutes();
      const bEndMin = bEnd.getUTCHours() * 60 + bEnd.getUTCMinutes();
      return slotStart < bEndMin && slotEnd > bStartMin;
    });
    if (!hasConflict) {
      const h = String(Math.floor(current / 60)).padStart(2, '0');
      const m = String(current % 60).padStart(2, '0');
      slots.push(`${h}:${m}`);
    }
    current += durationMinutes;
  }
  return slots;
}

module.exports = { generateSlots };
