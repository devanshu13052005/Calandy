import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import { formatDateAndTime } from '../utils/formatTime';
import CalendarPicker, { formatDateKey } from '../components/CalendarPicker';
import TimeSlotPicker from '../components/TimeSlotPicker';

export default function ReschedulePage() {
  const { token } = useParams();
  const [booking, setBooking] = useState(null);
  const [availableDays, setAvailableDays] = useState([1, 2, 3, 4, 5]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .get(`/public/reschedule/${token}`)
      .then((res) => setBooking(res.data))
      .catch((err) => {
        setError(err.response?.data?.error || 'Not found');
      })
      .finally(() => setLoading(false));
    api.get('/availability').then((res) => {
      const days = (res.data.rules || [])
        .filter((r) => r.is_active)
        .map((r) => r.day_of_week);
      if (days.length) setAvailableDays(days);
    });
  }, [token]);

  useEffect(() => {
    if (!selectedDate || !booking?.slug) return;
    setLoadingSlots(true);
    setSelectedTime(null);
    api
      .get(`/public/${booking.slug}/slots`, { params: { date: formatDateKey(selectedDate) } })
      .then((res) => setSlots(res.data.slots || []))
      .finally(() => setLoadingSlots(false));
  }, [selectedDate, booking?.slug]);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      const res = await api.post(`/public/reschedule/${token}`, {
        date: formatDateKey(selectedDate),
        time: selectedTime,
      });
      setSuccess(res.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Reschedule failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 text-[#9CA3AF]">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-4 sm:p-6">
        <div className="bg-white rounded-lg max-w-[480px] w-full p-6 sm:p-8 text-center">
          <div className="w-[60px] h-[60px] rounded-full bg-red-100 text-[#EF4444] flex items-center justify-center mx-auto text-2xl">
            ×
          </div>
          <p className="mt-4 text-[#6B7280]">{error}</p>
        </div>
      </div>
    );
  }

  if (success) {
    const { combined } = formatDateAndTime(success.start_time, success.host_timezone);
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-4 sm:p-6">
        <div className="bg-white rounded-lg max-w-[480px] w-full p-6 sm:p-8 text-center">
          <div className="w-[60px] h-[60px] rounded-full bg-[#DCFCE7] text-[#00A86B] flex items-center justify-center mx-auto text-2xl">
            ✓
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold mt-6">You&apos;re rescheduled!</h1>
          <p className="text-[#6B7280] mt-2 text-sm">New time: {combined}</p>
        </div>
      </div>
    );
  }

  const { combined: oldTime } = formatDateAndTime(booking.start_time, booking.host_timezone);

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <div className="bg-[#006BFF]/10 border-b border-[#006BFF]/20 px-4 sm:px-6 py-3 text-center text-xs sm:text-sm text-[#1A1F36]">
        You are rescheduling: <strong>{booking.event_name}</strong> on {oldTime}
      </div>
      <div className="flex justify-center py-6 sm:py-10 px-3 sm:px-4">
        <div className="flex flex-col md:flex-row max-w-[900px] w-full bg-white rounded-xl sm:rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.08)] border border-[#E5E7EB] overflow-hidden md:min-h-[480px]">
          <div className="w-full md:w-1/2 border-b md:border-b-0 md:border-r border-[#E5E7EB] p-6 sm:p-8 md:p-10">
            <CalendarPicker
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              availableDays={availableDays}
            />
          </div>
          <div className="flex-1 p-6 sm:p-8 md:p-10 min-w-0">
            <TimeSlotPicker
              selectedDate={selectedDate}
              slots={slots}
              selectedTime={selectedTime}
              onSelectTime={setSelectedTime}
              loading={loadingSlots}
            />
            {selectedTime && (
              <button
                type="button"
                onClick={handleConfirm}
                disabled={submitting}
                className="w-full mt-4 h-11 bg-[#006BFF] text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Confirm New Time'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
