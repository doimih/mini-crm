import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
export default function Login({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegister, setIsRegister] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            const endpoint = isRegister ? '/auth/register' : '/auth/login';
            const response = await api.post(endpoint, { email, password });
            if (isRegister) {
                setSuccess(response.data.message ||
                    'Verification email sent. Please check your inbox.');
                setIsRegister(false);
                setPassword('');
                return;
            }
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            onLogin();
        }
        catch (err) {
            setError(err.response?.data?.message || 'Authentication failed');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "login-container", children: _jsxs("div", { className: "login-box", children: [_jsx("h1", { children: "Contact Mini CRM" }), _jsx("h2", { children: isRegister ? 'Register' : 'Login' }), error && _jsx("div", { className: "error", children: error }), success && _jsx("div", { className: "success", children: success }), _jsxs("form", { onSubmit: handleSubmit, children: [_jsx("input", { type: "email", placeholder: "Email", value: email, onChange: (e) => setEmail(e.target.value), required: true }), _jsx("input", { type: "password", placeholder: "Password", value: password, onChange: (e) => setPassword(e.target.value), required: true, minLength: 6 }), _jsx("button", { type: "submit", disabled: loading, children: loading ? 'Loading...' : isRegister ? 'Register' : 'Login' })] }), !isRegister && (_jsx(Link, { to: "/forgot-password", style: {
                        display: 'block',
                        marginTop: '10px',
                        textAlign: 'center',
                        color: '#007bff',
                        textDecoration: 'none',
                        fontSize: '14px',
                        transition: 'color 0.2s'
                    }, onMouseEnter: (e) => e.currentTarget.style.textDecoration = 'underline', onMouseLeave: (e) => e.currentTarget.style.textDecoration = 'none', children: "Forgot Password?" })), _jsx("button", { className: "toggle-btn", onClick: () => setIsRegister(!isRegister), children: isRegister
                        ? 'Already have an account? Login'
                        : "Don't have an account? Register" })] }) }));
}
