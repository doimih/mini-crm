import { useEffect, useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import TagManager from './TagManager';
import TranslationManager from './TranslationManager';
import EmailLogViewer from './EmailLogViewer';

interface User {
  id: number;
  email: string;
  role: 'USER' | 'ADMIN' | 'SUPERADMIN';
  status: 'ACTIVE' | 'SUSPENDED';
  phone?: string | null;
  emailVerifiedAt?: string | null;
  lastLoginAt?: string | null;
  lastLogoutAt?: string | null;
  createdAt: string;
}

interface EditUserForm {
  email: string;
  password: string;
  phone: string;
  role: User['role'];
  status: User['status'];
}

interface AuditLog {
  id: number;
  action: string;
  entity?: string | null;
  entityId?: number | null;
  details?: Record<string, unknown> | null;
  createdAt: string;
  user: {
    id: number;
    email: string;
  };
}

const formatAuditAction = (action: string) =>
  action
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());

const formatAuditDetails = (details?: Record<string, unknown> | null) => {
  if (!details || typeof details !== 'object') return '-';

  const labels: Record<string, string> = {
    title: 'Title',
    type: 'Type',
    status: 'Status',
    role: 'Role',
    email: 'Email',
    count: 'Count',
    tagId: 'Tag ID',
    host: 'Host',
    port: 'Port',
    secure: 'Secure',
    verified: 'Verified',
  };

  const entries = Object.entries(details)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => {
      const label = labels[key] || key;
      const text = typeof value === 'string' ? value : JSON.stringify(value);
      return `${label}: ${text}`;
    });

  return entries.length > 0 ? entries.join(', ') : '-';
};

export default function UserAdmin() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<User['role']>('USER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tags, setTags] = useState<{ id: number; name: string }[]>([]);
  const [roleUpdates, setRoleUpdates] = useState<Record<number, User['role']>>({});
  const [editingUser, setEditingUser] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditUserForm>({
    email: '',
    password: '',
    phone: '',
    role: 'USER',
    status: 'ACTIVE',
  });
  const [emailConfig, setEmailConfig] = useState({
    host: '',
    port: 587,
    secure: false,
    username: '',
    password: '',
    from: '',
    hasPassword: false,
    testEmail: '',
  });
  const [emailConfigSaving, setEmailConfigSaving] = useState(false);
  const [emailConfigMessage, setEmailConfigMessage] = useState('');
  const [emailConfigTesting, setEmailConfigTesting] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditPages, setAuditPages] = useState(1);
  const [auditUserId, setAuditUserId] = useState<string>('');
  const [auditAction, setAuditAction] = useState('');
  const [auditLoading, setAuditLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'tags' | 'config' | 'emaillogs' | 'translations' | 'audit'>('users');

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

  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const params: Record<string, string | number> = {
        page: auditPage,
        limit: 20,
      };

      if (auditUserId) {
        params.userId = auditUserId;
      }

      if (auditAction.trim()) {
        params.action = auditAction.trim();
      }

      const response = await api.get('/audit-logs', { params });
      setAuditLogs(response.data.logs || []);
      setAuditPages(response.data.pagination?.pages || 1);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load audit logs');
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchTags();
    fetchEmailConfig();
    
    // Get current user ID
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setCurrentUserId(user.id);
    }
  }, []);

  useEffect(() => {
    fetchAuditLogs();
  }, [auditPage, auditUserId, auditAction]);

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

  const openEditUser = (user: User) => {
    setEditingUser(user.id);
    setEditForm({
      email: user.email,
      password: '',
      phone: user.phone || '',
      role: user.role,
      status: user.status,
    });
    setError('');
  };

  const closeEditUser = () => {
    setEditingUser(null);
    setEditForm({
      email: '',
      password: '',
      phone: '',
      role: 'USER',
      status: 'ACTIVE',
    });
    setError('');
  };

  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setLoading(true);
    setError('');

    try {
      const payload: any = {
        role: editForm.role,
        status: editForm.status,
        phone: editForm.phone,
      };

      const isSelf = currentUserId === editingUser;
      if (!isSelf) {
        payload.email = editForm.email;
      }

      if (editForm.password) {
        payload.password = editForm.password;
      }

      await api.put(`/users/${editingUser}`, payload);
      closeEditUser();
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update user');
    } finally {
      setLoading(false);
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
        testEmail: emailConfig.testEmail.trim() || undefined,
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
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/audit-logs">
            <button className="btn-secondary">
              View Activity Log
            </button>
          </Link>
          <Link to="/">
            <button className="btn-secondary">
              Back to Contacts
            </button>
          </Link>
        </div>
      </header>

      {error && <div className="error">{error}</div>}

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #ddd', paddingBottom: '10px', flexWrap: 'wrap' }}>
        <button
          className={activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
        <button
          className={activeTab === 'tags' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setActiveTab('tags')}
        >
          Tags
        </button>
        <button
          className={activeTab === 'config' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setActiveTab('config')}
        >
          Email Config
        </button>
        <button
          className={activeTab === 'emaillogs' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setActiveTab('emaillogs')}
        >
          Email Logs
        </button>
        <button
          className={activeTab === 'translations' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setActiveTab('translations')}
        >
          Translations
        </button>
        <button
          className={activeTab === 'audit' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setActiveTab('audit')}
        >
          Audit Log
        </button>
      </div>

      {activeTab === 'users' && (
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
        </div>
      )}

      {activeTab === 'tags' && <TagManager tags={tags} onTagsChange={fetchTags} />}

      {activeTab === 'config' && (
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
            <div className="form-row">
              <label>
                Test Email Address (optional)
                <input
                  type="email"
                  placeholder="test@example.com"
                  value={emailConfig.testEmail}
                  onChange={(e) =>
                    setEmailConfig((prev) => ({
                      ...prev,
                      testEmail: e.target.value,
                    }))
                  }
                />
                <small style={{ fontSize: '0.85em', color: '#666', marginTop: '4px', display: 'block' }}>
                  Enter an email address to receive a test email when testing the configuration
                </small>
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
      )}

      {activeTab === 'translations' && <TranslationManager />}

      {activeTab === 'emaillogs' && <EmailLogViewer />}

      {activeTab === 'audit' && (
        <div className="tag-manager admin-logs">
          <div className="admin-logs-header">
            <h3>User activity log</h3>
            <div className="admin-logs-filters">
              <select
                value={auditUserId}
                onChange={(e) => {
                  setAuditUserId(e.target.value);
                  setAuditPage(1);
                }}
              >
                <option value="">All users</option>
                {users.map((userItem) => (
                  <option key={userItem.id} value={userItem.id}>
                    {userItem.email}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Filter action (LOGIN, CONTACT_UPDATE...)"
                value={auditAction}
                onChange={(e) => {
                  setAuditAction(e.target.value);
                  setAuditPage(1);
                }}
              />
            </div>
          </div>

          {auditLoading && <div className="loading">Loading...</div>}

          {!auditLoading && auditLogs.length === 0 && (
            <div className="empty-state">No audit logs found.</div>
          )}

          {!auditLoading && auditLogs.length > 0 && (
            <table className="audit-table">
              <thead>
                <tr>
                  <th>Date & time</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Entity ID</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{new Date(log.createdAt).toLocaleString()}</td>
                    <td>{log.user.email}</td>
                    <td>{formatAuditAction(log.action)}</td>
                    <td>{log.entity || '-'}</td>
                    <td>{log.entityId || '-'}</td>
                    <td>{formatAuditDetails(log.details)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {auditPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                disabled={auditPage === 1}
              >
                Previous
              </button>
              <span>
                Page {auditPage} of {auditPages}
              </span>
              <button
                onClick={() => setAuditPage((p) => Math.min(auditPages, p + 1))}
                disabled={auditPage === auditPages}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'users' && users.length > 0 && (
        <div className="contacts-grid">
          {users.map((user) => {
            const isSelf = currentUserId === user.id;
            
            return (
              <div key={user.id} className="contact-card">
                <h3>{user.email} {isSelf && <span style={{fontSize: '0.9em', color: '#666'}}>(You)</span>}</h3>
                <p>Role: {user.role}</p>
                <p>Status: {user.status}</p>
                <p>Phone: {user.phone || '-'}</p>
                <p>
                  Account: {user.emailVerifiedAt ? 'Activated' : 'Not activated'}
                </p>
                <p>Last login: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : '-'}</p>
                <p>Last logout: {user.lastLogoutAt ? new Date(user.lastLogoutAt).toLocaleString() : '-'}</p>
                <div className="card-actions">
                  <button
                    onClick={() => openEditUser(user)}
                    className="btn-primary"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => confirmAccount(user)}
                    className="btn-secondary"
                    disabled={Boolean(user.emailVerifiedAt) || isSelf}
                  >
                    {user.emailVerifiedAt ? 'Confirmed' : 'Confirm account'}
                  </button>
                  <button 
                    onClick={() => toggleStatus(user)} 
                    className="btn-edit"
                    disabled={isSelf}
                  >
                    {user.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                  </button>
                  <button 
                    onClick={() => handleDelete(user.id)} 
                    className="btn-delete"
                    disabled={isSelf}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {editingUser !== null && (
        <div className="modal" onClick={closeEditUser}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Edit User: {editForm.email}</h2>
            {error && <div className="error">{error}</div>}
            <form onSubmit={handleEditSubmit}>
              <div className="admin-form">
                <div className="form-row">
                  <label>
                    Email
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                      required
                      disabled={users.find(u => u.id === editingUser)?.id === currentUserId}
                    />
                  </label>
                </div>
                <div className="form-row">
                  <label>
                    Password (leave empty to keep current)
                    <input
                      type="password"
                      value={editForm.password}
                      onChange={(e) => setEditForm({...editForm, password: e.target.value})}
                      placeholder="New password (optional)"
                      minLength={6}
                    />
                  </label>
                </div>
                <div className="form-row">
                  <label>
                    Phone
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                      placeholder="Phone number"
                    />
                  </label>
                </div>
                <div className="form-row">
                  <label>
                    Role
                    <select
                      value={editForm.role}
                      onChange={(e) => setEditForm({...editForm, role: e.target.value as User['role']})}
                      disabled={users.find(u => u.id === editingUser)?.id === currentUserId}
                    >
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="SUPERADMIN">SUPERADMIN</option>
                    </select>
                  </label>
                </div>
                <div className="form-row">
                  <label>
                    Status
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({...editForm, status: e.target.value as User['status']})}
                      disabled={users.find(u => u.id === editingUser)?.id === currentUserId}
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="SUSPENDED">SUSPENDED</option>
                    </select>
                  </label>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button type="button" className="btn-secondary" onClick={closeEditUser}>
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}    </div>
  );
}
