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

/**
 * Returns the working hours text for a day, or null if the day is off.
 * Also returns whether the day has an override.
 */
function buildDayInfo(date, rules, overridesMap) {
  const key = format(date, 'yyyy-MM-dd');
  const override = overridesMap[key] || null;

  if (override) {
    if (override.is_off) {
      return { hours: null, override, isOff: true };
    }
    return {
      hours: `${formatHours12(override.start_time)} – ${formatHours12(override.end_time)}`,
      override,
      isOff: false,
    };
  }

  const rule = rules.find((r) => r.day_of_week === date.getDay() && r.is_active);
  if (!rule) return { hours: null, override: null, isOff: true };
  return {
    hours: `${formatHours12(rule.start_time)} – ${formatHours12(rule.end_time)}`,
    override: null,
    isOff: false,
  };
}

export default function AvailabilityCalendar({ rules, overrides }) {
  const [month, setMonth] = useState(startOfMonth(new Date()));

  // Build a key→override map.
  // override_date comes back as a plain YYYY-MM-DD string from the fixed backend,
  // so the string branch is always hit. The Date fallback uses LOCAL getters to
  // avoid the UTC-offset shift (same fix applied server-side).
  const overridesMap = useMemo(() => {
    const map = {};
    for (const o of overrides) {
      let key;
      if (typeof o.override_date === 'string') {
        key = o.override_date.slice(0, 10);
      } else {
        const dt = new Date(o.override_date);
        const y = dt.getFullYear();
        const mo = String(dt.getMonth() + 1).padStart(2, '0');
        const da = String(dt.getDate()).padStart(2, '0');
        key = `${y}-${mo}-${da}`;
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
      {/* Month navigation */}
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

      <div className="overflow-x-auto -mx-1 px-1 sm:mx-0 sm:px-0">
      <div className="availability-month-grid grid grid-cols-7 border border-[#E5E7EB] rounded-lg overflow-hidden">
        {/* Day-of-week headers */}
        {DAY_HEADERS.map((d) => (
          <div
            key={d}
            className="bg-[#FAFAFA] text-[10px] sm:text-[11px] font-medium text-[#6B7280] py-1.5 sm:py-2 text-center border-b border-[#E5E7EB]"
          >
            {d}
          </div>
        ))}

        {/* Leading blank cells */}
        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <div key={`blank-${i}`} className="min-h-[64px] sm:min-h-[88px] bg-[#FAFAFA] border-b border-r border-[#E5E7EB] last:border-r-0" />
        ))}

        {/* Day cells */}
        {days.map((date) => {
          const { hours, override, isOff } = buildDayInfo(date, rules, overridesMap);
          const inMonth = isSameMonth(date, month);

          // Determine cell background based on override status
          let cellBg = inMonth ? 'bg-white' : 'bg-[#FAFAFA]';
          let cellBorder = 'border-b border-r border-[#E5E7EB]';
          if (override && inMonth) {
            if (override.is_off) {
              cellBg = 'bg-red-50';
              cellBorder = 'border-b border-r border-red-200 border-l-2 border-l-red-400';
            } else {
              cellBg = 'bg-blue-50';
              cellBorder = 'border-b border-r border-blue-200 border-l-2 border-l-[#006BFF]';
            }
          }

          return (
            <div
              key={date.toISOString()}
              className={`min-h-[64px] sm:min-h-[88px] p-1.5 sm:p-2 last:border-r-0 ${cellBg} ${cellBorder}`}
            >
              <div className="text-sm font-medium text-[#1A1F36] mb-1">{format(date, 'd')}</div>

              {/* Override badge — only shown for days that have an override */}
              {override && inMonth && (
                <span
                  style={{
                    display: 'inline-block',
                    fontSize: '10px',
                    fontWeight: 600,
                    borderRadius: '4px',
                    padding: '2px 5px',
                    marginBottom: '3px',
                    background: override.is_off ? '#FEE2E2' : '#DBEAFE',
                    color: override.is_off ? '#DC2626' : '#1D4ED8',
                    letterSpacing: '0.02em',
                    textTransform: 'uppercase',
                  }}
                >
                  Override
                </span>
              )}

              {hours ? (
                <p className="text-[11px] text-[#6B7280] leading-snug">{hours}</p>
              ) : (
                <p className={`text-[11px] leading-snug ${override && override.is_off && inMonth ? 'text-red-400' : 'text-[#D1D5DB]'}`}>
                  {override && override.is_off && inMonth ? 'Off' : '—'}
                </p>
              )}
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}
