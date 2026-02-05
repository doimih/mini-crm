import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

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

interface User {
  id: number;
  email: string;
  role: string;
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
    name: 'Name',
    company: 'Company',
    phone: 'Phone',
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

const getActionColor = (action: string): string => {
  if (action.includes('CREATE')) return '#28a745';
  if (action.includes('UPDATE')) return '#ffc107';
  if (action.includes('DELETE')) return '#dc3545';
  if (action.includes('LOGIN')) return '#17a2b8';
  if (action.includes('LOGOUT')) return '#6c757d';
  if (action.includes('FAILED')) return '#dc3545';
  return '#007bff';
};

const getActionIcon = (action: string): string => {
  if (action.includes('CREATE')) return '✓';
  if (action.includes('UPDATE')) return '✎';
  if (action.includes('DELETE')) return '✗';
  if (action.includes('LOGIN')) return '→';
  if (action.includes('LOGOUT')) return '←';
  if (action.includes('FAILED')) return '!';
  return '•';
};

export default function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [userFilter, setUserFilter] = useState<string>('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data || []);
    } catch (err: any) {
      console.error('Failed to load users:', err);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string | number> = {
        page,
        limit: 50,
      };

      if (userFilter) {
        params.userId = userFilter;
      }

      if (actionFilter.trim()) {
        params.action = actionFilter.trim();
      }

      if (entityFilter.trim()) {
        params.entity = entityFilter.trim();
      }

      const response = await api.get('/audit-logs', { params });
      setLogs(response.data.logs || []);
      setTotalPages(response.data.pagination?.pages || 1);
      setTotalLogs(response.data.pagination?.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [page, userFilter, actionFilter, entityFilter]);

  const filteredLogs = logs.filter((log) => {
    if (dateFrom) {
      const logDate = new Date(log.createdAt);
      const fromDate = new Date(dateFrom);
      if (logDate < fromDate) return false;
    }
    if (dateTo) {
      const logDate = new Date(log.createdAt);
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      if (logDate > toDate) return false;
    }
    return true;
  });

  const exportToCSV = () => {
    const headers = ['Date & Time', 'User', 'Action', 'Entity', 'Entity ID', 'Details'];
    const rows = filteredLogs.map((log) => [
      new Date(log.createdAt).toLocaleString(),
      log.user.email,
      formatAuditAction(log.action),
      log.entity || '-',
      log.entityId || '-',
      formatAuditDetails(log.details),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `audit-logs-${new Date().toISOString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const actionTypes = Array.from(
    new Set(logs.map((log) => log.action).filter(Boolean))
  ).sort();

  const entityTypes = Array.from(
    new Set(logs.map((log) => log.entity).filter((e): e is string => Boolean(e)))
  ).sort();

  return (
    <div className="container">
      <header>
        <h1>User Activity Log</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/mini-crm/">
            <button className="btn-secondary">
              Back to Contacts
            </button>
          </Link>
          <Link to="/mini-crm/admin">
            <button className="btn-secondary">
              Admin Panel
            </button>
          </Link>
        </div>
      </header>

      {error && <div className="error">{error}</div>}

      <div className="tag-manager admin-logs">
        <div className="admin-logs-header" style={{ flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <h3>
              Activity Logs
              {totalLogs > 0 && <span style={{ fontSize: '0.9em', color: '#666', marginLeft: '10px' }}>
                ({filteredLogs.length} of {totalLogs} total)
              </span>}
            </h3>
            <button onClick={exportToCSV} className="btn-secondary" disabled={filteredLogs.length === 0}>
              Export to CSV
            </button>
          </div>

          <div className="admin-logs-filters" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', width: '100%' }}>
            <select
              value={userFilter}
              onChange={(e) => {
                setUserFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All users</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.email}
                </option>
              ))}
            </select>

            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All actions</option>
              {actionTypes.map((action) => (
                <option key={action} value={action}>
                  {formatAuditAction(action)}
                </option>
              ))}
            </select>

            <select
              value={entityFilter}
              onChange={(e) => {
                setEntityFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All entities</option>
              {entityTypes.map((entity) => (
                <option key={entity} value={entity}>
                  {entity}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="From date"
            />

            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholder="To date"
            />

            {(userFilter || actionFilter || entityFilter || dateFrom || dateTo) && (
              <button
                onClick={() => {
                  setUserFilter('');
                  setActionFilter('');
                  setEntityFilter('');
                  setDateFrom('');
                  setDateTo('');
                  setPage(1);
                }}
                className="btn-secondary"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {loading && <div className="loading">Loading...</div>}

        {!loading && filteredLogs.length === 0 && (
          <div className="empty-state">No audit logs found.</div>
        )}

        {!loading && filteredLogs.length > 0 && (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="audit-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: '180px' }}>Date & time</th>
                    <th style={{ minWidth: '200px' }}>User</th>
                    <th style={{ minWidth: '200px' }}>Action</th>
                    <th>Entity</th>
                    <th>Entity ID</th>
                    <th style={{ minWidth: '250px' }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>{new Date(log.createdAt).toLocaleString()}</td>
                      <td>{log.user.email}</td>
                      <td>
                        <span
                          style={{
                            color: getActionColor(log.action),
                            fontWeight: 'bold',
                          }}
                        >
                          {getActionIcon(log.action)} {formatAuditAction(log.action)}
                        </span>
                      </td>
                      <td>{log.entity || '-'}</td>
                      <td>{log.entityId || '-'}</td>
                      <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {formatAuditDetails(log.details)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                  Previous
                </button>
                <span>
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {selectedLog && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setSelectedLog(null)}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '8px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Audit Log Details</h3>
            <div style={{ marginTop: '20px' }}>
              <p>
                <strong>Action:</strong>{' '}
                <span style={{ color: getActionColor(selectedLog.action) }}>
                  {getActionIcon(selectedLog.action)} {formatAuditAction(selectedLog.action)}
                </span>
              </p>
              <p>
                <strong>User:</strong> {selectedLog.user.email}
              </p>
              <p>
                <strong>Entity:</strong> {selectedLog.entity || '-'}
              </p>
              <p>
                <strong>Entity ID:</strong> {selectedLog.entityId || '-'}
              </p>
              <p>
                <strong>Date & Time:</strong> {new Date(selectedLog.createdAt).toLocaleString()}
              </p>
              {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                <>
                  <p>
                    <strong>Details:</strong>
                  </p>
                  <div
                    style={{
                      backgroundColor: '#f5f5f5',
                      padding: '15px',
                      borderRadius: '4px',
                      maxHeight: '300px',
                      overflow: 'auto',
                    }}
                  >
                    <pre style={{ margin: 0, fontSize: '0.9em' }}>
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  </div>
                </>
              )}
            </div>
            <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedLog(null)} className="btn-primary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
