import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../services/api';
export default function EmailVerify() {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('loading');
    const [message, setMessage] = useState('');
    useEffect(() => {
        const token = searchParams.get('token');
        if (!token) {
            setStatus('error');
            setMessage('Missing verification token.');
            return;
        }
        api
            .get(`/auth/verify`, { params: { token } })
            .then((response) => {
            setStatus('success');
            setMessage(response.data.message || 'Email verified. You can log in.');
        })
            .catch((error) => {
            setStatus('error');
            setMessage(error.response?.data?.message || 'Verification failed.');
        });
    }, [searchParams]);
    return (_jsx("div", { className: "login-container", children: _jsxs("div", { className: "login-box", children: [_jsx("h1", { children: "Contact Mini CRM" }), _jsx("h2", { children: "Email Verification" }), status === 'loading' && _jsx("div", { className: "loading", children: "Verifying..." }), status === 'success' && _jsx("div", { className: "success", children: message }), status === 'error' && _jsx("div", { className: "error", children: message }), _jsx(Link, { to: "/login", className: "toggle-btn", children: "Go to Login" })] }) }));
}
