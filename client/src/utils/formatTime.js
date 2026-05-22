const DEFAULT_TZ = 'Asia/Kolkata';

export function formatInTimeZone(isoString, timeZone = DEFAULT_TZ, options = {}) {
  if (!isoString) return '';
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timeZone || DEFAULT_TZ,
    ...options,
  }).format(new Date(isoString));
}

export function formatMeetingRange(startIso, endIso, timeZone = DEFAULT_TZ) {
  const tz = timeZone || DEFAULT_TZ;
  const datePart = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date(startIso));
  const timeOpts = { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: true };
  const startTime = new Intl.DateTimeFormat('en-US', timeOpts).format(new Date(startIso));
  const endTime = new Intl.DateTimeFormat('en-US', timeOpts).format(new Date(endIso));
  return `${datePart} · ${startTime} - ${endTime}`;
}

export function formatDateAndTime(isoString, timeZone = DEFAULT_TZ) {
  const tz = timeZone || DEFAULT_TZ;
  const datePart = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date(isoString));
  const timePart = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(isoString));
  return { datePart, timePart, combined: `${datePart} at ${timePart}` };
}
