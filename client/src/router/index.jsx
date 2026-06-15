import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginPage from '../pages/auth/LoginPage';
import ReceptionistLayout from '../pages/receptionist/ReceptionistLayout';
import ReceptionistDashboard from '../pages/receptionist/ReceptionistDashboard';
import ReceptionistAppointments from '../pages/receptionist/ReceptionistAppointments';
import ReceptionistNewAppointment from '../pages/receptionist/ReceptionistNewAppointment';
import ReceptionistPatients from '../pages/receptionist/ReceptionistPatients';
import ReceptionistPatientProfile from '../pages/receptionist/ReceptionistPatientProfile';
import ReceptionistRegisterPatient from '../pages/receptionist/ReceptionistRegisterPatient';
import ReceptionistPendingRegistrations from '../pages/receptionist/ReceptionistPendingRegistrations';
import ReceptionistCheckout from '../pages/receptionist/ReceptionistCheckout';
import ReceptionistMySchedule from '../pages/receptionist/ReceptionistMySchedule';
import ReceptionistTestResults from '../pages/receptionist/ReceptionistTestResults';
import ReceptionistPrintQueue from '../pages/receptionist/ReceptionistPrintQueue';
import DoctorLayout from '../pages/doctor/DoctorLayout';
import NurseLayout from '../pages/nurse/NurseLayout';
import AdminLayout from '../pages/admin/AdminLayout';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminPatients from '../pages/admin/AdminPatients';
import AdminStaff from '../pages/admin/AdminStaff';
import AdminSettings from '../pages/admin/AdminSettings';
import AdminAuditLog from '../pages/admin/AdminAuditLog';

function ProtectedRoute({ children, roles }) {
  const { user, token, loading } = useAuth();

  // During the brief mount window before useEffect restores state from
  // localStorage, fall back to reading directly so we don't flash a redirect.
  const effectiveToken = token || localStorage.getItem('accessToken');
  const effectiveUser = user || (() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  })();

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: '#F7F9FC',
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          border: '4px solid #E2E8F0', borderTopColor: '#1B4F72',
          animation: 'spin 0.8s linear infinite',
        }} />
      </div>
    );
  }

  if (!effectiveToken) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(effectiveUser?.role)) return <Navigate to="/login" replace />;

  return children;
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Receptionist portal — nested routes */}
      <Route
        path="/receptionist"
        element={
          <ProtectedRoute roles={['receptionist', 'admin']}>
            <ReceptionistLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ReceptionistDashboard />} />
        <Route path="appointments"          element={<ReceptionistAppointments />} />
        <Route path="appointments/new"      element={<ReceptionistNewAppointment />} />
        <Route path="patients"              element={<ReceptionistPatients />} />
        <Route path="patients/register"     element={<ReceptionistRegisterPatient />} />
        <Route path="patients/:id"          element={<ReceptionistPatientProfile />} />
        <Route path="checkout"              element={<ReceptionistCheckout />} />
        <Route path="pending-registrations" element={<ReceptionistPendingRegistrations />} />
        <Route path="my-schedule"           element={<ReceptionistMySchedule />} />
        <Route path="test-results"          element={<ReceptionistTestResults />} />
        <Route path="print-queue"           element={<ReceptionistPrintQueue />} />
      </Route>

      <Route
        path="/doctor/*"
        element={
          <ProtectedRoute roles={['doctor']}>
            <DoctorLayout />
          </ProtectedRoute>
        }
      />
      <Route
        path="/nurse/*"
        element={
          <ProtectedRoute roles={['nurse']}>
            <NurseLayout />
          </ProtectedRoute>
        }
      />

      {/*
        Nested admin routes — AdminLayout renders once (sidebar + shell),
        <Outlet /> inside it swaps between child pages.
        The index route means /admin alone renders AdminDashboard.
      */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="patients"  element={<AdminPatients />} />
        <Route path="staff"     element={<AdminStaff />} />
        <Route path="settings"  element={<AdminSettings />} />
        <Route path="audit-log" element={<AdminAuditLog />} />
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
