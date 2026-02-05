import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');
        try {
            const response = await api.post('/auth/forgot-password', { email });
            setMessage(response.data.message || 'If the email exists, a password reset link has been sent.');
            setEmail('');
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to send reset email');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "login-container", children: _jsxs("div", { className: "login-box", children: [_jsx("h1", { children: "Contact Mini CRM" }), _jsx("h2", { children: "Forgot Password" }), error && _jsx("div", { className: "error", children: error }), message && _jsx("div", { className: "success", children: message }), _jsxs("form", { onSubmit: handleSubmit, children: [_jsx("input", { type: "email", placeholder: "Email", value: email, onChange: (e) => setEmail(e.target.value), required: true, disabled: loading }), _jsx("button", { type: "submit", disabled: loading, children: loading ? 'Sending...' : 'Send Reset Link' })] }), _jsx(Link, { to: "/login", className: "toggle-btn", children: "Back to Login" })] }) }));
}
