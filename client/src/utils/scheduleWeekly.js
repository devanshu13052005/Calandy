export const DAY_ORDER = [
  { day: 'sunday', letter: 'S' },
  { day: 'monday', letter: 'M' },
  { day: 'tuesday', letter: 'T' },
  { day: 'wednesday', letter: 'W' },
  { day: 'thursday', letter: 'T' },
  { day: 'friday', letter: 'F' },
  { day: 'saturday', letter: 'S' },
];

export function buildTimeOptions() {
  const opts = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      opts.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return opts;
}

export const TIME_OPTIONS = buildTimeOptions();

export function defaultWeeklyAvailability() {
  return DAY_ORDER.map(({ day }) => ({
    day,
    isActive: day !== 'saturday' && day !== 'sunday',
    slots:
      day !== 'saturday' && day !== 'sunday'
        ? [{ startTime: '09:00', endTime: '17:00' }]
        : [],
  }));
}

export function cloneWeekly(weekly = []) {
  return weekly.map((d) => ({
    day: d.day,
    isActive: d.isActive,
    slots: (d.slots || []).map((s) => ({ ...s })),
  }));
}

export function formatTime12(time24) {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'pm' : 'am';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, '0')}${period}`;
}
