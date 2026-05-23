const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAME_TO_DOW = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

export function buildScheduleSummary(weeklyAvailability = []) {
  const activeDays = weeklyAvailability.filter((d) => d.isActive && d.slots?.length);
  if (activeDays.length === 0) return 'No availability set';

  const dows = activeDays
    .map((d) => DAY_NAME_TO_DOW[d.day])
    .filter((n) => n !== undefined)
    .sort((a, b) => a - b);

  let daysSummary;
  if (dows.length === 5 && dows[0] === 1 && dows[4] === 5) {
    daysSummary = 'Mon–Fri';
  } else if (dows.length === 7) {
    daysSummary = 'Every day';
  } else {
    daysSummary = dows.map((d) => DAY_SHORT[d]).join(', ');
  }

  const ranges = activeDays.flatMap((d) =>
    d.slots.map((s) => `${s.startTime}–${s.endTime}`)
  );
  const unique = [...new Set(ranges)];
  const timeSummary = unique.length === 1 ? unique[0] : 'Hours vary';

  return `${daysSummary} · ${timeSummary}`;
}
