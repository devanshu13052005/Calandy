import { useEffect, useState, useCallback, useMemo } from 'react';
import api from '../api/axios';
import PageLoader from '../components/PageLoader';
import ScheduleFormModal from '../components/ScheduleFormModal';
import WeeklyScheduleEditor from '../components/WeeklyScheduleEditor';
import { cloneWeekly, defaultWeeklyAvailability } from '../utils/scheduleWeekly';

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

function notifySchedulesUpdated() {
  window.dispatchEvent(new CustomEvent('schedules-updated'));
}

export default function Availability() {
  const [schedules, setSchedules] = useState([]);
  const [activeScheduleId, setActiveScheduleId] = useState(null);
  const [draftWeekly, setDraftWeekly] = useState(defaultWeeklyAvailability());
  const [weeklyDirty, setWeeklyDirty] = useState(false);
  const [overrides, setOverrides] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideForm, setOverrideForm] = useState(BLANK_FORM);
  const [submittingOverride, setSubmittingOverride] = useState(false);
  const [savingWeekly, setSavingWeekly] = useState(false);

  const activeSchedule = useMemo(
    () => schedules.find((s) => s.id === activeScheduleId) || null,
    [schedules, activeScheduleId]
  );

  const fetchSchedules = useCallback(async () => {
    const res = await api.get('/schedules');
    console.log('[Availability] GET /schedules response:', res.data);
    const list = Array.isArray(res.data) ? res.data : [];
    setSchedules(list);
    return list;
  }, []);

  const fetchOverrides = useCallback(async () => {
    const res = await api.get('/availability/overrides');
    setOverrides(Array.isArray(res.data) ? res.data : []);
  }, []);

  const loadInitial = useCallback(async () => {
    setInitialLoading(true);
    try {
      const list = await fetchSchedules();
      await fetchOverrides();
      const preferred =
        list.find((s) => s.isDefault)?.id || list[0]?.id || null;
      setActiveScheduleId((prev) => {
        if (prev && list.some((s) => s.id === prev)) return prev;
        return preferred;
      });
    } catch (err) {
      console.error('[Availability] Initial load failed:', err);
    } finally {
      setInitialLoading(false);
    }
  }, [fetchSchedules, fetchOverrides]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    const schedule = schedules.find((s) => s.id === activeScheduleId);
    if (!schedule) return;
    setDraftWeekly(cloneWeekly(schedule.weeklyAvailability || defaultWeeklyAvailability()));
    setWeeklyDirty(false);
  }, [activeScheduleId, schedules]);

  const handleScheduleChange = (e) => {
    setActiveScheduleId(e.target.value);
  };

  const handleSaveSchedule = async (payload) => {
    try {
      let saved;
      if (editingSchedule) {
        const res = await api.put(`/schedules/${editingSchedule.id}`, payload);
        saved = res.data;
        console.log('[Availability] PUT schedule response:', saved);
      } else {
        const res = await api.post('/schedules', payload);
        saved = res.data;
        console.log('[Availability] POST schedule response:', saved);
      }

      setFormOpen(false);
      setEditingSchedule(null);

      const list = await fetchSchedules();
      const newId = saved?.id || list[list.length - 1]?.id;
      if (newId) {
        setActiveScheduleId(newId);
      }

      notifySchedulesUpdated();
    } catch (err) {
      console.error('[Availability] Save schedule failed:', err);
      alert(err.response?.data?.error || 'Failed to save schedule');
      throw err;
    }
  };

  const handleSaveWeekly = async () => {
    if (!activeSchedule) return;
    setSavingWeekly(true);
    try {
      const res = await api.put(`/schedules/${activeSchedule.id}`, {
        name: activeSchedule.name,
        timezone: activeSchedule.timezone,
        weeklyAvailability: draftWeekly,
      });
      console.log('[Availability] PUT weekly hours response:', res.data);
      await fetchSchedules();
      setActiveScheduleId(res.data?.id || activeSchedule.id);
      if (res.data?.weeklyAvailability) {
        setDraftWeekly(cloneWeekly(res.data.weeklyAvailability));
      }
      setWeeklyDirty(false);
      notifySchedulesUpdated();
    } catch (err) {
      console.error('[Availability] Save weekly hours failed:', err);
      alert(err.response?.data?.error || 'Failed to save weekly hours');
    } finally {
      setSavingWeekly(false);
    }
  };

  const handleWeeklyChange = (next) => {
    setDraftWeekly(next);
    setWeeklyDirty(true);
  };

  const openOverrideModal = () => {
    setOverrideForm(BLANK_FORM);
    setShowOverrideModal(true);
  };

  const closeOverrideModal = () => {
    setShowOverrideModal(false);
    setOverrideForm(BLANK_FORM);
  };

  const handleAddOverride = async (e) => {
    e.preventDefault();
    setSubmittingOverride(true);
    try {
      await api.post('/availability/overrides', {
        ...overrideForm,
        start_time: overrideForm.is_off ? null : overrideForm.start_time,
        end_time: overrideForm.is_off ? null : overrideForm.end_time,
      });
      closeOverrideModal();
      await fetchOverrides();
    } finally {
      setSubmittingOverride(false);
    }
  };

  const deleteOverride = async (id) => {
    await api.delete(`/availability/overrides/${id}`);
    await fetchOverrides();
  };

  if (initialLoading) {
    return <PageLoader label="Loading availability..." />;
  }

  return (
    <div className="w-full max-w-6xl">
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

      {showOverrideModal && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeOverrideModal();
          }}
        >
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-[480px] max-h-[92vh] overflow-y-auto p-6 sm:p-8 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-[#1A1F36]">Add date-specific hours</h2>
              <button
                type="button"
                onClick={closeOverrideModal}
                className="text-[#9CA3AF] hover:text-[#1A1F36] text-2xl leading-none p-1"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <p className="text-xs text-[#9CA3AF] mb-4">
              Applies to your default schedule (
              {schedules.find((s) => s.isDefault)?.name || 'Working Hours (default)'}).
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
                  className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <label className="flex items-center gap-2 text-sm font-medium text-[#374151]">
                <input
                  type="checkbox"
                  checked={overrideForm.is_off}
                  onChange={(e) =>
                    setOverrideForm((f) => ({ ...f, is_off: e.target.checked }))
                  }
                  className="w-4 h-4 accent-[#006BFF]"
                />
                Mark this day as unavailable
              </label>
              {!overrideForm.is_off && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Start</label>
                    <input
                      type="time"
                      value={overrideForm.start_time}
                      onChange={(e) =>
                        setOverrideForm((f) => ({ ...f, start_time: e.target.value }))
                      }
                      className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">End</label>
                    <input
                      type="time"
                      value={overrideForm.end_time}
                      onChange={(e) =>
                        setOverrideForm((f) => ({ ...f, end_time: e.target.value }))
                      }
                      className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Reason (optional)</label>
                <input
                  type="text"
                  value={overrideForm.reason}
                  onChange={(e) =>
                    setOverrideForm((f) => ({ ...f, reason: e.target.value }))
                  }
                  className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeOverrideModal}
                  className="px-4 py-2.5 rounded-lg border text-sm text-[#6B7280]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingOverride}
                  className="px-5 py-2.5 rounded-lg bg-[#006BFF] text-white text-sm font-semibold disabled:opacity-50"
                >
                  {submittingOverride ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#1A1F36]">Availability</h1>
          <p className="text-[#6B7280] mt-1 text-sm">
            Set weekly hours and date-specific exceptions
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingSchedule(null);
            setFormOpen(true);
          }}
          className="w-full sm:w-auto bg-[#006BFF] text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-blue-700"
        >
          + Create Schedule
        </button>
      </div>

      {schedules.length === 0 ? (
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-8 text-center text-[#9CA3AF]">
          <p className="mb-4">No schedules yet.</p>
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="text-[#006BFF] font-medium hover:underline"
          >
            Create your first schedule
          </button>
        </div>
      ) : (
        <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center gap-3">
            <label className="text-sm font-medium text-[#6B7280] shrink-0">Schedule</label>
            <select
              value={activeScheduleId || ''}
              onChange={handleScheduleChange}
              className="flex-1 min-w-0 border border-[#E5E7EB] rounded-md px-3 py-2 text-sm font-medium text-[#1A1F36] bg-white"
            >
              {schedules.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.isDefault ? ' (default)' : ''}
                </option>
              ))}
            </select>
            {activeSchedule && !activeSchedule.isDefault && (
              <button
                type="button"
                onClick={() => {
                  setEditingSchedule(activeSchedule);
                  setFormOpen(true);
                }}
                className="text-sm text-[#006BFF] hover:underline shrink-0"
              >
                Rename / timezone
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] divide-y lg:divide-y-0 lg:divide-x divide-[#E5E7EB]">
            <div className="p-4 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h2 className="text-sm font-semibold text-[#1A1F36]">Weekly hours</h2>
                {weeklyDirty && (
                  <button
                    type="button"
                    onClick={handleSaveWeekly}
                    disabled={savingWeekly}
                    className="bg-[#006BFF] text-white text-sm font-medium px-4 py-1.5 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {savingWeekly ? 'Saving…' : 'Save changes'}
                  </button>
                )}
              </div>
              {activeSchedule && (
                <p className="text-xs text-[#9CA3AF] mb-4">{activeSchedule.timezone}</p>
              )}
              <WeeklyScheduleEditor
                weeklyAvailability={draftWeekly}
                onChange={handleWeeklyChange}
              />
            </div>

            <div className="p-4 sm:p-6 bg-[#FAFAFA]">
              <div className="flex items-center justify-between gap-2 mb-4">
                <h2 className="text-sm font-semibold text-[#1A1F36]">Date-specific hours</h2>
                <button
                  type="button"
                  onClick={openOverrideModal}
                  className="text-sm text-[#006BFF] font-medium hover:underline shrink-0"
                >
                  + Hours
                </button>
              </div>
              <p className="text-xs text-[#9CA3AF] mb-3">
                Custom hours for specific dates (default schedule)
              </p>
              <div className="space-y-2">
                {overrides.length === 0 && (
                  <p className="text-xs text-[#9CA3AF] py-4 text-center">
                    No date-specific hours yet
                  </p>
                )}
                {overrides.map((o) => (
                  <div
                    key={o.id}
                    className="bg-white border border-[#E5E7EB] rounded-md px-3 py-2 text-sm flex justify-between items-start gap-2"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-[#1A1F36]">
                        {formatOverrideDate(o.override_date)}
                      </p>
                      {o.is_off ? (
                        <p className="text-xs text-red-500 mt-0.5">Unavailable</p>
                      ) : (
                        <p className="text-xs text-[#6B7280] mt-0.5">
                          {String(o.start_time).slice(0, 5)} – {String(o.end_time).slice(0, 5)}
                        </p>
                      )}
                      {o.reason && (
                        <p className="text-xs text-[#9CA3AF] italic truncate">{o.reason}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteOverride(o.id)}
                      className="text-[#EF4444] text-xs hover:underline shrink-0"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {schedules.length > 0 && (
        <p className="text-xs text-[#9CA3AF] mt-4">
          {schedules.length} schedule{schedules.length !== 1 ? 's' : ''} saved
        </p>
      )}
    </div>
  );
}
