import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { api } from '../services/api';
import TagManager from './TagManager';
import TranslationManager from './TranslationManager';
import EmailLogViewer from './EmailLogViewer';
const formatAuditAction = (action) => action
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());
const formatAuditDetails = (details) => {
    if (!details || typeof details !== 'object')
        return '-';
    const labels = {
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
    const [users, setUsers] = useState([]);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('USER');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [tags, setTags] = useState([]);
    const [roleUpdates, setRoleUpdates] = useState({});
    const [editingUser, setEditingUser] = useState(null);
    const [editForm, setEditForm] = useState({
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
    });
    const [emailConfigSaving, setEmailConfigSaving] = useState(false);
    const [emailConfigMessage, setEmailConfigMessage] = useState('');
    const [emailConfigTesting, setEmailConfigTesting] = useState(false);
    const [auditLogs, setAuditLogs] = useState([]);
    const [auditPage, setAuditPage] = useState(1);
    const [auditPages, setAuditPages] = useState(1);
    const [auditUserId, setAuditUserId] = useState('');
    const [auditAction, setAuditAction] = useState('');
    const [auditLoading, setAuditLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('users');
    const fetchUsers = async () => {
        try {
            const response = await api.get('/users');
            setUsers(response.data);
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to load users');
        }
    };
    const fetchTags = async () => {
        try {
            const response = await api.get('/tags');
            setTags(response.data);
        }
        catch (err) {
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
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to load email config');
        }
    };
    const fetchAuditLogs = async () => {
        setAuditLoading(true);
        try {
            const params = {
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
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to load audit logs');
        }
        finally {
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
    const handleCreate = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await api.post('/users', { email, password, role });
            setEmail('');
            setPassword('');
            setRole('USER');
            fetchUsers();
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to create user');
        }
        finally {
            setLoading(false);
        }
    };
    const toggleStatus = async (user) => {
        const newStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
        try {
            await api.patch(`/users/${user.id}/status`, { status: newStatus });
            fetchUsers();
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to update status');
        }
    };
    const handleDelete = async (id) => {
        if (!confirm('Delete this user?'))
            return;
        try {
            await api.delete(`/users/${id}`);
            fetchUsers();
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to delete user');
        }
    };
    const confirmAccount = async (user) => {
        try {
            await api.patch(`/users/${user.id}/verification`, { verified: true });
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const currentUser = JSON.parse(storedUser);
                if (currentUser.id === user.id) {
                    currentUser.emailVerified = true;
                    localStorage.setItem('user', JSON.stringify(currentUser));
                }
            }
            fetchUsers();
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to update verification');
        }
    };
    const handleRoleChange = (userId, newRole) => {
        setRoleUpdates((prev) => ({ ...prev, [userId]: newRole }));
    };
    const saveRoleChange = async (userId) => {
        const newRole = roleUpdates[userId];
        if (!newRole)
            return;
        try {
            await api.put(`/users/${userId}`, { role: newRole });
            setRoleUpdates((prev) => {
                const next = { ...prev };
                delete next[userId];
                return next;
            });
            fetchUsers();
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to update role');
        }
    };
    const openEditUser = (user) => {
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
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!editingUser)
            return;
        setLoading(true);
        setError('');
        try {
            const payload = {
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
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to update user');
        }
        finally {
            setLoading(false);
        }
    };
    const handleSaveEmailConfig = async (e) => {
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
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to save email config');
        }
        finally {
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
        }
        catch (err) {
            setError(err.response?.data?.message || 'Connection failed. Check your settings.');
        }
        finally {
            setEmailConfigTesting(false);
        }
    };
    return (_jsxs("div", { className: "container", children: [_jsxs("header", { children: [_jsx("h1", { children: "User Admin" }), _jsxs("div", { style: { display: 'flex', gap: '10px' }, children: [_jsx("a", { href: "/mini-crm/audit-logs", className: "btn-secondary", children: "View Activity Log" }), _jsx("a", { href: "/mini-crm/", className: "btn-secondary", children: "Back to Contacts" })] })] }), error && _jsx("div", { className: "error", children: error }), _jsxs("div", { style: { display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #ddd', paddingBottom: '10px', flexWrap: 'wrap' }, children: [_jsx("button", { className: activeTab === 'users' ? 'btn-primary' : 'btn-secondary', onClick: () => setActiveTab('users'), children: "Users" }), _jsx("button", { className: activeTab === 'tags' ? 'btn-primary' : 'btn-secondary', onClick: () => setActiveTab('tags'), children: "Tags" }), _jsx("button", { className: activeTab === 'config' ? 'btn-primary' : 'btn-secondary', onClick: () => setActiveTab('config'), children: "Email Config" }), _jsx("button", { className: activeTab === 'emaillogs' ? 'btn-primary' : 'btn-secondary', onClick: () => setActiveTab('emaillogs'), children: "Email Logs" }), _jsx("button", { className: activeTab === 'translations' ? 'btn-primary' : 'btn-secondary', onClick: () => setActiveTab('translations'), children: "Translations" }), _jsx("button", { className: activeTab === 'audit' ? 'btn-primary' : 'btn-secondary', onClick: () => setActiveTab('audit'), children: "Audit Log" })] }), activeTab === 'users' && (_jsx("div", { className: "admin-top", children: _jsxs("div", { className: "tag-manager", children: [_jsx("h3", { children: "Create User" }), _jsxs("form", { onSubmit: handleCreate, className: "admin-form", children: [_jsxs("div", { className: "form-row", children: [_jsxs("label", { children: ["Email", _jsx("input", { type: "email", placeholder: "email@domain.com", value: email, onChange: (e) => setEmail(e.target.value), required: true })] }), _jsxs("label", { children: ["Password", _jsx("input", { type: "password", placeholder: "Min 6 characters", value: password, onChange: (e) => setPassword(e.target.value), required: true, minLength: 6 })] }), _jsxs("label", { children: ["Role", _jsxs("select", { value: role, onChange: (e) => setRole(e.target.value), children: [_jsx("option", { value: "USER", children: "USER" }), _jsx("option", { value: "ADMIN", children: "ADMIN" }), _jsx("option", { value: "SUPERADMIN", children: "SUPERADMIN" })] })] })] }), _jsx("div", { className: "form-actions", children: _jsx("button", { type: "submit", disabled: loading, className: "btn-primary", children: loading ? 'Saving...' : 'Add User' }) })] })] }) })), activeTab === 'tags' && _jsx(TagManager, { tags: tags, onTagsChange: fetchTags }), activeTab === 'config' && (_jsxs("div", { className: "tag-manager", children: [_jsx("h3", { children: "Email configuration" }), emailConfigMessage && _jsx("div", { className: "success", children: emailConfigMessage }), _jsxs("form", { onSubmit: handleSaveEmailConfig, className: "admin-form", children: [_jsxs("div", { className: "form-row", children: [_jsxs("label", { children: ["Server", _jsx("input", { type: "text", placeholder: "smtp.example.com", value: emailConfig.host, onChange: (e) => setEmailConfig((prev) => ({ ...prev, host: e.target.value })), required: true })] }), _jsxs("label", { children: ["Port", _jsx("input", { type: "number", min: 1, max: 65535, value: emailConfig.port, onChange: (e) => setEmailConfig((prev) => ({
                                                    ...prev,
                                                    port: Number(e.target.value),
                                                })), required: true })] }), _jsxs("label", { children: ["Secure (TLS)", _jsx("input", { type: "checkbox", checked: emailConfig.secure, onChange: (e) => setEmailConfig((prev) => ({
                                                    ...prev,
                                                    secure: e.target.checked,
                                                })) })] })] }), _jsxs("div", { className: "form-row", children: [_jsxs("label", { children: ["Username", _jsx("input", { type: "text", placeholder: "user@example.com", value: emailConfig.username, onChange: (e) => setEmailConfig((prev) => ({
                                                    ...prev,
                                                    username: e.target.value,
                                                })) })] }), _jsxs("label", { children: ["Password", _jsx("input", { type: "password", placeholder: emailConfig.hasPassword ? '••••••••' : 'Password', value: emailConfig.password, onChange: (e) => setEmailConfig((prev) => ({
                                                    ...prev,
                                                    password: e.target.value,
                                                })) })] }), _jsxs("label", { children: ["From", _jsx("input", { type: "text", placeholder: "no-reply@domain.com", value: emailConfig.from, onChange: (e) => setEmailConfig((prev) => ({
                                                    ...prev,
                                                    from: e.target.value,
                                                })) })] })] }), _jsxs("div", { className: "form-actions", children: [_jsx("button", { type: "button", onClick: handleTestEmailConfig, disabled: emailConfigTesting || !emailConfig.host || !emailConfig.port, className: "btn-secondary", children: emailConfigTesting ? 'Testing...' : 'Test connection' }), _jsx("button", { type: "submit", disabled: emailConfigSaving, className: "btn-primary", children: emailConfigSaving ? 'Saving...' : 'Save email config' })] })] })] })), activeTab === 'translations' && _jsx(TranslationManager, {}), activeTab === 'emaillogs' && _jsx(EmailLogViewer, {}), activeTab === 'audit' && (_jsxs("div", { className: "tag-manager admin-logs", children: [_jsxs("div", { className: "admin-logs-header", children: [_jsx("h3", { children: "User activity log" }), _jsxs("div", { className: "admin-logs-filters", children: [_jsxs("select", { value: auditUserId, onChange: (e) => {
                                            setAuditUserId(e.target.value);
                                            setAuditPage(1);
                                        }, children: [_jsx("option", { value: "", children: "All users" }), users.map((userItem) => (_jsx("option", { value: userItem.id, children: userItem.email }, userItem.id)))] }), _jsx("input", { type: "text", placeholder: "Filter action (LOGIN, CONTACT_UPDATE...)", value: auditAction, onChange: (e) => {
                                            setAuditAction(e.target.value);
                                            setAuditPage(1);
                                        } })] })] }), auditLoading && _jsx("div", { className: "loading", children: "Loading..." }), !auditLoading && auditLogs.length === 0 && (_jsx("div", { className: "empty-state", children: "No audit logs found." })), !auditLoading && auditLogs.length > 0 && (_jsxs("table", { className: "audit-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Date & time" }), _jsx("th", { children: "User" }), _jsx("th", { children: "Action" }), _jsx("th", { children: "Entity" }), _jsx("th", { children: "Entity ID" }), _jsx("th", { children: "Details" })] }) }), _jsx("tbody", { children: auditLogs.map((log) => (_jsxs("tr", { children: [_jsx("td", { children: new Date(log.createdAt).toLocaleString() }), _jsx("td", { children: log.user.email }), _jsx("td", { children: formatAuditAction(log.action) }), _jsx("td", { children: log.entity || '-' }), _jsx("td", { children: log.entityId || '-' }), _jsx("td", { children: formatAuditDetails(log.details) })] }, log.id))) })] })), auditPages > 1 && (_jsxs("div", { className: "pagination", children: [_jsx("button", { onClick: () => setAuditPage((p) => Math.max(1, p - 1)), disabled: auditPage === 1, children: "Previous" }), _jsxs("span", { children: ["Page ", auditPage, " of ", auditPages] }), _jsx("button", { onClick: () => setAuditPage((p) => Math.min(auditPages, p + 1)), disabled: auditPage === auditPages, children: "Next" })] }))] })), activeTab === 'users' && users.length > 0 && (_jsx("div", { className: "contacts-grid", children: users.map((user) => {
                    const isSelf = currentUserId === user.id;
                    return (_jsxs("div", { className: "contact-card", children: [_jsxs("h3", { children: [user.email, " ", isSelf && _jsx("span", { style: { fontSize: '0.9em', color: '#666' }, children: "(You)" })] }), _jsxs("p", { children: ["Role: ", user.role] }), _jsxs("p", { children: ["Status: ", user.status] }), _jsxs("p", { children: ["Phone: ", user.phone || '-'] }), _jsxs("p", { children: ["Account: ", user.emailVerifiedAt ? 'Activated' : 'Not activated'] }), _jsxs("p", { children: ["Last login: ", user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : '-'] }), _jsxs("p", { children: ["Last logout: ", user.lastLogoutAt ? new Date(user.lastLogoutAt).toLocaleString() : '-'] }), _jsxs("div", { className: "card-actions", children: [_jsx("button", { onClick: () => openEditUser(user), className: "btn-primary", children: "Edit" }), _jsx("button", { onClick: () => confirmAccount(user), className: "btn-secondary", disabled: Boolean(user.emailVerifiedAt) || isSelf, children: user.emailVerifiedAt ? 'Confirmed' : 'Confirm account' }), _jsx("button", { onClick: () => toggleStatus(user), className: "btn-edit", disabled: isSelf, children: user.status === 'ACTIVE' ? 'Suspend' : 'Activate' }), _jsx("button", { onClick: () => handleDelete(user.id), className: "btn-delete", disabled: isSelf, children: "Delete" })] })] }, user.id));
                }) })), editingUser !== null && (_jsx("div", { className: "modal", onClick: closeEditUser, children: _jsxs("div", { className: "modal-content", onClick: (e) => e.stopPropagation(), children: [_jsxs("h2", { children: ["Edit User: ", editForm.email] }), error && _jsx("div", { className: "error", children: error }), _jsx("form", { onSubmit: handleEditSubmit, children: _jsxs("div", { className: "admin-form", children: [_jsx("div", { className: "form-row", children: _jsxs("label", { children: ["Email", _jsx("input", { type: "email", value: editForm.email, onChange: (e) => setEditForm({ ...editForm, email: e.target.value }), required: true, disabled: users.find(u => u.id === editingUser)?.id === currentUserId })] }) }), _jsx("div", { className: "form-row", children: _jsxs("label", { children: ["Password (leave empty to keep current)", _jsx("input", { type: "password", value: editForm.password, onChange: (e) => setEditForm({ ...editForm, password: e.target.value }), placeholder: "New password (optional)", minLength: 6 })] }) }), _jsx("div", { className: "form-row", children: _jsxs("label", { children: ["Phone", _jsx("input", { type: "tel", value: editForm.phone, onChange: (e) => setEditForm({ ...editForm, phone: e.target.value }), placeholder: "Phone number" })] }) }), _jsx("div", { className: "form-row", children: _jsxs("label", { children: ["Role", _jsxs("select", { value: editForm.role, onChange: (e) => setEditForm({ ...editForm, role: e.target.value }), disabled: users.find(u => u.id === editingUser)?.id === currentUserId, children: [_jsx("option", { value: "USER", children: "USER" }), _jsx("option", { value: "ADMIN", children: "ADMIN" }), _jsx("option", { value: "SUPERADMIN", children: "SUPERADMIN" })] })] }) }), _jsx("div", { className: "form-row", children: _jsxs("label", { children: ["Status", _jsxs("select", { value: editForm.status, onChange: (e) => setEditForm({ ...editForm, status: e.target.value }), disabled: users.find(u => u.id === editingUser)?.id === currentUserId, children: [_jsx("option", { value: "ACTIVE", children: "ACTIVE" }), _jsx("option", { value: "SUSPENDED", children: "SUSPENDED" })] })] }) }), _jsxs("div", { className: "form-actions", children: [_jsx("button", { type: "submit", className: "btn-primary", disabled: loading, children: loading ? 'Saving...' : 'Save Changes' }), _jsx("button", { type: "button", className: "btn-secondary", onClick: closeEditUser, children: "Cancel" })] })] }) })] }) })), "    "] }));
}
