import { createContext, useContext, useState, useCallback } from 'react';

const AdminCreateContext = createContext(null);

export function AdminCreateProvider({ children }) {
  const [open, setOpen] = useState(false);

  const openCreateEvent = useCallback(() => setOpen(true), []);
  const closeCreateEvent = useCallback(() => setOpen(false), []);

  return (
    <AdminCreateContext.Provider value={{ open, setOpen, openCreateEvent, closeCreateEvent }}>
      {children}
    </AdminCreateContext.Provider>
  );
}

export function useAdminCreate() {
  const ctx = useContext(AdminCreateContext);
  if (!ctx) throw new Error('useAdminCreate must be used within AdminCreateProvider');
  return ctx;
}
