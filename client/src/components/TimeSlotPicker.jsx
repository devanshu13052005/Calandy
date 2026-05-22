import { format } from 'date-fns';

function formatSlotLabel(slot) {
  const [h, m] = slot.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return format(d, 'HH:mm');
}

export default function TimeSlotPicker({ selectedDate, slots, selectedTime, onSelectTime, loading }) {
  if (!selectedDate) return null;

  return (
    <div className="h-full flex flex-col">
      <p className="text-sm font-medium text-[#1A1F36] mb-3">
        {format(selectedDate, 'EEEE, MMMM d')}
      </p>
      {loading ? (
        <p className="text-sm text-[#9CA3AF]">Loading slots...</p>
      ) : slots.length === 0 ? (
        <p className="text-sm text-[#9CA3AF]">No times available</p>
      ) : (
        <div className="flex flex-col gap-2 max-h-[420px] overflow-y-auto pr-1">
          {slots.map((slot) => (
            <button
              key={slot}
              type="button"
              onClick={() => onSelectTime(slot)}
              className={`w-full py-2.5 px-4 rounded-md border text-sm font-semibold transition-colors ${
                selectedTime === slot
                  ? 'bg-[#006BFF] text-white border-[#006BFF]'
                  : 'bg-white text-[#006BFF] border-[#BFE0FF] hover:bg-[#006BFF] hover:text-white hover:border-[#006BFF]'
              }`}
            >
              {formatSlotLabel(slot)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
