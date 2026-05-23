import { useState } from 'react';

const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin;

export default function EventTypeCard({
  eventType,
  availabilityText,
  onSelect,
  onEdit,
  onToggle,
  onDelete,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const publicLink = `${APP_URL}/${eventType.slug}`;
  const accent = eventType.color || '#8B5CF6';

  const copyLink = async () => {
    await navigator.clipboard.writeText(publicLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const durationLabel = `${eventType.duration_minutes} min`;
  const metaLine = `${durationLabel} · Web conferencing · One-on-One`;

  const handleCardClick = (e) => {
    if (e.target.closest('button, a, input')) return;
    onSelect?.(eventType);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.(eventType);
        }
      }}
      className={`group relative bg-white border border-[#E5E7EB] rounded-lg flex flex-col sm:flex-row sm:items-stretch transition-all duration-150 hover:shadow-[0_2px_10px_rgba(0,0,0,0.06)] hover:border-[#D1D5DB] cursor-pointer ${
        !eventType.is_active ? 'opacity-60' : ''
      }`}
    >
      <div className="w-full h-1 sm:w-2 sm:h-auto shrink-0 rounded-t-lg sm:rounded-t-none sm:rounded-l-lg" style={{ backgroundColor: accent }} aria-hidden />

      <div className="flex-1 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 px-4 py-3 sm:px-5 min-w-0">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <input
            type="checkbox"
            className="w-4 h-4 mt-0.5 rounded border-[#D1D5DB] text-[#006BFF] shrink-0"
            aria-label={`Select ${eventType.name}`}
            readOnly
          />
          <div className="min-w-0 leading-snug">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-[15px] font-semibold text-[#1A1F36]">{eventType.name}</h3>
              {!eventType.is_active && (
                <span className="text-xs bg-gray-100 text-[#6B7280] px-2 py-0.5 rounded">
                  Inactive
                </span>
              )}
            </div>
            <p className="text-[13px] text-[#6B7280]">{metaLine}</p>
            <p className="text-[13px] text-[#6B7280] break-words">{availabilityText}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 pl-7 sm:pl-0 border-t sm:border-t-0 border-[#F3F4F6] pt-3 sm:pt-0">
          <button
            type="button"
            onClick={copyLink}
            className="inline-flex flex-1 sm:flex-initial items-center justify-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full border border-[#006BFF] text-[#006BFF] text-sm font-medium hover:bg-[#006BFF]/5 transition-colors"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
            <span className="truncate">{copied ? 'Copied!' : 'Copy link'}</span>
          </button>

          <a
            href={publicLink}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-[#6B7280] hover:text-[#006BFF] rounded-md hover:bg-[#F5F5F5] transition-colors shrink-0"
            title="Open booking page"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>

          <div className="relative z-30 shrink-0">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="p-2 text-[#6B7280] hover:text-[#1A1F36] rounded-md hover:bg-[#F5F5F5] transition-colors"
              aria-label="More options"
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
                <div className="absolute right-0 bottom-full sm:bottom-auto sm:top-full mb-1 sm:mb-0 sm:mt-1 z-50 bg-white border border-[#E5E7EB] rounded-lg shadow-xl py-1 min-w-[160px]">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(eventType);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-[#1A1F36] hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onToggle(eventType);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-[#1A1F36] hover:bg-gray-50"
                  >
                    {eventType.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(eventType);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-[#EF4444] hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
