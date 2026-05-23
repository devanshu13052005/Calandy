import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import EventTypeModal from './EventTypeModal';
import { AdminCreateProvider, useAdminCreate } from '../context/AdminCreateContext';
import api from '../api/axios';

const host = {
  name: 'John Doe',
  email: 'john@example.com',
  initials: 'JD',
};

function AdminLayoutInner() {
  const navigate = useNavigate();
  const { open, closeCreateEvent } = useAdminCreate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  const handleSave = async (form) => {
    await api.post('/event-types', form);
    closeCreateEvent();
    navigate('/', { state: { refresh: Date.now() } });
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 flex h-14 items-center gap-3 border-b border-[#E5E7EB] bg-white px-4">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="p-2 -ml-2 text-[#1A1F36] rounded-md hover:bg-[#F5F5F5]"
          aria-label="Open menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="text-[#006BFF] font-bold text-base tracking-tight truncate">
          Calandy Clone
        </span>
      </header>

      {sidebarOpen && (
        <button
          type="button"
          className="lg:hidden fixed inset-0 z-30 bg-black/40"
          aria-label="Close menu overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar host={host} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="min-h-screen w-full bg-white pt-14 px-4 pb-8 sm:px-6 lg:ml-72 lg:w-[calc(100%-18rem)] lg:pt-10 lg:px-10 lg:pb-10">
        <Outlet />
      </main>

      <EventTypeModal open={open} onClose={closeCreateEvent} onSave={handleSave} initial={null} />
    </div>
  );
}

export default function AdminLayout() {
  return (
    <AdminCreateProvider>
      <AdminLayoutInner />
    </AdminCreateProvider>
  );
}
