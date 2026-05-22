import { useEffect, useState } from 'react';
import api from '../api/axios';
import AvailabilityCalendar from '../components/AvailabilityCalendar';
import PageLoader from '../components/PageLoader';

const DAYS = [
  { day_of_week: 0, label: 'Sun' },
  { day_of_week: 1, label: 'Mon' },
  { day_of_week: 2, label: 'Tue' },
  { day_of_week: 3, label: 'Wed' },
  { day_of_week: 4, label: 'Thu' },
  { day_of_week: 5, label: 'Fri' },
  { day_of_week: 6, label: 'Sat' },
];

function buildTimeOptions() {
  const opts = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      const val = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      opts.push(val);
    }
  }
  return opts;
}

const TIME_OPTIONS = buildTimeOptions();

function defaultRules() {
  return DAYS.map((d) => ({
    day_of_week: d.day_of_week,
    start_time: '09:00',
    end_time: '17:00',
    is_active: d.day_of_week >= 1 && d.day_of_week <= 5,
  }));
}

function formatOverrideDate(d) {
  if (typeof d === 'string') return d.slice(0, 10);
  const dt = new Date(d);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
}

export default function Availability() {
  const [view, setView] = useState('list');
  const [rules, setRules] = useState(defaultRules());
  const [overrides, setOverrides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [overrideForm, setOverrideForm] = useState({
    override_date: '',
    is_off: true,
    start_time: '09:00',
    end_time: '17:00',
    reason: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const [availRes, overridesRes] = await Promise.all([
        api.get('/availability'),
        api.get('/availability/overrides'),
      ]);
      const dbRules = availRes.data.rules || [];
      if (dbRules.length > 0) {
        const merged = DAYS.map((d) => {
          const found = dbRules.find((r) => r.day_of_week === d.day_of_week);
          if (found) {
            return {
              day_of_week: d.day_of_week,
              start_time: String(found.start_time).slice(0, 5),
              end_time: String(found.end_time).slice(0, 5),
              is_active: found.is_active,
            };
          }
          return {
            day_of_week: d.day_of_week,
            start_time: '09:00',
            end_time: '17:00',
            is_active: false,
          };
        });
        setRules(merged);
      }
      setOverrides(overridesRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateRule = (day, field, value) => {
    setRules((prev) =>
      prev.map((r) => (r.day_of_week === day ? { ...r, [field]: value } : r))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    await api.put('/availability', { rules });
    setSaving(false);
  };

  const handleAddOverride = async (e) => {
    e.preventDefault();
    await api.post('/availability/overrides', {
      ...overrideForm,
      start_time: overrideForm.is_off ? null : overrideForm.start_time,
      end_time: overrideForm.is_off ? null : overrideForm.end_time,
    });
    setShowOverrideForm(false);
    setOverrideForm({ override_date: '', is_off: true, start_time: '09:00', end_time: '17:00', reason: '' });
    load();
  };

  const deleteOverride = async (id) => {
    await api.delete(`/availability/overrides/${id}`);
    load();
  };

  if (loading) {
    return <PageLoader label="Loading availability..." />;
  }

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A1F36]">Availability</h1>
          <p className="text-[#6B7280] mt-1">Set when you are available for meetings</p>
        </div>
        <div className="inline-flex rounded-lg border border-[#E5E7EB] p-0.5 bg-[#FAFAFA]">
          <button
            type="button"
            onClick={() => setView('list')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              view === 'list' ? 'bg-white text-[#1A1F36] shadow-sm' : 'text-[#6B7280] hover:text-[#1A1F36]'
            }`}
          >
            List
          </button>
          <button
            type="button"
            onClick={() => setView('calendar')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              view === 'calendar' ? 'bg-white text-[#1A1F36] shadow-sm' : 'text-[#6B7280] hover:text-[#1A1F36]'
            }`}
          >
            Calendar
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 mb-8">
        <h2 className="font-medium text-[#1A1F36] mb-1">Working hours (default)</h2>
        <p className="text-xs text-[#9CA3AF] mb-4">Active on all event types</p>

        {view === 'list' ? (
          <>
            <h3 className="text-sm font-medium text-[#6B7280] mb-3">Weekly hours</h3>
            {DAYS.map((d) => {
              const rule = rules.find((r) => r.day_of_week === d.day_of_week);
              return (
                <div
                  key={d.day_of_week}
                  className={`flex items-center gap-4 h-12 border-b border-[#F3F4F6] last:border-0 ${
                    !rule?.is_active ? 'opacity-50' : ''
                  }`}
                >
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rule?.is_active}
                      onChange={(e) => updateRule(d.day_of_week, 'is_active', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-[#006BFF] after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                  </label>
                  <span className="w-10 text-sm font-medium">{d.label}</span>
                  <select
                    disabled={!rule?.is_active}
                    value={rule?.start_time}
                    onChange={(e) => updateRule(d.day_of_week, 'start_time', e.target.value)}
                    className="border border-[#E5E7EB] rounded-md px-2 py-1 text-sm disabled:bg-gray-100"
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <span className="text-[#9CA3AF]">—</span>
                  <select
                    disabled={!rule?.is_active}
                    value={rule?.end_time}
                    onChange={(e) => updateRule(d.day_of_week, 'end_time', e.target.value)}
                    className="border border-[#E5E7EB] rounded-md px-2 py-1 text-sm disabled:bg-gray-100"
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              );
            })}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="mt-6 bg-[#006BFF] text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </>
        ) : (
          <AvailabilityCalendar rules={rules} overrides={overrides} />
        )}
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Date Overrides</h2>
        <button
          type="button"
          onClick={() => setShowOverrideForm(true)}
          className="text-[#006BFF] text-sm font-medium hover:underline"
        >
          Add Override
        </button>
      </div>

      {showOverrideForm && (
        <form onSubmit={handleAddOverride} className="bg-white border border-[#E5E7EB] rounded-lg p-4 mb-4 flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs mb-1">Date</label>
            <input
              type="date"
              required
              value={overrideForm.override_date}
              onChange={(e) => setOverrideForm((f) => ({ ...f, override_date: e.target.value }))}
              className="border rounded-md px-2 py-1 text-sm"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={overrideForm.is_off}
              onChange={(e) => setOverrideForm((f) => ({ ...f, is_off: e.target.checked }))}
            />
            Mark as off
          </label>
          {!overrideForm.is_off && (
            <>
              <select
                value={overrideForm.start_time}
                onChange={(e) => setOverrideForm((f) => ({ ...f, start_time: e.target.value }))}
                className="border rounded-md px-2 py-1 text-sm"
              >
                {TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <select
                value={overrideForm.end_time}
                onChange={(e) => setOverrideForm((f) => ({ ...f, end_time: e.target.value }))}
                className="border rounded-md px-2 py-1 text-sm"
              >
                {TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </>
          )}
          <input
            placeholder="Reason"
            value={overrideForm.reason}
            onChange={(e) => setOverrideForm((f) => ({ ...f, reason: e.target.value }))}
            className="border rounded-md px-2 py-1 text-sm flex-1 min-w-[120px]"
          />
          <button type="submit" className="bg-[#006BFF] text-white px-3 py-1 rounded-md text-sm">Add</button>
          <button type="button" onClick={() => setShowOverrideForm(false)} className="text-sm text-gray-500">Cancel</button>
        </form>
      )}

      <div className="space-y-2">
        {overrides.map((o) => (
          <div key={o.id} className="bg-white border border-[#E5E7EB] rounded-lg px-4 py-3 flex items-center justify-between text-sm">
            <div className="flex items-center gap-3">
              <span className="font-medium">{formatOverrideDate(o.override_date)}</span>
              {o.is_off ? (
                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">Off</span>
              ) : (
                <span className="text-[#6B7280]">
                  {String(o.start_time).slice(0, 5)} – {String(o.end_time).slice(0, 5)}
                </span>
              )}
              {o.reason && <span className="text-[#9CA3AF]">{o.reason}</span>}
            </div>
            <button type="button" onClick={() => deleteOverride(o.id)} className="text-[#EF4444] hover:underline text-xs">
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
