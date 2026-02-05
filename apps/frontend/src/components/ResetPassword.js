import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!token) {
            setError('Invalid reset link');
            return;
        }
        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        setLoading(true);
        try {
            await api.post('/auth/reset-password', { token, password });
            alert('Password reset successfully. You can now log in.');
            navigate('/login');
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password');
        }
        finally {
            setLoading(false);
        }
    };
    if (!token) {
        return (_jsx("div", { className: "login-container", children: _jsxs("div", { className: "login-box", children: [_jsx("h1", { children: "Contact Mini CRM" }), _jsx("h2", { children: "Reset Password" }), _jsx("div", { className: "error", children: "Invalid or missing reset token" }), _jsx(Link, { to: "/login", className: "toggle-btn", children: "Back to Login" })] }) }));
    }
    return (_jsx("div", { className: "login-container", children: _jsxs("div", { className: "login-box", children: [_jsx("h1", { children: "Contact Mini CRM" }), _jsx("h2", { children: "Reset Password" }), error && _jsx("div", { className: "error", children: error }), _jsxs("form", { onSubmit: handleSubmit, children: [_jsx("input", { type: "password", placeholder: "New Password (min 8 characters)", value: password, onChange: (e) => setPassword(e.target.value), required: true, disabled: loading, minLength: 8 }), _jsx("input", { type: "password", placeholder: "Confirm New Password", value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value), required: true, disabled: loading }), _jsx("button", { type: "submit", disabled: loading, children: loading ? 'Resetting...' : 'Reset Password' })] }), _jsx(Link, { to: "/login", className: "toggle-btn", children: "Back to Login" })] }) }));
}
