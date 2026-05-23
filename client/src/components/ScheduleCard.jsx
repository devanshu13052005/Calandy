import { useState } from 'react';
import { buildScheduleSummary } from '../utils/scheduleSummary';

export default function ScheduleCard({ schedule, onEdit, onDelete, onDuplicate }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const summary = buildScheduleSummary(schedule.weeklyAvailability);

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg px-4 sm:px-5 py-4 flex items-start sm:items-center justify-between gap-3 sm:gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-[15px] font-semibold text-[#1A1F36]">{schedule.name}</h3>
          {schedule.isDefault && (
            <span className="text-xs bg-[#EEF2FF] text-[#006BFF] px-2 py-0.5 rounded-full font-medium">
              Default
            </span>
          )}
        </div>
        <p className="text-sm text-[#6B7280] mt-0.5 truncate">{summary}</p>
        <p className="text-xs text-[#9CA3AF] mt-0.5">{schedule.timezone}</p>
      </div>

      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className="p-2 text-[#6B7280] hover:text-[#1A1F36] rounded-md hover:bg-[#F5F5F5]"
          aria-label="Schedule options"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="5" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="12" cy="19" r="2" />
          </svg>
        </button>
        {menuOpen && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-40"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-[#E5E7EB] rounded-lg shadow-xl py-1 min-w-[160px]">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit(schedule);
                }}
                className="w-full text-left px-4 py-2 text-sm text-[#1A1F36] hover:bg-gray-50"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onDuplicate(schedule);
                }}
                className="w-full text-left px-4 py-2 text-sm text-[#1A1F36] hover:bg-gray-50"
              >
                Duplicate
              </button>
              <button
                type="button"
                disabled={schedule.isDefault}
                onClick={() => {
                  if (schedule.isDefault) return;
                  setMenuOpen(false);
                  onDelete(schedule);
                }}
                className={`w-full text-left px-4 py-2 text-sm ${
                  schedule.isDefault
                    ? 'text-[#9CA3AF] cursor-not-allowed'
                    : 'text-[#EF4444] hover:bg-red-50'
                }`}
              >
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
