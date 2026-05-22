import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const host = {
  name: 'John Doe',
  email: 'john@example.com',
  initials: 'JD',
};

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <Sidebar host={host} />
      <main className="ml-60 p-8 min-h-screen">{<Outlet />}</main>
    </div>
  );
}
