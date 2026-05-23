import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import CalendarPicker, { formatDateKey } from '../components/CalendarPicker';
import TimeSlotPicker from '../components/TimeSlotPicker';
import BookingForm from '../components/BookingForm';

function getInitials(name) {
  return name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';
}

export default function BookingPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [eventType, setEventType] = useState(null);
  const [availableDays, setAvailableDays] = useState([1, 2, 3, 4, 5]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get(`/public/${slug}`)
      .then((res) => setEventType(res.data))
      .catch(() => setError('Event not found'));
  }, [slug]);

  useEffect(() => {
    if (eventType?.available_days?.length) {
      setAvailableDays(eventType.available_days);
    }
  }, [eventType]);

  useEffect(() => {
    if (!selectedDate || !slug) return;
    setLoadingSlots(true);
    setSelectedTime(null);
    const dateStr = formatDateKey(selectedDate);
    api
      .get(`/public/${slug}/slots`, { params: { date: dateStr } })
      .then((res) => setSlots(res.data.slots || []))
      .finally(() => setLoadingSlots(false));
  }, [selectedDate, slug]);

  const handleBook = async (form) => {
    setSubmitting(true);
    try {
      const res = await api.post(`/public/${slug}/book`, {
        date: formatDateKey(selectedDate),
        time: selectedTime,
        invitee_name: form.invitee_name,
        invitee_email: form.invitee_email,
        invitee_timezone: form.invitee_timezone,
        notes: form.notes,
        answers: form.answers,
      });
      navigate(`/${slug}/confirmed`, { state: { booking: res.data, eventType } });
    } catch (err) {
      alert(
        err.response?.data?.error ||
          'This slot is already taken, please choose another time'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 text-[#6B7280] text-center">
        {error}
      </div>
    );
  }

  if (!eventType) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 text-[#9CA3AF]">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex justify-center items-start py-6 sm:py-12 px-3 sm:px-4">
      <div className="w-full max-w-[1100px] bg-white rounded-xl sm:rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.08)] border border-[#E5E7EB] overflow-hidden flex flex-col lg:flex-row lg:min-h-[560px]">
        <div className="w-full lg:w-[280px] xl:w-[300px] shrink-0 border-b lg:border-b-0 lg:border-r border-[#E5E7EB] p-6 sm:p-8 lg:p-10">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#006BFF] text-white flex items-center justify-center font-semibold text-base sm:text-lg">
            {getInitials(eventType.host_name)}
          </div>
          <p className="text-sm text-[#6B7280] mt-3">{eventType.host_name}</p>
          <h1 className="text-xl sm:text-2xl xl:text-[26px] font-semibold text-[#1A1F36] mt-4 sm:mt-5 leading-tight">
            {eventType.name}
          </h1>
          <div className="flex items-center gap-2 text-sm text-[#6B7280] mt-3 sm:mt-4">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {eventType.duration_minutes} min
          </div>
          {eventType.description && (
            <p className="text-sm text-[#6B7280] mt-3 sm:mt-4 leading-relaxed">{eventType.description}</p>
          )}
          <div className="flex items-center gap-2 text-sm text-[#6B7280] mt-3 sm:mt-4">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
            </svg>
            <span className="truncate">{eventType.host_timezone || 'Asia/Kolkata'}</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col md:flex-row min-w-0">
          <div className="w-full md:w-1/2 lg:flex-1 md:max-w-none border-b md:border-b-0 md:border-r border-[#E5E7EB] p-6 sm:p-8 lg:p-10">
            <h2 className="text-base sm:text-lg font-semibold text-[#1A1F36] mb-1">Select a Date &amp; Time</h2>
            <CalendarPicker
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              availableDays={availableDays}
            />
          </div>

          <div
            className={`w-full md:w-1/2 lg:w-auto p-6 sm:p-8 min-w-0 ${
              selectedTime ? 'md:flex-1 lg:min-w-[280px]' : 'lg:w-[320px] shrink-0'
            }`}
          >
            {selectedTime ? (
              <BookingForm
                eventType={eventType}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onBack={() => setSelectedTime(null)}
                onSubmit={handleBook}
                submitting={submitting}
              />
            ) : (
              <TimeSlotPicker
                selectedDate={selectedDate}
                slots={slots}
                selectedTime={selectedTime}
                onSelectTime={setSelectedTime}
                loading={loadingSlots}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
