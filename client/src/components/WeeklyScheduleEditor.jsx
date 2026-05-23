import {
  DAY_ORDER,
  TIME_OPTIONS,
  formatTime12,
} from '../utils/scheduleWeekly';

export default function WeeklyScheduleEditor({ weeklyAvailability, onChange }) {
  const update = (next) => onChange(next);

  const updateDay = (day, patch) => {
    update(
      weeklyAvailability.map((d) => (d.day === day ? { ...d, ...patch } : d))
    );
  };

  const enableDay = (day) => {
    update(
      weeklyAvailability.map((d) => {
        if (d.day !== day) return d;
        return {
          ...d,
          isActive: true,
          slots: d.slots?.length ? d.slots : [{ startTime: '09:00', endTime: '17:00' }],
        };
      })
    );
  };

  const updateSlot = (day, index, field, value) => {
    update(
      weeklyAvailability.map((d) => {
        if (d.day !== day) return d;
        const slots = d.slots.map((s, i) => (i === index ? { ...s, [field]: value } : s));
        return { ...d, slots };
      })
    );
  };

  const addSlot = (day) => {
    update(
      weeklyAvailability.map((d) => {
        if (d.day !== day) return d;
        return {
          ...d,
          isActive: true,
          slots: [...(d.slots || []), { startTime: '09:00', endTime: '17:00' }],
        };
      })
    );
  };

  const removeSlot = (day, index) => {
    update(
      weeklyAvailability.map((d) => {
        if (d.day !== day) return d;
        const slots = d.slots.filter((_, i) => i !== index);
        return {
          ...d,
          slots,
          isActive: slots.length > 0,
        };
      })
    );
  };

  const copySlot = (day, index) => {
    const entry = weeklyAvailability.find((d) => d.day === day);
    const slot = entry?.slots?.[index];
    if (!slot) return;
    update(
      weeklyAvailability.map((d) => {
        if (d.day !== day) return d;
        return {
          ...d,
          isActive: true,
          slots: [...d.slots, { startTime: slot.startTime, endTime: slot.endTime }],
        };
      })
    );
  };

  return (
    <div className="space-y-0 divide-y divide-[#F3F4F6]">
      {DAY_ORDER.map(({ day, letter }) => {
        const entry = weeklyAvailability.find((d) => d.day === day) || {
          day,
          isActive: false,
          slots: [],
        };

        return (
          <div key={day} className="flex gap-3 py-3 first:pt-0 last:pb-0">
            <div
              className="w-8 h-8 shrink-0 rounded-full bg-[#1A1F36] text-white text-sm font-semibold flex items-center justify-center"
              aria-hidden
            >
              {letter}
            </div>

            <div className="flex-1 min-w-0">
              {entry.isActive && entry.slots?.length > 0 ? (
                <div className="space-y-2">
                  {entry.slots.map((slot, idx) => (
                    <div
                      key={`${day}-${idx}`}
                      className="flex flex-wrap items-center gap-2"
                    >
                      <select
                        value={slot.startTime}
                        onChange={(e) =>
                          updateSlot(day, idx, 'startTime', e.target.value)
                        }
                        className="border border-[#E5E7EB] rounded-md px-2 py-1.5 text-sm min-w-[5.5rem]"
                        aria-label={`${day} start time`}
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>
                            {formatTime12(t)}
                          </option>
                        ))}
                      </select>
                      <span className="text-[#9CA3AF] text-sm">–</span>
                      <select
                        value={slot.endTime}
                        onChange={(e) =>
                          updateSlot(day, idx, 'endTime', e.target.value)
                        }
                        className="border border-[#E5E7EB] rounded-md px-2 py-1.5 text-sm min-w-[5.5rem]"
                        aria-label={`${day} end time`}
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>
                            {formatTime12(t)}
                          </option>
                        ))}
                      </select>
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => addSlot(day)}
                          className="p-1.5 text-[#6B7280] hover:text-[#006BFF] rounded hover:bg-[#F5F5F5]"
                          title="Add time slot"
                          aria-label="Add time slot"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => copySlot(day, idx)}
                          className="p-1.5 text-[#6B7280] hover:text-[#006BFF] rounded hover:bg-[#F5F5F5]"
                          title="Duplicate slot"
                          aria-label="Duplicate slot"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSlot(day, idx)}
                          className="p-1.5 text-[#6B7280] hover:text-[#EF4444] rounded hover:bg-red-50"
                          title="Remove slot"
                          aria-label="Remove slot"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 min-h-[32px]">
                  <span className="text-sm text-[#9CA3AF]">Unavailable</span>
                  <button
                    type="button"
                    onClick={() => enableDay(day)}
                    className="p-1 text-[#6B7280] hover:text-[#006BFF] rounded hover:bg-[#F5F5F5]"
                    title="Add hours"
                    aria-label="Add hours for this day"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
