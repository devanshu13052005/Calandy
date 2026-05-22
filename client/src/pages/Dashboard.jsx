import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api/axios';
import EventTypeCard from '../components/EventTypeCard';
import EventTypeModal from '../components/EventTypeModal';
import PageLoader from '../components/PageLoader';
import { buildAvailabilitySummary } from '../utils/availabilitySummary';

const HOST = { name: 'John Doe', initials: 'JD' };

export default function Dashboard() {
  const location = useLocation();
  const [eventTypes, setEventTypes] = useState([]);
  const [availabilityRules, setAvailabilityRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const availabilityText = useMemo(
    () => buildAvailabilitySummary(availabilityRules),
    [availabilityRules]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [typesRes, availRes] = await Promise.all([
        api.get('/event-types'),
        api.get('/availability'),
      ]);
      setEventTypes(typesRes.data);
      setAvailabilityRules(availRes.data.rules || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, location.state?.refresh]);

  const filteredEventTypes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return eventTypes;
    return eventTypes.filter(
      (et) =>
        et.name?.toLowerCase().includes(q) ||
        et.slug?.toLowerCase().includes(q) ||
        et.description?.toLowerCase().includes(q)
    );
  }, [eventTypes, search]);

  const handleSave = async (form) => {
    if (editing) {
      await api.put(`/event-types/${editing.id}`, form);
    } else {
      await api.post('/event-types', form);
    }
    setModalOpen(false);
    setEditing(null);
    load();
  };

  const handleToggle = async (et) => {
    await api.patch(`/event-types/${et.id}/toggle`);
    load();
  };

  const handleDelete = async (et) => {
    try {
      await api.delete(`/event-types/${et.id}`);
      load();
    } catch (err) {
      if (err.response?.status === 409) {
        const deactivate = window.confirm(
          'This event type has bookings. Deactivate instead?'
        );
        if (deactivate && et.is_active) {
          await api.patch(`/event-types/${et.id}/toggle`);
          load();
        }
      }
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-[#1A1F36]">Scheduling</h1>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="bg-[#006BFF] text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-blue-700"
        >
          + Create
        </button>
      </div>

      <div className="border-b border-[#E5E7EB] mb-6">
        <span className="inline-block pb-3 text-sm font-medium text-[#006BFF] border-b-2 border-[#006BFF]">
          Event types
        </span>
      </div>

      <div className="relative mb-6">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search event types"
          className="w-full pl-10 pr-4 py-2.5 border border-[#E5E7EB] rounded-lg text-sm text-[#1A1F36] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#006BFF]/30 focus:border-[#006BFF]"
        />
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#006BFF] text-white flex items-center justify-center text-xs font-semibold">
            {HOST.initials}
          </div>
          <span className="text-sm font-medium text-[#1A1F36]">{HOST.name}</span>
        </div>
        <a
          href={import.meta.env.VITE_APP_URL || window.location.origin}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-[#006BFF] hover:underline inline-flex items-center gap-1"
        >
          View landing page
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      </div>

      {loading ? (
        <PageLoader label="Loading event types..." />
      ) : filteredEventTypes.length === 0 ? (
        <div className="text-center py-16 text-[#9CA3AF] bg-white border border-[#E5E7EB] rounded-lg">
          <p className="text-lg">
            {search.trim() ? 'No event types match your search' : 'No event types yet'}
          </p>
          {!search.trim() && (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="mt-4 text-[#006BFF] text-sm font-medium hover:underline"
            >
              Create your first event type
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredEventTypes.map((et) => (
            <EventTypeCard
              key={et.id}
              eventType={et}
              availabilityText={availabilityText}
              onEdit={(item) => {
                setEditing(item);
                setModalOpen(true);
              }}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <EventTypeModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
        initial={editing}
      />
    </div>
  );
}
