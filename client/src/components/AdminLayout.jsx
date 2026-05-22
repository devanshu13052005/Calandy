import { useState } from 'react';
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
  const handleSave = async (form) => {
    await api.post('/event-types', form);
    closeCreateEvent();
    navigate('/', { state: { refresh: Date.now() } });
  };

  return (
    <div className="min-h-screen bg-white">
      <Sidebar host={host} />
      <main className="ml-72 pt-10 px-10 pb-10 min-h-screen w-[calc(100%-18rem)] bg-white">
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
