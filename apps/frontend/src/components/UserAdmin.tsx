import { useEffect, useState, FormEvent } from 'react';
import { api } from '../services/api';
import TagManager from './TagManager';

interface User {
  id: number;
  email: string;
  role: 'USER' | 'ADMIN' | 'SUPERADMIN';
  status: 'ACTIVE' | 'SUSPENDED';
  emailVerifiedAt?: string | null;
  lastLoginAt?: string | null;
  lastLogoutAt?: string | null;
  createdAt: string;
}

export default function UserAdmin() {
  const [users, setUsers] = useState<User[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<User['role']>('USER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tags, setTags] = useState<{ id: number; name: string }[]>([]);
  const [roleUpdates, setRoleUpdates] = useState<Record<number, User['role']>>({});
  const [emailConfig, setEmailConfig] = useState({
    host: '',
    port: 587,
    secure: false,
    username: '',
    password: '',
    from: '',
    hasPassword: false,
  });
  const [emailConfigSaving, setEmailConfigSaving] = useState(false);
  const [emailConfigMessage, setEmailConfigMessage] = useState('');
  const [emailConfigTesting, setEmailConfigTesting] = useState(false);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load users');
    }
  };

  const fetchTags = async () => {
    try {
      const response = await api.get('/tags');
      setTags(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load tags');
    }
  };

  const fetchEmailConfig = async () => {
    try {
      const response = await api.get('/email-config');
      setEmailConfig((prev) => ({
        ...prev,
        host: response.data.host || '',
        port: response.data.port || 587,
        secure: Boolean(response.data.secure),
        username: response.data.username || '',
        from: response.data.from || '',
        hasPassword: Boolean(response.data.hasPassword),
        password: '',
      }));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load email config');
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchTags();
    fetchEmailConfig();
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/users', { email, password, role });
      setEmail('');
      setPassword('');
      setRole('USER');
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (user: User) => {
    const newStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await api.patch(`/users/${user.id}/status`, { status: newStatus });
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const confirmAccount = async (user: User) => {
    try {
      await api.patch(`/users/${user.id}/verification`, { verified: true });
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const currentUser = JSON.parse(storedUser) as {
          id: number;
          emailVerified?: boolean;
        };
        if (currentUser.id === user.id) {
          currentUser.emailVerified = true;
          localStorage.setItem('user', JSON.stringify(currentUser));
        }
      }
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update verification');
    }
  };

  const handleRoleChange = (userId: number, newRole: User['role']) => {
    setRoleUpdates((prev) => ({ ...prev, [userId]: newRole }));
  };

  const saveRoleChange = async (userId: number) => {
    const newRole = roleUpdates[userId];
    if (!newRole) return;

    try {
      await api.put(`/users/${userId}`, { role: newRole });
      setRoleUpdates((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleSaveEmailConfig = async (e: FormEvent) => {
    e.preventDefault();
    setEmailConfigMessage('');
    setEmailConfigSaving(true);

    try {
      const payload = {
        host: emailConfig.host.trim(),
        port: Number(emailConfig.port),
        secure: emailConfig.secure,
        username: emailConfig.username.trim() || '',
        password: emailConfig.password,
        from: emailConfig.from.trim() || '',
      };

      const response = await api.put('/email-config', payload);
      setEmailConfig((prev) => ({
        ...prev,
        host: response.data.host || '',
        port: response.data.port || 587,
        secure: Boolean(response.data.secure),
        username: response.data.username || '',
        from: response.data.from || '',
        hasPassword: Boolean(response.data.hasPassword),
        password: '',
      }));
      setEmailConfigMessage('Email config saved.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save email config');
    } finally {
      setEmailConfigSaving(false);
    }
  };

  const handleTestEmailConfig = async () => {
    setEmailConfigMessage('');
    setError('');
    setEmailConfigTesting(true);

    try {
      const payload = {
        host: emailConfig.host.trim(),
        port: Number(emailConfig.port),
        secure: emailConfig.secure,
        username: emailConfig.username.trim() || '',
        password: emailConfig.password || undefined,
      };

      const response = await api.post('/email-config/test', payload);
      setEmailConfigMessage(response.data.message || 'Connection successful');
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Connection failed. Check your settings.'
      );
    } finally {
      setEmailConfigTesting(false);
    }
  };

  return (
    <div className="container">
      <header>
        <h1>User Admin</h1>
        <a href="/mini-crm/" className="btn-secondary">
          Back to Contacts
        </a>
      </header>

      {error && <div className="error">{error}</div>}

      <div className="admin-top">
        <div className="tag-manager">
          <h3>Create User</h3>
          <form onSubmit={handleCreate} className="admin-form">
            <div className="form-row">
              <label>
                Email
                <input
                  type="email"
                  placeholder="email@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </label>
              <label>
                Role
                <select value={role} onChange={(e) => setRole(e.target.value as User['role'])}>
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="SUPERADMIN">SUPERADMIN</option>
                </select>
              </label>
            </div>
            <div className="form-actions">
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Saving...' : 'Add User'}
              </button>
            </div>
          </form>
        </div>

        <div className="tag-manager">
          <h3>Email configuration</h3>
          {emailConfigMessage && <div className="success">{emailConfigMessage}</div>}
          <form onSubmit={handleSaveEmailConfig} className="admin-form">
            <div className="form-row">
              <label>
                Server
                <input
                  type="text"
                  placeholder="smtp.example.com"
                  value={emailConfig.host}
                  onChange={(e) =>
                    setEmailConfig((prev) => ({ ...prev, host: e.target.value }))
                  }
                  required
                />
              </label>
              <label>
                Port
                <input
                  type="number"
                  min={1}
                  max={65535}
                  value={emailConfig.port}
                  onChange={(e) =>
                    setEmailConfig((prev) => ({
                      ...prev,
                      port: Number(e.target.value),
                    }))
                  }
                  required
                />
              </label>
              <label>
                Secure (TLS)
                <input
                  type="checkbox"
                  checked={emailConfig.secure}
                  onChange={(e) =>
                    setEmailConfig((prev) => ({
                      ...prev,
                      secure: e.target.checked,
                    }))
                  }
                />
              </label>
            </div>
            <div className="form-row">
              <label>
                Username
                <input
                  type="text"
                  placeholder="user@example.com"
                  value={emailConfig.username}
                  onChange={(e) =>
                    setEmailConfig((prev) => ({
                      ...prev,
                      username: e.target.value,
                    }))
                  }
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  placeholder={emailConfig.hasPassword ? '••••••••' : 'Password'}
                  value={emailConfig.password}
                  onChange={(e) =>
                    setEmailConfig((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                />
              </label>
              <label>
                From
                <input
                  type="text"
                  placeholder="no-reply@domain.com"
                  value={emailConfig.from}
                  onChange={(e) =>
                    setEmailConfig((prev) => ({
                      ...prev,
                      from: e.target.value,
                    }))
                  }
                />
              </label>
            </div>
            <div className="form-actions">
              <button
                type="button"
                onClick={handleTestEmailConfig}
                disabled={emailConfigTesting || !emailConfig.host || !emailConfig.port}
                className="btn-secondary"
              >
                {emailConfigTesting ? 'Testing...' : 'Test connection'}
              </button>
              <button type="submit" disabled={emailConfigSaving} className="btn-primary">
                {emailConfigSaving ? 'Saving...' : 'Save email config'}
              </button>
            </div>
          </form>
        </div>

        <TagManager tags={tags} onTagsChange={fetchTags} />
      </div>

      <div className="contacts-grid">
        {users.map((user) => (
          <div key={user.id} className="contact-card">
            <h3>{user.email}</h3>
            <div className="admin-form">
              <div className="form-row">
                <label>
                  Role
                  <select
                    value={roleUpdates[user.id] ?? user.role}
                    onChange={(e) =>
                      handleRoleChange(user.id, e.target.value as User['role'])
                    }
                  >
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="SUPERADMIN">SUPERADMIN</option>
                  </select>
                </label>
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  className="btn-primary"
                  disabled={(roleUpdates[user.id] ?? user.role) === user.role}
                  onClick={() => saveRoleChange(user.id)}
                >
                  Save role
                </button>
              </div>
            </div>
            <p>Status: {user.status}</p>
            <p>
              Account: {user.emailVerifiedAt ? 'Activated' : 'Not activated'}
            </p>
            <p>Last login: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : '-'}</p>
            <p>Last logout: {user.lastLogoutAt ? new Date(user.lastLogoutAt).toLocaleString() : '-'}</p>
            <div className="card-actions">
              <button
                onClick={() => confirmAccount(user)}
                className="btn-secondary"
                disabled={Boolean(user.emailVerifiedAt)}
              >
                {user.emailVerifiedAt ? 'Confirmed' : 'Confirm account'}
              </button>
              <button onClick={() => toggleStatus(user)} className="btn-edit">
                {user.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
              </button>
              <button onClick={() => handleDelete(user.id)} className="btn-delete">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
