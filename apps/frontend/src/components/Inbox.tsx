import { useState, useEffect, FormEvent } from 'react';
import { api } from '../services/api';

interface User {
  id: number;
  email: string;
}

interface Contact {
  id: number;
  name: string;
  email?: string;
}

interface Ticket {
  id: number;
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  createdAt: string;
  updatedAt: string;
  user: User;
  assignedUser?: User | null;
  contact?: Contact | null;
  commentCount: number;
  attachmentCount: number;
}

interface TicketComment {
  id: number;
  content: string;
  createdAt: string;
  user: User;
}

interface TicketAttachment {
  id: number;
  filename: string;
  filesize: number;
  createdAt: string;
}

interface TicketDetail extends Ticket {
  comments: TicketComment[];
  attachments: TicketAttachment[];
}

const statusColors = {
  OPEN: '#007bff',
  IN_PROGRESS: '#ffc107',
  RESOLVED: '#28a745',
  CLOSED: '#6c757d',
};

const priorityColors = {
  LOW: '#6c757d',
  MEDIUM: '#007bff',
  HIGH: '#fd7e14',
  URGENT: '#dc3545',
};

const formatStatus = (status: string) => {
  return status.replace(/_/g, ' ');
};

export default function Inbox() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // New ticket form
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    priority: 'MEDIUM' as const,
    assignedTo: '',
    contactId: '',
  });

  // Comment form
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  // File upload
  const [uploadingFile, setUploadingFile] = useState(false);

  useEffect(() => {
    fetchTickets();
    fetchUsers();
    fetchContacts();
  }, [page, statusFilter, priorityFilter]);

  const fetchTickets = async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string | number> = {
        page,
        limit: 20,
      };
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;

      const response = await api.get('/tickets', { params });
      setTickets(response.data.tickets || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data || []);
    } catch (err) {
      console.error('Failed to load users');
    }
  };

  const fetchContacts = async () => {
    try {
      const response = await api.get('/contacts', { params: { limit: 1000 } });
      setContacts(response.data.contacts || []);
    } catch (err) {
      console.error('Failed to load contacts');
    }
  };

  const fetchTicketDetails = async (id: number) => {
    try {
      const response = await api.get(`/tickets/${id}`);
      setSelectedTicket(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load ticket details');
    }
  };

  const handleCreateTicket = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/tickets', {
        ...newTicket,
        assignedTo: newTicket.assignedTo ? parseInt(newTicket.assignedTo) : null,
        contactId: newTicket.contactId ? parseInt(newTicket.contactId) : null,
      });
      setShowNewTicket(false);
      setNewTicket({
        subject: '',
        description: '',
        priority: 'MEDIUM',
        assignedTo: '',
        contactId: '',
      });
      fetchTickets();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await api.put(`/tickets/${id}`, { status });
      fetchTickets();
      if (selectedTicket?.id === id) {
        fetchTicketDetails(id);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update ticket');
    }
  };

  const handleAddComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !newComment.trim()) return;

    setCommentLoading(true);
    setError('');

    try {
      await api.post(`/tickets/${selectedTicket.id}/comments`, {
        content: newComment,
      });
      setNewComment('');
      fetchTicketDetails(selectedTicket.id);
      fetchTickets();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add comment');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedTicket || !e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    setUploadingFile(true);
    setError('');

    try {
      await api.post(`/tickets/${selectedTicket.id}/attachments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      fetchTicketDetails(selectedTicket.id);
      fetchTickets();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

  const handleDownloadAttachment = async (ticketId: number, attachmentId: number, filename: string) => {
    try {
      const response = await api.get(`/tickets/${ticketId}/attachments/${attachmentId}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to download file');
    }
  };

  const handleDeleteAttachment = async (ticketId: number, attachmentId: number) => {
    if (!confirm('Are you sure you want to delete this attachment?')) return;

    try {
      await api.delete(`/tickets/${ticketId}/attachments/${attachmentId}`);
      fetchTicketDetails(ticketId);
      fetchTickets();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete attachment');
    }
  };

  return (
    <div className="container">
      <header>
        <h1>Inbox (Tickets)</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setShowNewTicket(true)} className="btn-primary">
            + New Ticket
          </button>
          <a href="/mini-crm/" className="btn-secondary">
            Back to Contacts
          </a>
        </div>
      </header>

      {error && <div className="error">{error}</div>}

      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => {
            setPriorityFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>

        {(statusFilter || priorityFilter) && (
          <button
            onClick={() => {
              setStatusFilter('');
              setPriorityFilter('');
              setPage(1);
            }}
            className="btn-secondary"
          >
            Clear filters
          </button>
        )}
      </div>

      {loading && !selectedTicket && <div className="loading">Loading...</div>}

      <div style={{ display: 'grid', gridTemplateColumns: selectedTicket ? '1fr 1.5fr' : '1fr', gap: '20px' }}>
        {/* Ticket List */}
        <div>
          {!loading && tickets.length === 0 && (
            <div className="empty-state">No tickets found.</div>
          )}

          {tickets.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="contact-card"
                  style={{
                    cursor: 'pointer',
                    borderLeft: `4px solid ${priorityColors[ticket.priority]}`,
                    backgroundColor: selectedTicket?.id === ticket.id ? '#f0f8ff' : 'white',
                  }}
                  onClick={() => fetchTicketDetails(ticket.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1em' }}>{ticket.subject}</h3>
                    <span
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.85em',
                        backgroundColor: statusColors[ticket.status],
                        color: 'white',
                        fontWeight: 'bold',
                      }}
                    >
                      {formatStatus(ticket.status)}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.9em', color: '#666', margin: '8px 0' }}>
                    {ticket.description.substring(0, 100)}
                    {ticket.description.length > 100 ? '...' : ''}
                  </p>
                  <div style={{ display: 'flex', gap: '15px', fontSize: '0.85em', color: '#666' }}>
                    <span>
                      <strong>Priority:</strong>{' '}
                      <span style={{ color: priorityColors[ticket.priority], fontWeight: 'bold' }}>
                        {ticket.priority}
                      </span>
                    </span>
                    {ticket.contact && (
                      <span>
                        <strong>Contact:</strong> {ticket.contact.name}
                      </span>
                    )}
                    {ticket.assignedUser && (
                      <span>
                        <strong>Assigned:</strong> {ticket.assignedUser.email}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '15px', fontSize: '0.85em', color: '#666', marginTop: '8px' }}>
                    <span>💬 {ticket.commentCount} comments</span>
                    <span>📎 {ticket.attachmentCount} files</span>
                    <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="pagination" style={{ marginTop: '20px' }}>
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
        </div>

        {/* Ticket Details */}
        {selectedTicket && (
          <div className="contact-card">
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <h2 style={{ margin: 0 }}>{selectedTicket.subject}</h2>
                <button onClick={() => setSelectedTicket(null)} className="btn-secondary">
                  ✕
                </button>
              </div>

              <div style={{ marginTop: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <select
                  value={selectedTicket.status}
                  onChange={(e) => handleUpdateStatus(selectedTicket.id, e.target.value)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    backgroundColor: statusColors[selectedTicket.status],
                    color: 'white',
                    fontWeight: 'bold',
                  }}
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>

                <span
                  style={{
                    padding: '6px 12px',
                    borderRadius: '4px',
                    backgroundColor: priorityColors[selectedTicket.priority],
                    color: 'white',
                    fontWeight: 'bold',
                  }}
                >
                  {selectedTicket.priority} Priority
                </span>
              </div>

              <div style={{ marginTop: '15px' }}>
                <p style={{ whiteSpace: 'pre-wrap' }}>{selectedTicket.description}</p>
              </div>

              <div style={{ marginTop: '15px', fontSize: '0.9em', color: '#666' }}>
                <p>
                  <strong>Created by:</strong> {selectedTicket.user.email}
                </p>
                {selectedTicket.assignedUser && (
                  <p>
                    <strong>Assigned to:</strong> {selectedTicket.assignedUser.email}
                  </p>
                )}
                {selectedTicket.contact && (
                  <p>
                    <strong>Related to:</strong> {selectedTicket.contact.name}
                    {selectedTicket.contact.email && ` (${selectedTicket.contact.email})`}
                  </p>
                )}
                <p>
                  <strong>Created:</strong> {new Date(selectedTicket.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Attachments */}
            <div style={{ borderTop: '1px solid #ddd', paddingTop: '20px', marginBottom: '20px' }}>
              <h3>Attachments ({selectedTicket.attachments.length})</h3>
              <div style={{ marginTop: '10px' }}>
                <input
                  type="file"
                  id="file-upload"
                  onChange={handleFileUpload}
                  disabled={uploadingFile}
                  style={{ display: 'none' }}
                  accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                />
                <label htmlFor="file-upload" className="btn-secondary" style={{ cursor: 'pointer' }}>
                  {uploadingFile ? 'Uploading...' : '📎 Attach File'}
                </label>
              </div>
              {selectedTicket.attachments.length > 0 && (
                <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedTicket.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px',
                        backgroundColor: '#f5f5f5',
                        borderRadius: '4px',
                      }}
                    >
                      <span style={{ fontSize: '0.9em' }}>
                        📄 {attachment.filename} ({Math.round(attachment.filesize / 1024)} KB)
                      </span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() =>
                            handleDownloadAttachment(selectedTicket.id, attachment.id, attachment.filename)
                          }
                          className="btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.85em' }}
                        >
                          Download
                        </button>
                        <button
                          onClick={() => handleDeleteAttachment(selectedTicket.id, attachment.id)}
                          className="btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.85em', backgroundColor: '#dc3545', color: 'white' }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Comments */}
            <div style={{ borderTop: '1px solid #ddd', paddingTop: '20px' }}>
              <h3>Comments ({selectedTicket.comments.length})</h3>
              <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {selectedTicket.comments.map((comment) => (
                  <div
                    key={comment.id}
                    style={{
                      padding: '12px',
                      backgroundColor: '#f9f9f9',
                      borderRadius: '6px',
                      borderLeft: '3px solid #007bff',
                    }}
                  >
                    <div style={{ fontSize: '0.85em', color: '#666', marginBottom: '8px' }}>
                      <strong>{comment.user.email}</strong> •{' '}
                      {new Date(comment.createdAt).toLocaleString()}
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{comment.content}</div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddComment} style={{ marginTop: '20px' }}>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={3}
                  style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
                  required
                />
                <button type="submit" disabled={commentLoading} className="btn-primary">
                  {commentLoading ? 'Adding...' : 'Add Comment'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* New Ticket Modal */}
      {showNewTicket && (
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
          onClick={() => setShowNewTicket(false)}
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
            <h2>New Ticket</h2>
            <form onSubmit={handleCreateTicket}>
              <label>
                Subject
                <input
                  type="text"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  required
                />
              </label>
              <label>
                Description
                <textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  rows={5}
                  required
                />
              </label>
              <label>
                Priority
                <select
                  value={newTicket.priority}
                  onChange={(e) =>
                    setNewTicket({ ...newTicket, priority: e.target.value as any })
                  }
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </label>
              <label>
                Assign to
                <select
                  value={newTicket.assignedTo}
                  onChange={(e) => setNewTicket({ ...newTicket, assignedTo: e.target.value })}
                >
                  <option value="">No assignment</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.email}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Related contact
                <select
                  value={newTicket.contactId}
                  onChange={(e) => setNewTicket({ ...newTicket, contactId: e.target.value })}
                >
                  <option value="">No contact</option>
                  {contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => setShowNewTicket(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? 'Creating...' : 'Create Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
