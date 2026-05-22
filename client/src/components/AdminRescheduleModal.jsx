import { useEffect, useState } from 'react';
import api from '../api/axios';
import CalendarPicker, { formatDateKey } from './CalendarPicker';
import TimeSlotPicker from './TimeSlotPicker';

export default function AdminRescheduleModal({ meeting, open, onClose, onSuccess }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [availableDays, setAvailableDays] = useState([1, 2, 3, 4, 5]);

  useEffect(() => {
    if (!open) return;
    setSelectedDate(null);
    setSelectedTime(null);
    setSlots([]);
    api.get('/availability').then((res) => {
      const days = (res.data.rules || [])
        .filter((r) => r.is_active)
        .map((r) => r.day_of_week);
      if (days.length) setAvailableDays(days);
    });
  }, [open]);

  useEffect(() => {
    if (!selectedDate || !meeting?.event_type_slug || !open) return;
    setLoadingSlots(true);
    setSelectedTime(null);
    api
      .get(`/public/${meeting.event_type_slug}/slots`, {
        params: { date: formatDateKey(selectedDate) },
      })
      .then((res) => setSlots(res.data.slots || []))
      .finally(() => setLoadingSlots(false));
  }, [selectedDate, meeting?.event_type_slug, open]);

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) return;
    setSubmitting(true);
    try {
      await api.patch(`/meetings/${meeting.id}/reschedule`, {
        date: formatDateKey(selectedDate),
        time: selectedTime,
      });
      onSuccess();
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Reschedule failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open || !meeting) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Close" />
      <div className="relative bg-white rounded-xl shadow-xl border border-[#E5E7EB] w-full max-w-[720px] max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-lg font-semibold text-[#1A1F36] mb-1">Reschedule meeting</h2>
        <p className="text-sm text-[#6B7280] mb-4">
          {meeting.invitee_name} · {meeting.event_type_name}
        </p>
        <div className="flex gap-6 flex-col sm:flex-row">
          <div className="flex-1">
            <CalendarPicker
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              availableDays={availableDays}
            />
          </div>
          <div className="w-full sm:w-[200px] shrink-0">
            <TimeSlotPicker
              selectedDate={selectedDate}
              slots={slots}
              selectedTime={selectedTime}
              onSelectTime={setSelectedTime}
              loading={loadingSlots}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-[#6B7280] border border-[#E5E7EB] rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedTime || submitting}
            className="px-4 py-2 text-sm bg-[#006BFF] text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Confirm reschedule'}
          </button>
        </div>
      </div>
    </div>
  );
}
