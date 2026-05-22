import { useCallback, useEffect, useState } from 'react';
import api from '../api/axios';
import EventTypeCard from '../components/EventTypeCard';
import EventTypeModal from '../components/EventTypeModal';

export default function Dashboard() {
  const [eventTypes, setEventTypes] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    const res = await api.get('/event-types');
    setEventTypes(res.data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold text-[#1A1F36]">Event Types</h1>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="bg-[#006BFF] text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-blue-700"
        >
          New Event Type
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {eventTypes.map((et) => (
          <EventTypeCard
            key={et.id}
            eventType={et}
            onEdit={(item) => {
              setEditing(item);
              setModalOpen(true);
            }}
            onToggle={handleToggle}
            onDelete={handleDelete}
          />
        ))}
      </div>
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
