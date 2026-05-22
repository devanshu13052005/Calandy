import { useMemo, useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
  getDay,
} from 'date-fns';

const DAY_HEADERS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function formatTime(t) {
  if (!t) return '';
  const s = String(t);
  return s.length >= 5 ? s.slice(0, 5) : s;
}

function formatHours12(time) {
  const [h, m] = formatTime(time).split(':').map(Number);
  const period = h >= 12 ? 'pm' : 'am';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, '0')}${period}`;
}

function buildDayHours(date, rules, overridesMap) {
  const key = format(date, 'yyyy-MM-dd');
  if (overridesMap[key]) {
    const o = overridesMap[key];
    if (o.is_off) return null;
    return `${formatHours12(o.start_time)} – ${formatHours12(o.end_time)}`;
  }
  const rule = rules.find((r) => r.day_of_week === date.getDay() && r.is_active);
  if (!rule) return null;
  return `${formatHours12(rule.start_time)} – ${formatHours12(rule.end_time)}`;
}

export default function AvailabilityCalendar({ rules, overrides }) {
  const [month, setMonth] = useState(startOfMonth(new Date()));

  const overridesMap = useMemo(() => {
    const map = {};
    for (const o of overrides) {
      let key;
      if (typeof o.override_date === 'string') {
        key = o.override_date.slice(0, 10);
      } else {
        const dt = new Date(o.override_date);
        key = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
      }
      map[key] = o;
    }
    return map;
  }, [overrides]);

  const days = useMemo(() => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    return eachDayOfInterval({ start, end });
  }, [month]);

  const leadingBlanks = getDay(startOfMonth(month));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => setMonth(subMonths(month, 1))}
          className="p-2 text-[#6B7280] hover:bg-gray-100 rounded-md"
          aria-label="Previous month"
        >
          ‹
        </button>
        <h3 className="text-base font-semibold text-[#1A1F36]">{format(month, 'MMMM yyyy')}</h3>
        <button
          type="button"
          onClick={() => setMonth(addMonths(month, 1))}
          className="p-2 text-[#6B7280] hover:bg-gray-100 rounded-md"
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 border border-[#E5E7EB] rounded-lg overflow-hidden">
        {DAY_HEADERS.map((d) => (
          <div
            key={d}
            className="bg-[#FAFAFA] text-[11px] font-medium text-[#6B7280] py-2 text-center border-b border-[#E5E7EB]"
          >
            {d}
          </div>
        ))}
        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <div key={`blank-${i}`} className="min-h-[88px] bg-[#FAFAFA] border-b border-r border-[#E5E7EB] last:border-r-0" />
        ))}
        {days.map((date) => {
          const hours = buildDayHours(date, rules, overridesMap);
          const inMonth = isSameMonth(date, month);
          return (
            <div
              key={date.toISOString()}
              className={`min-h-[88px] p-2 border-b border-r border-[#E5E7EB] last:border-r-0 ${
                inMonth ? 'bg-white' : 'bg-[#FAFAFA]'
              }`}
            >
              <div className="text-sm font-medium text-[#1A1F36] mb-1">{format(date, 'd')}</div>
              {hours ? (
                <p className="text-[11px] text-[#6B7280] leading-snug">{hours}</p>
              ) : (
                <p className="text-[11px] text-[#D1D5DB]">—</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
