const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatTime(t) {
  if (!t) return '';
  const s = String(t);
  return s.length >= 5 ? s.slice(0, 5) : s;
}

export function buildAvailabilitySummary(rules = []) {
  const active = rules.filter((r) => r.is_active);
  if (active.length === 0) return 'No availability set';

  const daySet = [...new Set(active.map((r) => r.day_of_week))].sort((a, b) => a - b);
  const dayStr = daySet.map((d) => DAY_LABELS[d]).join(', ');

  const ranges = active.map(
    (r) => `${formatTime(r.start_time)}–${formatTime(r.end_time)}`
  );
  const allSame = ranges.every((r) => r === ranges[0]);

  if (allSame) {
    return `${dayStr} · ${ranges[0]}`;
  }
  return `${dayStr} · hours vary`;
}
