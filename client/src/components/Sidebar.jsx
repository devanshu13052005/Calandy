import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Dashboard', icon: 'grid' },
  { to: '/availability', label: 'Availability', icon: 'clock' },
  { to: '/meetings', label: 'Meetings', icon: 'calendar' },
];

function NavIcon({ type }) {
  if (type === 'grid') {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    );
  }
  if (type === 'clock') {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

export default function Sidebar({ host }) {
  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-[#1A1F36] text-white flex flex-col z-10">
      <div className="px-5 py-6 text-lg font-semibold">Schedule</div>
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 h-11 px-4 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-white/10 text-white font-medium'
                  : 'text-white/65 hover:bg-white/8 hover:text-white'
              }`
            }
          >
            <NavIcon type={item.icon} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-5 border-t border-white/10 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#006BFF] flex items-center justify-center text-sm font-semibold">
          {host?.initials || 'JD'}
        </div>
        <div>
          <div className="text-sm font-medium">{host?.name || 'John Doe'}</div>
          <div className="text-xs text-white/50">{host?.email || 'john@example.com'}</div>
        </div>
      </div>
    </aside>
  );
}
