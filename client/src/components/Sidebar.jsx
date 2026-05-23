import { NavLink } from 'react-router-dom';
import { useAdminCreate } from '../context/AdminCreateContext';

const navItems = [
  { to: '/', label: 'Scheduling', icon: 'link' },
  { to: '/meetings', label: 'Meetings', icon: 'calendar' },
  { to: '/availability', label: 'Availability', icon: 'clock' },
  { to: '/contacts', label: 'Contacts', icon: 'contacts' },
];

function NavIcon({ type }) {
  if (type === 'link') {
    return (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
        />
      </svg>
    );
  }
  if (type === 'clock') {
    return (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  if (type === 'contacts') {
    return (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    );
  }
  return (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

export default function Sidebar({ host, open = false, onClose }) {
  const { openCreateEvent } = useAdminCreate();

  const handleCreate = () => {
    openCreateEvent();
    onClose?.();
  };

  const handleNav = () => {
    onClose?.();
  };

  return (
    <aside
      className={`fixed left-0 top-0 z-40 flex h-screen w-72 max-w-[85vw] flex-col border-r border-[#E5E7EB] bg-[#FAFAFA] text-[#1A1F36] transition-transform duration-200 ease-out lg:translate-x-0 ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex items-center justify-between gap-2.5 px-5 pt-6 pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-[#006BFF] flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm leading-none">C</span>
          </div>
          <span className="text-[#006BFF] font-bold text-[17px] tracking-tight truncate">
            Calandy Clone
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="lg:hidden p-2 -mr-2 text-[#6B7280] hover:text-[#1A1F36] rounded-md hover:bg-[#F0F0F0]"
          aria-label="Close menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="px-4 pb-4">
        <button
          type="button"
          onClick={handleCreate}
          className="w-full flex items-center justify-center gap-2 h-10 rounded-full border border-[#E5E7EB] bg-white text-sm font-medium text-[#1A1F36] hover:bg-[#F5F5F5] transition-colors shadow-sm"
        >
          <span className="text-lg leading-none">+</span>
          Create
        </button>
      </div>

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={handleNav}
            className={({ isActive }) =>
              `flex items-center gap-3 h-10 px-3 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-[#E8F4FD] text-[#006BFF] font-medium'
                  : 'text-[#4B5563] hover:bg-[#F0F0F0] hover:text-[#1A1F36]'
              }`
            }
          >
            <NavIcon type={item.icon} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-[#E5E7EB] flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-full bg-[#006BFF] flex items-center justify-center text-sm font-semibold text-white shrink-0">
          {host?.initials || 'JD'}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium text-[#1A1F36] truncate">{host?.name || 'John Doe'}</div>
          <div className="text-xs text-[#6B7280] truncate">{host?.email || 'john@example.com'}</div>
        </div>
      </div>
    </aside>
  );
}
