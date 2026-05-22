import { format } from 'date-fns';

export default function TimeSlotPicker({ selectedDate, slots, selectedTime, onSelectTime, loading }) {
  if (!selectedDate) return null;

  return (
    <div>
      <h3 className="text-base font-medium">Select a Time</h3>
      <p className="text-sm text-[#6B7280] mt-1 mb-4">{format(selectedDate, 'EEEE, MMMM d')}</p>
      {loading ? (
        <p className="text-sm text-[#9CA3AF]">Loading slots...</p>
      ) : slots.length === 0 ? (
        <p className="text-sm text-[#9CA3AF]">No times available</p>
      ) : (
        <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto">
          {slots.map((slot) => (
            <button
              key={slot}
              type="button"
              onClick={() => onSelectTime(slot)}
              className={`w-full h-11 rounded-md border text-sm font-medium transition-colors ${
                selectedTime === slot
                  ? 'bg-[#006BFF] text-white border-[#006BFF]'
                  : 'bg-white text-[#006BFF] border-[#006BFF] hover:bg-[#006BFF] hover:text-white'
              }`}
            >
              {slot}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
