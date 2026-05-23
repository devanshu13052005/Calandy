import { Link, useLocation, useParams } from 'react-router-dom';
import { formatDateAndTime } from '../utils/formatTime';

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

  const tz = booking.host_timezone || eventType?.host_timezone;
  const { combined } = formatDateAndTime(booking.start_time, tz);

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-lg shadow-sm border border-[#E5E7EB] max-w-[480px] w-full p-6 sm:p-8 text-center">
        <div className="w-[60px] h-[60px] rounded-full bg-[#DCFCE7] text-[#00A86B] flex items-center justify-center mx-auto text-2xl font-bold">
          ✓
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold mt-6">You&apos;re scheduled!</h1>
        <p className="text-[#6B7280] mt-2 text-sm">
          A confirmation email has been sent to {booking.invitee_email}
        </p>
        <hr className="my-6 border-[#E5E7EB]" />
        <div className="text-left space-y-3 text-sm">
          <div className="flex items-center gap-3">
            <span className="text-[#9CA3AF]">📅</span>
            <span>
              {combined}
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
          {booking.meet_link && (
            <div className="pt-3 border-t border-[#E5E7EB] mt-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded bg-[#E8F5E9] text-[#00A86B] text-xs font-bold">
                  G
                </span>
                <span className="text-sm font-medium text-[#1A1F36]">Google Meet</span>
              </div>
              <a
                href={booking.meet_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#006BFF] break-all hover:underline block mb-3"
              >
                {booking.meet_link}
              </a>
              <a
                href={booking.meet_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-[#00A86B] text-white text-sm font-medium rounded-md hover:bg-green-700"
              >
                Join Google Meet
              </a>
            </div>
          )}
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
