const DAY_NAMES = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

const DAY_NAME_TO_DOW = Object.fromEntries(DAY_NAMES.map((name, i) => [name, i]));

function formatTimeValue(t) {
  if (!t) return null;
  if (typeof t === 'string') return t.slice(0, 5);
  const s = String(t);
  if (/^\d{1,2}:\d{2}/.test(s)) return s.slice(0, 5);
  if (t.toISOString) return t.toISOString().slice(11, 16);
  return s.slice(0, 5);
}

function defaultWeeklyAvailability() {
  return DAY_NAMES.map((day) => ({
    day,
    isActive: day !== 'saturday' && day !== 'sunday',
    slots:
      day !== 'saturday' && day !== 'sunday'
        ? [{ startTime: '09:00', endTime: '17:00' }]
        : [],
  }));
}

function rulesToWeeklyAvailability(rules) {
  const byDay = Object.fromEntries(
    DAY_NAMES.map((day) => [day, { day, isActive: false, slots: [] }])
  );

  for (const rule of rules) {
    const day = DAY_NAMES[rule.day_of_week];
    if (!day) continue;
    const entry = byDay[day];
    if (rule.is_active) {
      entry.isActive = true;
      entry.slots.push({
        startTime: formatTimeValue(rule.start_time),
        endTime: formatTimeValue(rule.end_time),
      });
    }
  }

  for (const day of DAY_NAMES) {
    const entry = byDay[day];
    entry.slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  return DAY_NAMES.map((day) => byDay[day]);
}

function weeklyAvailabilityToRules(weeklyAvailability) {
  const rules = [];
  for (const dayEntry of weeklyAvailability || []) {
    const dow = DAY_NAME_TO_DOW[dayEntry.day];
    if (dow === undefined) continue;

    if (!dayEntry.isActive || !dayEntry.slots?.length) {
      rules.push({
        day_of_week: dow,
        start_time: '09:00',
        end_time: '17:00',
        is_active: false,
      });
      continue;
    }

    for (const slot of dayEntry.slots) {
      if (!slot.startTime || !slot.endTime) continue;
      rules.push({
        day_of_week: dow,
        start_time: slot.startTime,
        end_time: slot.endTime,
        is_active: true,
      });
    }
  }
  return rules;
}

function summarizeSchedule(weeklyAvailability) {
  const activeDays = (weeklyAvailability || []).filter((d) => d.isActive && d.slots?.length);
  if (activeDays.length === 0) return { daysSummary: 'No days', timeSummary: '' };

  const dows = activeDays
    .map((d) => DAY_NAME_TO_DOW[d.day])
    .filter((n) => n !== undefined)
    .sort((a, b) => a - b);

  const short = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  let daysSummary;
  if (dows.length === 5 && dows[0] === 1 && dows[4] === 5) {
    daysSummary = 'Mon–Fri';
  } else if (dows.length === 7) {
    daysSummary = 'Every day';
  } else {
    daysSummary = dows.map((d) => short[d]).join(', ');
  }

  const allSlots = activeDays.flatMap((d) =>
    d.slots.map((s) => `${s.startTime}–${s.endTime}`)
  );
  const uniqueRanges = [...new Set(allSlots)];
  const timeSummary =
    uniqueRanges.length === 1 ? uniqueRanges[0] : 'Hours vary';

  return { daysSummary, timeSummary };
}

module.exports = {
  DAY_NAMES,
  DAY_NAME_TO_DOW,
  formatTimeValue,
  defaultWeeklyAvailability,
  rulesToWeeklyAvailability,
  weeklyAvailabilityToRules,
  summarizeSchedule,
};
