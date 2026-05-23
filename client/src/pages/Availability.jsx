import { useEffect, useState, useCallback, useMemo } from 'react';
import api from '../api/axios';
import AvailabilityCalendar from '../components/AvailabilityCalendar';
import PageLoader from '../components/PageLoader';
import ScheduleCard from '../components/ScheduleCard';
import ScheduleFormModal from '../components/ScheduleFormModal';

const DAYS = [
  { day_of_week: 0, label: 'Sun' },
  { day_of_week: 1, label: 'Mon' },
  { day_of_week: 2, label: 'Tue' },
  { day_of_week: 3, label: 'Wed' },
  { day_of_week: 4, label: 'Thu' },
  { day_of_week: 5, label: 'Fri' },
  { day_of_week: 6, label: 'Sat' },
];

const DAY_NAME_TO_DOW = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

function buildTimeOptions() {
  const opts = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      opts.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return opts;
}

const TIME_OPTIONS = buildTimeOptions();

function weeklyToRules(weeklyAvailability) {
  const rules = [];
  for (const d of weeklyAvailability || []) {
    const dow = DAY_NAME_TO_DOW[d.day];
    if (dow === undefined) continue;
    if (!d.isActive || !d.slots?.length) {
      rules.push({
        day_of_week: dow,
        start_time: '09:00',
        end_time: '17:00',
        is_active: false,
      });
      continue;
    }
    for (const slot of d.slots) {
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

function formatOverrideDate(d) {
  if (typeof d === 'string') return d.slice(0, 10);
  const dt = new Date(d);
  const y = dt.getFullYear();
  const mo = String(dt.getMonth() + 1).padStart(2, '0');
  const da = String(dt.getDate()).padStart(2, '0');
  return `${y}-${mo}-${da}`;
}

const BLANK_FORM = {
  override_date: '',
  is_off: true,
  start_time: '09:00',
  end_time: '17:00',
  reason: '',
};

export default function Availability() {
  const [view, setView] = useState('schedules');
  const [schedules, setSchedules] = useState([]);
  const [overrides, setOverrides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [overrideForm, setOverrideForm] = useState(BLANK_FORM);
  const [submitting, setSubmitting] = useState(false);

  const defaultSchedule = useMemo(
    () => schedules.find((s) => s.isDefault),
    [schedules]
  );

  const calendarRules = useMemo(
    () => weeklyToRules(defaultSchedule?.weeklyAvailability),
    [defaultSchedule]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [schedulesRes, overridesRes] = await Promise.all([
        api.get('/schedules'),
        api.get('/availability/overrides'),
      ]);
      setSchedules(Array.isArray(schedulesRes.data) ? schedulesRes.data : []);
      setOverrides(Array.isArray(overridesRes.data) ? overridesRes.data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSaveSchedule = async (payload) => {
    if (editingSchedule) {
      await api.put(`/schedules/${editingSchedule.id}`, payload);
    } else {
      await api.post('/schedules', payload);
    }
    setFormOpen(false);
    setEditingSchedule(null);
    await load();
  };

  const handleDeleteSchedule = async (schedule) => {
    if (schedule.isDefault) return;
    if (!window.confirm(`Delete schedule "${schedule.name}"?`)) return;
    await api.delete(`/schedules/${schedule.id}`);
    await load();
  };

  const handleDuplicateSchedule = async (schedule) => {
    await api.post(`/schedules/${schedule.id}/duplicate`);
    await load();
  };

  const openModal = () => {
    setOverrideForm(BLANK_FORM);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setOverrideForm(BLANK_FORM);
  };

  const handleAddOverride = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/availability/overrides', {
        ...overrideForm,
        start_time: overrideForm.is_off ? null : overrideForm.start_time,
        end_time: overrideForm.is_off ? null : overrideForm.end_time,
      });
      closeModal();
      await load();
    } finally {
      setSubmitting(false);
    }
  };

  const deleteOverride = async (id) => {
    await api.delete(`/availability/overrides/${id}`);
    await load();
  };

  if (loading) {
    return <PageLoader label="Loading availability..." />;
  }

  return (
    <div className="w-full">
      {formOpen && (
        <ScheduleFormModal
          open={formOpen}
          onClose={() => {
            setFormOpen(false);
            setEditingSchedule(null);
          }}
          onSave={handleSaveSchedule}
          initial={editingSchedule}
        />
      )}

      {showModal && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-[480px] max-h-[92vh] overflow-y-auto p-6 sm:p-8 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-[#1A1F36]">Add Date Override</h2>
              <button
                type="button"
                onClick={closeModal}
                className="text-[#9CA3AF] hover:text-[#1A1F36] text-2xl leading-none p-1"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <p className="text-xs text-[#9CA3AF] mb-4">
              Overrides apply to your default schedule ({defaultSchedule?.name || 'Working Hours'}).
            </p>

            <form onSubmit={handleAddOverride} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">
                  Date <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={overrideForm.override_date}
                  onChange={(e) =>
                    setOverrideForm((f) => ({ ...f, override_date: e.target.value }))
                  }
                  className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#006BFF]/30"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-sm text-[#374151] font-medium">
                <input
                  type="checkbox"
                  checked={overrideForm.is_off}
                  onChange={(e) =>
                    setOverrideForm((f) => ({ ...f, is_off: e.target.checked }))
                  }
                  className="w-4 h-4 accent-[#006BFF]"
                />
                Mark this day as Off (no bookings)
              </label>

              {!overrideForm.is_off && (
                <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                  <div className="flex-1 min-w-0">
                    <label className="block text-sm font-medium text-[#374151] mb-1.5">
                      Start Time
                    </label>
                    <select
                      value={overrideForm.start_time}
                      onChange={(e) =>
                        setOverrideForm((f) => ({ ...f, start_time: e.target.value }))
                      }
                      className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm bg-white"
                    >
                      {TIME_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <span className="hidden sm:block text-[#9CA3AF] pb-2">—</span>
                  <div className="flex-1 min-w-0">
                    <label className="block text-sm font-medium text-[#374151] mb-1.5">
                      End Time
                    </label>
                    <select
                      value={overrideForm.end_time}
                      onChange={(e) =>
                        setOverrideForm((f) => ({ ...f, end_time: e.target.value }))
                      }
                      className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm bg-white"
                    >
                      {TIME_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">
                  Reason <span className="text-[#9CA3AF] font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Public holiday, personal appointment…"
                  value={overrideForm.reason}
                  onChange={(e) =>
                    setOverrideForm((f) => ({ ...f, reason: e.target.value }))
                  }
                  className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#006BFF]/30"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2.5 rounded-lg border border-[#E5E7EB] text-sm text-[#6B7280] hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-lg bg-[#006BFF] text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Saving…' : 'Save Override'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between mb-6">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold text-[#1A1F36]">Availability</h1>
          <p className="text-[#6B7280] mt-1">
            Create reusable schedules and assign them to event types
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-[#E5E7EB] p-0.5 bg-[#FAFAFA]">
          <button
            type="button"
            onClick={() => setView('schedules')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              view === 'schedules'
                ? 'bg-white text-[#1A1F36] shadow-sm'
                : 'text-[#6B7280] hover:text-[#1A1F36]'
            }`}
          >
            Schedules
          </button>
          <button
            type="button"
            onClick={() => setView('calendar')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              view === 'calendar'
                ? 'bg-white text-[#1A1F36] shadow-sm'
                : 'text-[#6B7280] hover:text-[#1A1F36]'
            }`}
          >
            Calendar
          </button>
        </div>
      </div>

      {view === 'schedules' ? (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-4">
            <h2 className="text-lg font-medium text-[#1A1F36]">Your schedules</h2>
            <button
              type="button"
              onClick={() => {
                setEditingSchedule(null);
                setFormOpen(true);
              }}
              className="w-full sm:w-auto bg-[#006BFF] text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              + Create Schedule
            </button>
          </div>

          <div className="space-y-2 mb-10">
            {schedules.length === 0 && (
              <p className="text-sm text-[#9CA3AF] py-8 text-center bg-white border border-[#E5E7EB] rounded-lg">
                No schedules yet. Create your first schedule to get started.
              </p>
            )}
            {schedules.map((schedule) => (
              <ScheduleCard
                key={schedule.id}
                schedule={schedule}
                onEdit={(s) => {
                  setEditingSchedule(s);
                  setFormOpen(true);
                }}
                onDelete={handleDeleteSchedule}
                onDuplicate={handleDuplicateSchedule}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 sm:p-6 mb-10 overflow-hidden">
          <h2 className="font-medium text-[#1A1F36] mb-1">
            {defaultSchedule?.name || 'Default schedule'}
          </h2>
          <p className="text-xs text-[#9CA3AF] mb-4">Calendar preview (default schedule)</p>
          <AvailabilityCalendar rules={calendarRules} overrides={overrides} />
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-4">
        <div>
          <h2 className="text-lg font-medium text-[#1A1F36]">Date Overrides</h2>
          <p className="text-xs text-[#9CA3AF] mt-0.5">
            {overrides.length} override{overrides.length !== 1 ? 's' : ''} set
          </p>
        </div>
        <button
          type="button"
          onClick={openModal}
          className="w-full sm:w-auto bg-[#006BFF] text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          + Add Override
        </button>
      </div>

      <div className="space-y-2">
        {overrides.length === 0 && (
          <p className="text-sm text-[#9CA3AF] py-4 text-center">
            No overrides yet. Click <strong>+ Add Override</strong> to set a custom day.
          </p>
        )}
        {overrides.map((o) => (
          <div
            key={o.id}
            className="bg-white border border-[#E5E7EB] rounded-lg px-4 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm"
          >
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
              <span className="font-semibold text-[#1A1F36]">
                {formatOverrideDate(o.override_date)}
              </span>
              {o.is_off ? (
                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                  Off
                </span>
              ) : (
                <span className="text-xs bg-blue-50 text-[#006BFF] px-2 py-0.5 rounded-full font-medium">
                  {String(o.start_time).slice(0, 5)} – {String(o.end_time).slice(0, 5)}
                </span>
              )}
              {o.reason && (
                <span className="text-[#9CA3AF] italic w-full sm:w-auto truncate">{o.reason}</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => deleteOverride(o.id)}
              className="text-[#EF4444] hover:underline text-xs font-medium self-start sm:self-center shrink-0"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
