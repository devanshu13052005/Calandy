import { useEffect, useState } from 'react';
import api from '../api/axios';
import PageLoader from '../components/PageLoader';
import AdminRescheduleModal from '../components/AdminRescheduleModal';
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
  const [rescheduleTarget, setRescheduleTarget] = useState(null);

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
    <div className="w-full">
      <h1 className="text-xl sm:text-2xl font-semibold text-[#1A1F36] mb-6">Meetings</h1>
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
        <PageLoader label="Loading meetings..." />
      ) : meetings.length === 0 ? (
        <div className="text-center py-16 text-[#9CA3AF]">
          <p className="text-lg">No {tab} meetings</p>
        </div>
      ) : (
        <div className="space-y-2">
          {meetings.map((m) => (
            <div
              key={m.id}
              className={`group flex items-stretch bg-white border border-[#E5E7EB] rounded-lg overflow-hidden transition-all duration-150 hover:shadow-[0_2px_10px_rgba(0,0,0,0.06)] hover:border-[#D1D5DB] ${
                tab === 'past' ? 'opacity-80' : ''
              }`}
            >
              <div
                className="w-2 shrink-0"
                style={{ backgroundColor: m.event_type_color || '#006BFF' }}
                aria-hidden
              />
              <div className="flex-1 flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center sm:gap-4 px-4 sm:px-5 py-3 min-w-0">
                <div className="min-w-0 leading-snug">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[15px] text-[#1A1F36]">{m.invitee_name}</span>
                    <span className="text-xs bg-[#F3F4F6] text-[#6B7280] px-2 py-0.5 rounded">
                      {m.event_type_name}
                    </span>
                  </div>
                  <p className="text-[13px] text-[#1A1F36]">{formatMeetingTime(m)}</p>
                  <p className="text-[13px] text-[#9CA3AF]">{m.invitee_email}</p>
                </div>
                {tab === 'upcoming' && (
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setRescheduleTarget(m)}
                      className="text-[#006BFF] border border-[#006BFF] px-3 py-1.5 rounded-md text-xs font-medium hover:bg-[#006BFF]/5 transition-colors"
                    >
                      Reschedule
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCancel(m.id)}
                      className="text-[#EF4444] border border-[#EF4444] px-3 py-1.5 rounded-md text-xs font-medium hover:bg-red-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <AdminRescheduleModal
        meeting={rescheduleTarget}
        open={!!rescheduleTarget}
        onClose={() => setRescheduleTarget(null)}
        onSuccess={load}
      />
    </div>
  );
}
