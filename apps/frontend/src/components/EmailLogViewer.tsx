import { useEffect, useState } from 'react';
import { api } from '../services/api';

interface EmailLog {
  id: number;
  userId?: number | null;
  recipient: string;
  subject: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  errorMessage?: string | null;
  sentAt?: string | null;
  createdAt: string;
  user?: {
    id: number;
    email: string;
  } | null;
}

const statusColors = {
  PENDING: '#ffc107',
  SENT: '#28a745',
  FAILED: '#dc3545',
};

const statusIcons = {
  PENDING: '⏳',
  SENT: '✓',
  FAILED: '✗',
};

export default function EmailLogViewer() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string | number> = {
        page,
        limit: 50,
      };
      if (statusFilter) {
        params.status = statusFilter;
      }

      const response = await api.get('/email-logs', { params });
      setLogs(response.data.logs || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load email logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, statusFilter]);

  const handleClearLogs = async () => {
    if (!confirm('Are you sure you want to clear all email logs?')) {
      return;
    }

    try {
      await api.post('/email-logs/clear', {});
      await fetchLogs();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to clear logs');
    }
  };

  const handleDeleteLog = async (id: number) => {
    if (!confirm('Are you sure you want to delete this log?')) {
      return;
    }

    try {
      await api.delete(`/email-logs/${id}`);
      await fetchLogs();
      setSelectedLog(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete log');
    }
  };

  return (
    <div className="tag-manager admin-logs">
      <div className="admin-logs-header">
        <h3>Email Logs</h3>
        <div className="admin-logs-filters" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="SENT">Sent</option>
            <option value="FAILED">Failed</option>
          </select>
          <button onClick={handleClearLogs} className="btn-secondary">
            Clear all logs
          </button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {loading && <div className="loading">Loading...</div>}

      {!loading && logs.length === 0 && (
        <div className="empty-state">No email logs found.</div>
      )}

      {!loading && logs.length > 0 && (
        <>
          <table className="audit-table">
            <thead>
              <tr>
                <th>Date & time</th>
                <th>Status</th>
                <th>Recipient</th>
                <th>Subject</th>
                <th>Sent by</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} onClick={() => setSelectedLog(log)} style={{ cursor: 'pointer' }}>
                  <td>{new Date(log.createdAt).toLocaleString()}</td>
                  <td>
                    <span
                      style={{
                        color: statusColors[log.status],
                        fontWeight: 'bold',
                      }}
                    >
                      {statusIcons[log.status]} {log.status}
                    </span>
                  </td>
                  <td>{log.recipient}</td>
                  <td>{log.subject}</td>
                  <td>{log.user?.email || '-'}</td>
                  <td>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteLog(log.id);
                      }}
                      className="btn-secondary"
                      style={{ padding: '4px 8px', fontSize: '0.9em' }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

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
            <h3>Email Log Details</h3>
            <div style={{ marginTop: '20px' }}>
              <p>
                <strong>Status:</strong>{' '}
                <span style={{ color: statusColors[selectedLog.status] }}>
                  {statusIcons[selectedLog.status]} {selectedLog.status}
                </span>
              </p>
              <p>
                <strong>Recipient:</strong> {selectedLog.recipient}
              </p>
              <p>
                <strong>Subject:</strong> {selectedLog.subject}
              </p>
              <p>
                <strong>Sent by:</strong> {selectedLog.user?.email || 'System'}
              </p>
              <p>
                <strong>Created:</strong> {new Date(selectedLog.createdAt).toLocaleString()}
              </p>
              {selectedLog.sentAt && (
                <p>
                  <strong>Sent:</strong> {new Date(selectedLog.sentAt).toLocaleString()}
                </p>
              )}
              {selectedLog.errorMessage && (
                <p>
                  <strong>Error:</strong>{' '}
                  <span style={{ color: '#dc3545' }}>{selectedLog.errorMessage}</span>
                </p>
              )}
            </div>
            <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedLog(null)} className="btn-secondary">
                Close
              </button>
              <button
                onClick={() => handleDeleteLog(selectedLog.id)}
                className="btn-secondary"
                style={{ backgroundColor: '#dc3545', color: 'white' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
