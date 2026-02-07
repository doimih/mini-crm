import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './components/Login';
import ContactList from './components/ContactList';
import UserAdmin from './components/UserAdmin';
import EmailVerify from './components/EmailVerify';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import PersonalPanel from './components/PersonalPanel';
import AuditLogViewer from './components/AuditLogViewer';
import Inbox from './components/Inbox';
import { api } from './services/api';
import i18n, { loadTranslations } from './i18n';

function AppRoutes() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<{
    id: number;
    email: string;
    role: string;
    status: string;
    emailVerified?: boolean;
  } | null>(null);
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    setIsAuthenticated(!!token);
    setUser(storedUser ? JSON.parse(storedUser) : null);
  }, [location.pathname]);

  const handleLogin = () => {
    setIsAuthenticated(true);
    const storedUser = localStorage.getItem('user');
    setUser(storedUser ? JSON.parse(storedUser) : null);
  };

  const handleLogout = () => {
    api.post('/auth/logout').catch(() => {
      // ignore logout errors
    });
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <Routes>
      <Route path="/verify" element={<EmailVerify />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/" />
          ) : (
            <Login onLogin={handleLogin} />
          )
        }
      />
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <ContactList onLogout={handleLogout} user={user} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/admin"
        element={
          isAuthenticated && user?.role === 'SUPERADMIN' ? (
            <UserAdmin />
          ) : (
            <Navigate to="/" />
          )
        }
      />
      <Route
        path="/me"
        element={
          isAuthenticated ? (
            <PersonalPanel />
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/inbox"
        element={
          isAuthenticated ? (
            <Inbox />
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/audit-logs"
        element={
          isAuthenticated && user?.role === 'SUPERADMIN' ? (
            <AuditLogViewer />
          ) : (
            <Navigate to="/" />
          )
        }
      />
    </Routes>
  );
}

function App() {
  useEffect(() => {
    // Load translations on app mount
    const currentLang = localStorage.getItem('language') || 'en';
    loadTranslations(currentLang).then(() => {
      i18n.changeLanguage(currentLang);
    });
  }, []);

  return (
    <BrowserRouter basename="/mini-crm">
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
