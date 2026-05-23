import { useEffect, useState } from 'react';
import api from '../api/axios';

const COLORS = ['#006BFF', '#00A86B', '#8B5CF6', '#EF4444', '#F59E0B', '#EC4899'];
const DURATIONS = [15, 30, 45, 60];

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function EventTypeModal({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState({
    name: '',
    slug: '',
    duration_minutes: 30,
    description: '',
    color: '#006BFF',
    schedule_id: '',
  });
  const [slugEdited, setSlugEdited] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSchedulesLoading(true);
    api
      .get('/schedules')
      .then((res) => setSchedules(Array.isArray(res.data) ? res.data : []))
      .finally(() => setSchedulesLoading(false));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const defaultSchedule = schedules.find((s) => s.isDefault);
    if (initial) {
      setForm({
        name: initial.name,
        slug: initial.slug,
        duration_minutes: initial.duration_minutes,
        description: initial.description || '',
        color: initial.color || '#006BFF',
        schedule_id: initial.schedule_id || defaultSchedule?.id || '',
      });
      setSlugEdited(true);
    } else {
      setForm({
        name: '',
        slug: '',
        duration_minutes: 30,
        description: '',
        color: '#006BFF',
        schedule_id: defaultSchedule?.id || '',
      });
      setSlugEdited(false);
    }
  }, [initial, open, schedules]);

  if (!open) return null;

  const handleNameChange = (name) => {
    setForm((f) => ({
      ...f,
      name,
      slug: slugEdited ? f.slug : slugify(name),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white rounded-t-xl sm:rounded-xl w-full max-w-[480px] max-h-[92vh] sm:max-h-[90vh] overflow-y-auto shadow-xl sm:mx-4">
        <div className="flex justify-between items-center px-6 py-4 border-b border-[#E5E7EB]">
          <h2 className="text-lg font-semibold">{initial ? 'Edit Event Type' : 'New Event Type'}</h2>
          <button type="button" onClick={onClose} className="text-[#6B7280] hover:text-[#1A1F36] text-xl">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#006BFF]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Slug</label>
            <input
              required
              value={form.slug}
              onChange={(e) => {
                setSlugEdited(true);
                setForm((f) => ({ ...f, slug: e.target.value }));
              }}
              className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#006BFF]"
            />
            <p className="text-xs text-[#9CA3AF] mt-1">yourapp.com/{form.slug || 'slug'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Availability schedule</label>
            <select
              required
              value={form.schedule_id}
              onChange={(e) => setForm((f) => ({ ...f, schedule_id: e.target.value }))}
              disabled={schedulesLoading || schedules.length === 0}
              className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm disabled:bg-gray-100"
            >
              {schedulesLoading && <option value="">Loading schedules…</option>}
              {!schedulesLoading && schedules.length === 0 && (
                <option value="">No schedules available</option>
              )}
              {schedules.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.isDefault ? ' (default)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Duration</label>
            <select
              value={form.duration_minutes}
              onChange={(e) => setForm((f) => ({ ...f, duration_minutes: Number(e.target.value) }))}
              className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm"
            >
              {DURATIONS.map((d) => (
                <option key={d} value={d}>
                  {d} min
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Color</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, color: c }))}
                  className={`w-8 h-8 rounded-full border-2 ${form.color === c ? 'border-[#1A1F36]' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-[#6B7280] hover:bg-gray-100 rounded-md">
              Cancel
            </button>
            <button type="submit" className="px-5 py-2 text-sm bg-[#006BFF] text-white rounded-full font-medium hover:bg-blue-700">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
