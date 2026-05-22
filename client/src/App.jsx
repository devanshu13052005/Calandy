import { Routes, Route } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import Dashboard from './pages/Dashboard';
import Availability from './pages/Availability';
import Meetings from './pages/Meetings';
import Contacts from './pages/Contacts';
import BookingPage from './pages/BookingPage';
import BookingConfirm from './pages/BookingConfirm';
import CancelPage from './pages/CancelPage';
import ReschedulePage from './pages/ReschedulePage';

export default function App() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/availability" element={<Availability />} />
        <Route path="/meetings" element={<Meetings />} />
        <Route path="/contacts" element={<Contacts />} />
      </Route>
      <Route path="/cancel/:token" element={<CancelPage />} />
      <Route path="/reschedule/:token" element={<ReschedulePage />} />
      <Route path="/:slug/confirmed" element={<BookingConfirm />} />
      <Route path="/:slug" element={<BookingPage />} />
    </Routes>
  );
}
