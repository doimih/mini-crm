import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../services/api';

export default function EmailVerify() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
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

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Mini CRM</h1>
        <h2>Email Verification</h2>
        {status === 'loading' && <div className="loading">Verifying...</div>}
        {status === 'success' && <div className="success">{message}</div>}
        {status === 'error' && <div className="error">{message}</div>}
        <Link to="/login" className="toggle-btn">
          Go to Login
        </Link>
      </div>
    </div>
  );
}
