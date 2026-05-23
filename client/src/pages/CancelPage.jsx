import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/axios';
import { formatDateAndTime } from '../utils/formatTime';

export default function CancelPage() {
  const { token } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    api
      .get(`/public/cancel/${token}`)
      .then((res) => setBooking(res.data))
      .catch((err) => {
        if (err.response?.status === 410) {
          setError(err.response.data.error);
        } else {
          setError('Meeting not found');
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await api.patch(`/public/cancel/${token}`);
      setSuccess(true);
    } catch {
      setError('Could not cancel meeting');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#006BFF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-6">
        <div className="bg-white rounded-lg max-w-[480px] w-full p-8 text-center">
          <div className="w-[60px] h-[60px] rounded-full bg-red-100 text-[#EF4444] flex items-center justify-center mx-auto text-2xl">
            ×
          </div>
          <p className="mt-4 text-[#6B7280]">{error}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-6">
        <div className="bg-white rounded-lg max-w-[480px] w-full p-8 text-center">
          <div className="w-[60px] h-[60px] rounded-full bg-[#DCFCE7] text-[#00A86B] flex items-center justify-center mx-auto text-2xl">
            ✓
          </div>
          <h2 className="text-xl font-semibold mt-4">Your event has been cancelled</h2>
        </div>
      </div>
    );
  }

  const { combined } = formatDateAndTime(booking.start_time, booking.host_timezone);

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-6">
      <div className="bg-white rounded-lg max-w-[480px] w-full p-8">
        <h1 className="text-xl font-semibold text-center mb-6">Cancel Event</h1>
        <div className="text-sm space-y-2 mb-6">
          <p>
            <strong>{booking.event_name}</strong>
          </p>
          <p className="text-[#6B7280]">
            {combined}
          </p>
          <p className="text-[#6B7280]">with {booking.host_name}</p>
        </div>
        <p className="text-sm text-[#6B7280] mb-6 text-center">
          Are you sure you want to cancel this event?
        </p>
        <div className="flex flex-col-reverse sm:flex-row gap-3">
          <Link
            to="/"
            className="flex-1 text-center py-2.5 border border-[#E5E7EB] rounded-md text-sm text-[#6B7280] hover:bg-gray-50"
          >
            Keep Event
          </Link>
          <button
            type="button"
            onClick={handleCancel}
            disabled={cancelling}
            className="flex-1 py-2.5 bg-[#EF4444] text-white rounded-md text-sm font-medium hover:bg-red-600 disabled:opacity-50"
          >
            Cancel Event
          </button>
        </div>
      </div>
    </div>
  );
}
