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
    <div className="h-full flex flex-col min-w-0">
      <p className="text-sm font-medium text-[#1A1F36] mb-3">
        {format(selectedDate, 'EEEE, MMMM d')}
      </p>
      {loading ? (
        <p className="text-sm text-[#9CA3AF]">Loading slots...</p>
      ) : slots.length === 0 ? (
        <p className="text-sm text-[#9CA3AF]">No times available</p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2 sm:gap-2.5 max-h-[min(420px,50vh)] overflow-y-auto pr-1">
          {slots.map((slot) => (
            <button
              key={slot}
              type="button"
              onClick={() => onSelectTime(slot)}
              className={`min-w-0 px-3 sm:px-5 py-2.5 rounded-lg border text-sm font-semibold text-center transition-all ${
                selectedTime === slot
                  ? 'border-2 border-[#006BFF] bg-[#006BFF] text-white shadow-[0_2px_8px_rgba(0,107,255,0.25)]'
                  : 'border-[#BFE0FF] bg-white text-[#006BFF] hover:bg-[#006BFF] hover:text-white hover:border-[#006BFF]'
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
