import { useState } from 'react';

const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin;
const DUMMY_MEET_LINK = 'https://meet.google.com/xyz-abcd-efg';

function AccordionRow({ title, icon, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-[#E5E7EB]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 py-4 text-left hover:bg-[#FAFAFA] px-1 -mx-1 rounded"
      >
        <div className="flex items-center gap-3 min-w-0">
          {icon}
          <span className="text-sm font-medium text-[#1A1F36]">{title}</span>
        </div>
        <svg
          className={`w-4 h-4 text-[#9CA3AF] shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="pb-4 pl-9 pr-1 text-sm text-[#6B7280]">{children}</div>}
    </div>
  );
}

function ClockIcon() {
  return (
    <svg className="w-5 h-5 text-[#6B7280] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function LocationIcon({ warning }) {
  if (warning) {
    return (
      <svg className="w-5 h-5 text-[#F59E0B] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  return (
    <svg className="w-5 h-5 text-[#6B7280] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

export default function EventDetailPanel({
  event,
  availabilityText,
  host,
  onClose,
  onEdit,
  onMoreOptions,
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  if (!event) return null;

  const accent = event.color || '#006BFF';
  const publicLink = `${APP_URL}/${event.slug}`;
  const meetLocation = event.location || DUMMY_MEET_LINK;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 bg-black/20 z-[499]"
        aria-label="Close panel overlay"
        onClick={onClose}
      />
      <aside
        className="fixed top-0 right-0 h-screen w-full max-w-[420px] bg-white shadow-[-4px_0_20px_rgba(0,0,0,0.1)] z-[500] flex flex-col translate-x-0 transition-transform duration-300 ease-out"
        style={{ animation: 'slideInPanel 0.3s ease-out' }}
      >
        <div className="flex-1 overflow-y-auto px-6 pt-5 pb-28">
          <div className="flex items-start justify-between gap-3 mb-6">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-[#9CA3AF] mb-2">Event type</p>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: accent }}
                  aria-hidden
                />
                <h2 className="text-xl font-semibold text-[#1A1F36] truncate">{event.name}</h2>
              </div>
              <p className="text-sm text-[#6B7280]">One-on-One</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((o) => !o)}
                  className="p-2 text-[#6B7280] hover:bg-[#F5F5F5] rounded-md"
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
                      className="fixed inset-0 z-10"
                      aria-label="Close menu"
                      onClick={() => setMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-[#E5E7EB] rounded-lg shadow-lg py-1 min-w-[140px]">
                      <button
                        type="button"
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                        onClick={() => {
                          setMenuOpen(false);
                          onMoreOptions?.(event);
                        }}
                      >
                        Edit event
                      </button>
                    </div>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-[#6B7280] hover:text-[#1A1F36] text-xl leading-none rounded-md hover:bg-[#F5F5F5]"
                aria-label="Close"
              >
                ×
              </button>
            </div>
          </div>

          <AccordionRow
            title="Duration"
            icon={<ClockIcon />}
            defaultOpen
          >
            {event.duration_minutes} min
          </AccordionRow>

          <AccordionRow
            title="Location"
            icon={<LocationIcon warning={false} />}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-[#E8F5E9] text-[#00A86B] text-[10px] font-bold shrink-0">
                G
              </span>
              <div className="min-w-0">
                <p className="text-[#1A1F36] font-medium">Google Meet</p>
                <a
                  href={meetLocation}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#006BFF] text-xs hover:underline break-all"
                >
                  {meetLocation.replace('https://', '')}
                </a>
              </div>
            </div>
          </AccordionRow>

          <AccordionRow
            title="Availability"
            icon={
              <svg className="w-5 h-5 text-[#6B7280] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          >
            {availabilityText || 'No availability set'}
          </AccordionRow>

          <AccordionRow
            title="Host"
            icon={
              <div className="w-5 h-5 rounded-full bg-[#006BFF] text-white text-[10px] font-semibold flex items-center justify-center shrink-0">
                {host?.initials || 'JD'}
              </div>
            }
          >
            <span className="text-[#1A1F36]">{host?.name || 'John Doe'} (you)</span>
          </AccordionRow>
        </div>

        <div className="absolute bottom-0 left-0 right-0 border-t border-[#E5E7EB] bg-white px-4 py-4 flex flex-wrap gap-2">
          <a
            href={publicLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 min-w-[80px] text-center px-3 py-2.5 text-sm font-medium border border-[#E5E7EB] rounded-md text-[#1A1F36] hover:bg-[#FAFAFA]"
          >
            Preview
          </a>
          <button
            type="button"
            onClick={() => onMoreOptions?.(event)}
            className="flex-1 min-w-[80px] px-3 py-2.5 text-sm font-medium border border-[#E5E7EB] rounded-md text-[#1A1F36] hover:bg-[#FAFAFA]"
          >
            More options
          </button>
          <button
            type="button"
            onClick={() => onEdit?.(event)}
            className="flex-1 min-w-[100px] px-3 py-2.5 text-sm font-medium bg-[#006BFF] text-white rounded-md hover:bg-blue-700"
          >
            Save changes
          </button>
        </div>
      </aside>
    </>
  );
}
