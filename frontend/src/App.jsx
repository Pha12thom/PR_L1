import { Navigate, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ReportsPage from './pages/ReportsPage';
import SocialPage from './pages/SocialPage';
import AdminPage from './pages/AdminPage';
import ContactsPage from './pages/ContactsPage';
import NotificationsPage from './pages/NotificationsPage';
import AdminLogsPage from './pages/AdminLogsPage';
import MessagesPage from './pages/MessagesPage';
import InvitePage from './pages/InvitePage';
import ProfilePage from './pages/ProfilePage';

function App() {
  return (
    <div className="app app-shell">
      <Header />
      <div className="app-content">
        <main className="main">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/social" element={<SocialPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/contacts" element={<ContactsPage />} />
            <Route path="/invite/:token" element={<InvitePage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <MessagesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute role="admin">
                  <AdminPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/logs"
              element={
                <ProtectedRoute role="admin">
                  <AdminLogsPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </div>
  );
}

export default App;
