import { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import PageLoader from '../components/PageLoader';
import { formatDateAndTime } from '../utils/formatTime';

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api
      .get('/contacts')
      .then((res) => setContacts(res.data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(
      (c) =>
        c.invitee_name?.toLowerCase().includes(q) ||
        c.invitee_email?.toLowerCase().includes(q) ||
        c.event_type_name?.toLowerCase().includes(q)
    );
  }, [contacts, search]);

  return (
    <div className="w-full">
      <h1 className="text-xl sm:text-2xl font-semibold text-[#1A1F36]">Contacts</h1>
      <p className="text-[#6B7280] mt-1 mb-6">
        People you have completed meetings with
      </p>

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
          placeholder="Search contacts"
          className="w-full pl-10 pr-4 py-2.5 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006BFF]/30 focus:border-[#006BFF]"
        />
      </div>

      {loading ? (
        <PageLoader label="Loading contacts..." />
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-[#9CA3AF] bg-white border border-[#E5E7EB] rounded-lg">
          <p className="text-lg">No contacts yet</p>
          <p className="text-sm mt-2">Completed meetings will appear here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => {
            const { combined } = formatDateAndTime(c.start_time, c.host_timezone);
            return (
              <div
                key={c.id}
                className="flex items-stretch bg-white border border-[#E5E7EB] rounded-lg overflow-hidden transition-all duration-150 hover:shadow-[0_2px_10px_rgba(0,0,0,0.06)] hover:border-[#D1D5DB]"
              >
                <div className="w-2 shrink-0 bg-[#8B5CF6]" aria-hidden />
                <div className="flex-1 px-5 py-3 grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4 items-center min-w-0">
                  <div>
                    <p className="text-xs text-[#9CA3AF] uppercase tracking-wide">Name</p>
                    <p className="text-sm font-semibold text-[#1A1F36]">{c.invitee_name}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-[#9CA3AF] uppercase tracking-wide">Email</p>
                    <p className="text-sm text-[#1A1F36] truncate">{c.invitee_email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#9CA3AF] uppercase tracking-wide">When</p>
                    <p className="text-sm text-[#1A1F36]">{combined}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#9CA3AF] uppercase tracking-wide">Meeting</p>
                    <p className="text-sm text-[#1A1F36]">
                      {c.event_type_name} · {c.duration_minutes} min
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
