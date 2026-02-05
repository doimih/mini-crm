import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
import { api } from './services/api';
function AppRoutes() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
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
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/verify", element: _jsx(EmailVerify, {}) }), _jsx(Route, { path: "/forgot-password", element: _jsx(ForgotPassword, {}) }), _jsx(Route, { path: "/reset-password", element: _jsx(ResetPassword, {}) }), _jsx(Route, { path: "/login", element: isAuthenticated ? (_jsx(Navigate, { to: "/" })) : (_jsx(Login, { onLogin: handleLogin })) }), _jsx(Route, { path: "/", element: isAuthenticated ? (_jsx(ContactList, { onLogout: handleLogout, user: user })) : (_jsx(Navigate, { to: "/login" })) }), _jsx(Route, { path: "/admin", element: isAuthenticated && user?.role === 'SUPERADMIN' ? (_jsx(UserAdmin, {})) : (_jsx(Navigate, { to: "/" })) }), _jsx(Route, { path: "/me", element: isAuthenticated ? (_jsx(PersonalPanel, {})) : (_jsx(Navigate, { to: "/login" })) }), _jsx(Route, { path: "/audit-logs", element: isAuthenticated && user?.role === 'SUPERADMIN' ? (_jsx(AuditLogViewer, {})) : (_jsx(Navigate, { to: "/" })) })] }));
}
function App() {
    return (_jsx(BrowserRouter, { basename: "/mini-crm", children: _jsx(AppRoutes, {}) }));
}
export default App;
