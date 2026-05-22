import { Link, useLocation, useParams } from 'react-router-dom';
import { format } from 'date-fns';

export default function BookingConfirm() {
  const { slug } = useParams();
  const { state } = useLocation();
  const booking = state?.booking;
  const eventType = state?.eventType;

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Link to={`/${slug}`} className="text-[#006BFF]">
          Back to booking
        </Link>
      </div>
    );
  }

  const start = new Date(booking.start_time);

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-6">
      <div className="bg-white rounded-lg shadow-sm border border-[#E5E7EB] max-w-[480px] w-full p-8 text-center">
        <div className="w-[60px] h-[60px] rounded-full bg-[#DCFCE7] text-[#00A86B] flex items-center justify-center mx-auto text-2xl font-bold">
          ✓
        </div>
        <h1 className="text-2xl font-semibold mt-6">You&apos;re scheduled!</h1>
        <p className="text-[#6B7280] mt-2 text-sm">
          A confirmation email has been sent to {booking.invitee_email}
        </p>
        <hr className="my-6 border-[#E5E7EB]" />
        <div className="text-left space-y-3 text-sm">
          <div className="flex items-center gap-3">
            <span className="text-[#9CA3AF]">📅</span>
            <span>
              {format(start, 'EEEE, MMMM d')} at {format(start, 'h:mm a')}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[#9CA3AF]">🕐</span>
            <span>{booking.duration_minutes || eventType?.duration_minutes} minutes</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[#9CA3AF]">👤</span>
            <span>{eventType?.host_name || 'Host'}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[#9CA3AF]">📋</span>
            <span>{booking.event_type_name || eventType?.name}</span>
          </div>
        </div>
        <Link
          to={`/${slug}`}
          className="inline-block mt-8 px-6 py-2 border border-[#E5E7EB] rounded-md text-sm text-[#6B7280] hover:bg-gray-50"
        >
          Done
        </Link>
      </div>
    </div>
  );
}
