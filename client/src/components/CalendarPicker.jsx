import Calendar from 'react-calendar';
import { format, startOfDay, isBefore } from 'date-fns';
import 'react-calendar/dist/Calendar.css';

export default function CalendarPicker({ selectedDate, onSelectDate, availableDays }) {
  const today = startOfDay(new Date());

  const tileDisabled = ({ date, view }) => {
    if (view !== 'month') return false;
    if (isBefore(startOfDay(date), today)) return true;
    const day = date.getDay();
    return !availableDays.includes(day);
  };

  return (
    <div>
      <h3 className="text-base font-medium mb-4">Select a Date</h3>
      <Calendar
        value={selectedDate}
        onChange={onSelectDate}
        tileDisabled={tileDisabled}
        minDate={today}
      />
    </div>
  );
}

export function formatDateKey(date) {
  return format(date, 'yyyy-MM-dd');
}
