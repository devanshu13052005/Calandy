import { useEffect, useState } from 'react';
import {
  DAY_ORDER,
  TIME_OPTIONS,
  defaultWeeklyAvailability,
} from '../utils/scheduleWeekly';

const TIMEZONES = [
  'Asia/Kolkata',
  'America/New_York',
  'America/Los_Angeles',
  'America/Chicago',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Australia/Sydney',
  'UTC',
];

export { defaultWeeklyAvailability };

export default function ScheduleFormModal({ open, onClose, onSave, initial }) {
  const [name, setName] = useState('');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [weeklyAvailability, setWeeklyAvailability] = useState(defaultWeeklyAvailability());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setName(initial.name || '');
      setTimezone(initial.timezone || 'Asia/Kolkata');
      setWeeklyAvailability(initial.weeklyAvailability || defaultWeeklyAvailability());
    } else {
      setName('');
      setTimezone('Asia/Kolkata');
      setWeeklyAvailability(defaultWeeklyAvailability());
    }
  }, [initial, open]);

  if (!open) return null;

  const updateDay = (day, patch) => {
    setWeeklyAvailability((prev) =>
      prev.map((d) => (d.day === day ? { ...d, ...patch } : d))
    );
  };

  const toggleDay = (day, isActive) => {
    setWeeklyAvailability((prev) =>
      prev.map((d) => {
        if (d.day !== day) return d;
        if (isActive && (!d.slots || d.slots.length === 0)) {
          return { ...d, isActive: true, slots: [{ startTime: '09:00', endTime: '17:00' }] };
        }
        return { ...d, isActive, slots: isActive ? d.slots : [] };
      })
    );
  };

  const updateSlot = (day, index, field, value) => {
    setWeeklyAvailability((prev) =>
      prev.map((d) => {
        if (d.day !== day) return d;
        const slots = d.slots.map((s, i) => (i === index ? { ...s, [field]: value } : s));
        return { ...d, slots };
      })
    );
  };

  const addSlot = (day) => {
    setWeeklyAvailability((prev) =>
      prev.map((d) => {
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
    setWeeklyAvailability((prev) =>
      prev.map((d) => {
        if (d.day !== day) return d;
        const slots = d.slots.filter((_, i) => i !== index);
        return { ...d, slots, isActive: slots.length > 0 };
      })
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        timezone: timezone || 'Asia/Kolkata',
        weeklyAvailability,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white rounded-t-xl sm:rounded-xl w-full max-w-[560px] max-h-[92vh] sm:max-h-[90vh] shadow-xl flex flex-col">
        <div className="flex justify-between items-center px-6 py-4 border-b border-[#E5E7EB] shrink-0">
          <h2 className="text-lg font-semibold">
            {initial ? 'Edit Schedule' : 'Create Schedule'}
          </h2>
          <button type="button" onClick={onClose} className="text-[#6B7280] hover:text-[#1A1F36] text-xl">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
          <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Schedule name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Coding Hours"
                className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#006BFF]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Timezone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <h3 className="text-sm font-medium text-[#6B7280] mb-2">Weekly hours</h3>
              <div className="space-y-1">
                {DAY_ORDER.map(({ day }) => {
                  const label = day.slice(0, 3);
                  const labelCap = label.charAt(0).toUpperCase() + label.slice(1);
                  const entry = weeklyAvailability.find((d) => d.day === day);
                  return (
                    <div
                      key={day}
                      className={`border-b border-[#F3F4F6] py-2 last:border-0 ${
                        !entry?.isActive ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                          <input
                            type="checkbox"
                            checked={entry?.isActive}
                            onChange={(e) => toggleDay(day, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-[#006BFF] after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                        </label>
                        <span className="w-10 text-sm font-medium">{labelCap}</span>
                        {entry?.isActive ? (
                          <div className="flex-1 space-y-2">
                            {(entry.slots || []).map((slot, idx) => (
                              <div key={idx} className="flex items-center gap-2 flex-wrap">
                                <select
                                  value={slot.startTime}
                                  onChange={(e) =>
                                    updateSlot(day, idx, 'startTime', e.target.value)
                                  }
                                  className="border border-[#E5E7EB] rounded-md px-2 py-1 text-sm"
                                >
                                  {TIME_OPTIONS.map((t) => (
                                    <option key={t} value={t}>
                                      {t}
                                    </option>
                                  ))}
                                </select>
                                <span className="text-[#9CA3AF]">—</span>
                                <select
                                  value={slot.endTime}
                                  onChange={(e) =>
                                    updateSlot(day, idx, 'endTime', e.target.value)
                                  }
                                  className="border border-[#E5E7EB] rounded-md px-2 py-1 text-sm"
                                >
                                  {TIME_OPTIONS.map((t) => (
                                    <option key={t} value={t}>
                                      {t}
                                    </option>
                                  ))}
                                </select>
                                {(entry.slots || []).length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeSlot(day, idx)}
                                    className="text-[#9CA3AF] hover:text-[#EF4444] text-lg leading-none px-1"
                                    aria-label="Remove slot"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => addSlot(day)}
                              className="text-xs text-[#006BFF] font-medium hover:underline"
                            >
                              + Add time slot
                            </button>
                          </div>
                        ) : (
                          <span className="text-sm text-[#9CA3AF]">Unavailable</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 px-4 sm:px-6 py-4 border-t border-[#E5E7EB] shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-[#6B7280] hover:bg-gray-100 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm bg-[#006BFF] text-white rounded-full font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
