import { useEffect, useState } from 'react';
import api from '../api/axios';
import { formatMeetingRange } from '../utils/formatTime';

function formatMeetingTime(booking) {
  return formatMeetingRange(
    booking.start_time,
    booking.end_time,
    booking.host_timezone
  );
}

export default function Meetings() {
  const [tab, setTab] = useState('upcoming');
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await api.get('/meetings', { params: { type: tab } });
    setMeetings(res.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [tab]);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this meeting?')) return;
    await api.patch(`/meetings/${id}/cancel`);
    load();
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[#1A1F36] mb-6">Scheduled Events</h1>
      <div className="flex gap-6 border-b border-[#E5E7EB] mb-6">
        {['upcoming', 'past'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`pb-3 text-sm font-medium capitalize ${
              tab === t
                ? 'text-[#006BFF] border-b-2 border-[#006BFF]'
                : 'text-[#6B7280] hover:text-[#1A1F36]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-[#9CA3AF]">Loading...</p>
      ) : meetings.length === 0 ? (
        <div className="text-center py-16 text-[#9CA3AF]">
          <p className="text-lg">No {tab} meetings</p>
        </div>
      ) : (
        <div className="space-y-3">
          {meetings.map((m) => (
            <div
              key={m.id}
              className={`bg-white border border-[#E5E7EB] rounded-lg px-5 py-4 flex justify-between items-start ${
                tab === 'past' ? 'opacity-80' : ''
              }`}
            >
              <div className="flex gap-3">
                <div
                  className="w-2 h-2 rounded-full mt-2 shrink-0"
                  style={{ backgroundColor: m.event_type_color || '#006BFF' }}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[15px]">{m.invitee_name}</span>
                    <span className="text-xs bg-gray-100 text-[#6B7280] px-2 py-0.5 rounded">
                      {m.event_type_name}
                    </span>
                  </div>
                  <p className="text-sm text-[#1A1F36] mt-1">{formatMeetingTime(m)}</p>
                  <p className="text-sm text-[#9CA3AF] mt-1">{m.invitee_email}</p>
                </div>
              </div>
              {tab === 'upcoming' && (
                <button
                  type="button"
                  onClick={() => handleCancel(m.id)}
                  className="text-[#EF4444] border border-[#EF4444] px-3 py-1 rounded-md text-xs font-medium hover:bg-red-50"
                >
                  Cancel
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
