import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
const statusColors = {
    OPEN: '#1e88e5',
    IN_PROGRESS: '#42a5f5',
    RESOLVED: '#1565c0',
    CLOSED: '#90caf9',
};
const priorityColors = {
    LOW: '#90caf9',
    MEDIUM: '#42a5f5',
    HIGH: '#1e88e5',
    URGENT: '#0d47a1',
};
const formatStatus = (status) => {
    return status.replace(/_/g, ' ');
};
export default function Inbox() {
    const [tickets, setTickets] = useState([]);
    const [users, setUsers] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
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
        priority: 'MEDIUM',
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
    // Auto-refresh ticket details when selected (polling every 5 seconds)
    useEffect(() => {
        if (!selectedTicket)
            return;
        const intervalId = setInterval(() => {
            fetchTicketDetails(selectedTicket.id);
        }, 5000); // Refresh every 5 seconds
        return () => clearInterval(intervalId);
    }, [selectedTicket?.id]);
    const fetchTickets = async () => {
        setLoading(true);
        setError('');
        try {
            const params = {
                page,
                limit: 20,
            };
            if (statusFilter)
                params.status = statusFilter;
            if (priorityFilter)
                params.priority = priorityFilter;
            const response = await api.get('/tickets', { params });
            setTickets(response.data.tickets || []);
            setTotalPages(response.data.pagination?.totalPages || 1);
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to load tickets');
        }
        finally {
            setLoading(false);
        }
    };
    const fetchUsers = async () => {
        try {
            const response = await api.get('/users');
            setUsers(response.data || []);
        }
        catch (err) {
            console.error('Failed to load users');
        }
    };
    const fetchContacts = async () => {
        try {
            const response = await api.get('/contacts', { params: { limit: 1000 } });
            setContacts(response.data.contacts || []);
        }
        catch (err) {
            console.error('Failed to load contacts');
        }
    };
    const fetchTicketDetails = async (id) => {
        try {
            const response = await api.get(`/tickets/${id}`);
            setSelectedTicket(response.data);
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to load ticket details');
        }
    };
    const handleCreateTicket = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const payload = {
                subject: newTicket.subject,
                description: newTicket.description,
                priority: newTicket.priority,
            };
            if (newTicket.assignedTo) {
                payload.assignedTo = parseInt(newTicket.assignedTo);
            }
            if (newTicket.contactId) {
                payload.contactId = parseInt(newTicket.contactId);
            }
            await api.post('/tickets', payload);
            setShowNewTicket(false);
            setNewTicket({
                subject: '',
                description: '',
                priority: 'MEDIUM',
                assignedTo: '',
                contactId: '',
            });
            fetchTickets();
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to create ticket');
        }
        finally {
            setLoading(false);
        }
    };
    const handleUpdateStatus = async (id, status) => {
        try {
            await api.put(`/tickets/${id}`, { status });
            fetchTickets();
            if (selectedTicket?.id === id) {
                fetchTicketDetails(id);
            }
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to update ticket');
        }
    };
    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!selectedTicket || !newComment.trim())
            return;
        setCommentLoading(true);
        setError('');
        try {
            await api.post(`/tickets/${selectedTicket.id}/comments`, {
                content: newComment,
            });
            setNewComment('');
            fetchTicketDetails(selectedTicket.id);
            fetchTickets();
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to add comment');
        }
        finally {
            setCommentLoading(false);
        }
    };
    const handleFileUpload = async (e) => {
        if (!selectedTicket || !e.target.files || e.target.files.length === 0)
            return;
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
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to upload file');
        }
        finally {
            setUploadingFile(false);
            e.target.value = '';
        }
    };
    const handleDownloadAttachment = async (ticketId, attachmentId, filename) => {
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
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to download file');
        }
    };
    const handleDeleteAttachment = async (ticketId, attachmentId) => {
        if (!confirm('Are you sure you want to delete this attachment?'))
            return;
        try {
            await api.delete(`/tickets/${ticketId}/attachments/${attachmentId}`);
            fetchTicketDetails(ticketId);
            fetchTickets();
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to delete attachment');
        }
    };
    return (_jsxs("div", { className: "container", children: [_jsxs("header", { children: [_jsx("h1", { children: "Inbox (Tickets)" }), _jsxs("div", { style: { display: 'flex', gap: '10px' }, children: [_jsx("button", { onClick: () => setShowNewTicket(true), className: "btn-primary", children: "+ New Ticket" }), _jsx(Link, { to: "/", children: _jsx("button", { className: "btn-secondary", children: "Back to Contacts" }) })] })] }), error && _jsx("div", { className: "error", children: error }), _jsxs("div", { style: { display: 'flex', gap: '15px', marginBottom: '20px' }, children: [_jsxs("select", { value: statusFilter, onChange: (e) => {
                            setStatusFilter(e.target.value);
                            setPage(1);
                        }, children: [_jsx("option", { value: "", children: "All statuses" }), _jsx("option", { value: "OPEN", children: "Open" }), _jsx("option", { value: "IN_PROGRESS", children: "In Progress" }), _jsx("option", { value: "RESOLVED", children: "Resolved" }), _jsx("option", { value: "CLOSED", children: "Closed" })] }), _jsxs("select", { value: priorityFilter, onChange: (e) => {
                            setPriorityFilter(e.target.value);
                            setPage(1);
                        }, children: [_jsx("option", { value: "", children: "All priorities" }), _jsx("option", { value: "LOW", children: "Low" }), _jsx("option", { value: "MEDIUM", children: "Medium" }), _jsx("option", { value: "HIGH", children: "High" }), _jsx("option", { value: "URGENT", children: "Urgent" })] }), (statusFilter || priorityFilter) && (_jsx("button", { onClick: () => {
                            setStatusFilter('');
                            setPriorityFilter('');
                            setPage(1);
                        }, className: "btn-secondary", children: "Clear filters" }))] }), loading && _jsx("div", { className: "loading", children: "Loading..." }), _jsxs("div", { children: [!loading && tickets.length === 0 && (_jsx("div", { className: "empty-state", children: "No tickets found." })), tickets.length > 0 && (_jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: '10px' }, children: tickets.map((ticket) => (_jsxs("div", { className: "contact-card", style: {
                                cursor: 'pointer',
                                borderLeft: `4px solid ${priorityColors[ticket.priority]}`,
                            }, onClick: () => fetchTicketDetails(ticket.id), children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'start' }, children: [_jsx("h3", { style: { margin: 0, fontSize: '1.1em' }, children: ticket.subject }), _jsx("span", { style: {
                                                padding: '6px 14px',
                                                borderRadius: '6px',
                                                fontSize: '0.85em',
                                                background: `linear-gradient(135deg, ${statusColors[ticket.status]} 0%, ${statusColors[ticket.status]}dd 100%)`,
                                                color: 'white',
                                                fontWeight: '600',
                                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                                            }, children: formatStatus(ticket.status) })] }), _jsxs("p", { style: { fontSize: '0.9em', color: '#666', margin: '8px 0' }, children: [ticket.description.substring(0, 100), ticket.description.length > 100 ? '...' : ''] }), _jsxs("div", { style: { display: 'flex', gap: '15px', fontSize: '0.85em', color: '#666' }, children: [_jsxs("span", { children: [_jsx("strong", { children: "Priority:" }), ' ', _jsx("span", { style: { color: priorityColors[ticket.priority], fontWeight: 'bold' }, children: ticket.priority })] }), ticket.contact && (_jsxs("span", { children: [_jsx("strong", { children: "Contact:" }), " ", ticket.contact.name] })), ticket.assignedUser && (_jsxs("span", { children: [_jsx("strong", { children: "Assigned:" }), " ", ticket.assignedUser.email] }))] }), _jsxs("div", { style: { display: 'flex', gap: '15px', fontSize: '0.85em', color: '#666', marginTop: '8px' }, children: [_jsxs("span", { children: ["\uD83D\uDCAC ", ticket.commentCount, " comments"] }), _jsxs("span", { children: ["\uD83D\uDCCE ", ticket.attachmentCount, " files"] }), _jsx("span", { children: new Date(ticket.createdAt).toLocaleDateString() })] })] }, ticket.id))) })), totalPages > 1 && (_jsxs("div", { className: "pagination", style: { marginTop: '20px' }, children: [_jsx("button", { onClick: () => setPage((p) => Math.max(1, p - 1)), disabled: page === 1, children: "Previous" }), _jsxs("span", { children: ["Page ", page, " of ", totalPages] }), _jsx("button", { onClick: () => setPage((p) => Math.min(totalPages, p + 1)), disabled: page === totalPages, children: "Next" })] }))] }), selectedTicket && (_jsx("div", { style: {
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
                    padding: '20px',
                }, onClick: () => setSelectedTicket(null), children: _jsxs("div", { className: "contact-card", style: {
                        maxWidth: '800px',
                        width: '100%',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        margin: 0,
                    }, onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { style: { marginBottom: '20px' }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '10px' }, children: [_jsx("h2", { style: { margin: 0 }, children: selectedTicket.subject }), _jsxs("div", { style: { display: 'flex', gap: '8px' }, children: [_jsx("button", { onClick: () => fetchTicketDetails(selectedTicket.id), className: "btn-secondary", title: "Refresh", children: "\uD83D\uDD04" }), _jsx("button", { onClick: () => setSelectedTicket(null), className: "btn-secondary", children: "\u2715 Close" })] })] }), _jsxs("div", { style: { marginTop: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }, children: [_jsxs("select", { value: selectedTicket.status, onChange: (e) => handleUpdateStatus(selectedTicket.id, e.target.value), style: {
                                                padding: '8px 16px',
                                                borderRadius: '6px',
                                                border: 'none',
                                                background: `linear-gradient(135deg, ${statusColors[selectedTicket.status]} 0%, ${statusColors[selectedTicket.status]}dd 100%)`,
                                                color: 'white',
                                                fontWeight: '600',
                                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                                                cursor: 'pointer',
                                                fontSize: '14px'
                                            }, children: [_jsx("option", { value: "OPEN", children: "Open" }), _jsx("option", { value: "IN_PROGRESS", children: "In Progress" }), _jsx("option", { value: "RESOLVED", children: "Resolved" }), _jsx("option", { value: "CLOSED", children: "Closed" })] }), _jsxs("span", { style: {
                                                padding: '8px 16px',
                                                borderRadius: '6px',
                                                background: `linear-gradient(135deg, ${priorityColors[selectedTicket.priority]} 0%, ${priorityColors[selectedTicket.priority]}dd 100%)`,
                                                color: 'white',
                                                fontWeight: '600',
                                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                                                fontSize: '14px'
                                            }, children: [selectedTicket.priority, " Priority"] })] }), _jsx("div", { style: { marginTop: '15px' }, children: _jsx("p", { style: { whiteSpace: 'pre-wrap' }, children: selectedTicket.description }) }), _jsxs("div", { style: { marginTop: '15px', fontSize: '0.9em', color: '#666' }, children: [_jsxs("p", { children: [_jsx("strong", { children: "Created by:" }), " ", selectedTicket.user.email] }), selectedTicket.assignedUser && (_jsxs("p", { children: [_jsx("strong", { children: "Assigned to:" }), " ", selectedTicket.assignedUser.email] })), selectedTicket.contact && (_jsxs("p", { children: [_jsx("strong", { children: "Related to:" }), " ", selectedTicket.contact.name, selectedTicket.contact.email && ` (${selectedTicket.contact.email})`] })), _jsxs("p", { children: [_jsx("strong", { children: "Created:" }), " ", new Date(selectedTicket.createdAt).toLocaleString()] })] })] }), _jsxs("div", { style: { borderTop: '1px solid #ddd', paddingTop: '20px', marginBottom: '20px' }, children: [_jsxs("h3", { children: ["Attachments (", selectedTicket.attachments.length, ")"] }), _jsxs("div", { style: { marginTop: '10px' }, children: [_jsx("input", { type: "file", id: "file-upload", onChange: handleFileUpload, disabled: uploadingFile, style: { display: 'none' }, accept: ".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.txt" }), _jsx("label", { htmlFor: "file-upload", style: {
                                                padding: '10px 20px',
                                                borderRadius: '6px',
                                                background: 'linear-gradient(135deg, #42a5f5 0%, #2196f3 100%)',
                                                color: 'white',
                                                fontWeight: '500',
                                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                                                cursor: 'pointer',
                                                display: 'inline-block',
                                                transition: 'all 0.2s ease',
                                                border: 'none'
                                            }, children: uploadingFile ? 'Uploading...' : '📎 Attach File' })] }), selectedTicket.attachments.length > 0 && (_jsx("div", { style: { marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '8px' }, children: selectedTicket.attachments.map((attachment) => (_jsxs("div", { style: {
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '8px',
                                            backgroundColor: '#f5f5f5',
                                            borderRadius: '4px',
                                        }, children: [_jsxs("span", { style: { fontSize: '0.9em' }, children: ["\uD83D\uDCC4 ", attachment.filename, " (", Math.round(attachment.filesize / 1024), " KB)"] }), _jsxs("div", { style: { display: 'flex', gap: '8px' }, children: [_jsx("button", { onClick: () => handleDownloadAttachment(selectedTicket.id, attachment.id, attachment.filename), style: {
                                                            padding: '6px 12px',
                                                            fontSize: '0.85em',
                                                            background: 'linear-gradient(135deg, #42a5f5 0%, #2196f3 100%)',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            fontWeight: '500',
                                                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                                                            transition: 'all 0.2s ease'
                                                        }, children: "Download" }), _jsx("button", { onClick: () => handleDeleteAttachment(selectedTicket.id, attachment.id), style: {
                                                            padding: '6px 12px',
                                                            fontSize: '0.85em',
                                                            background: 'linear-gradient(135deg, #ef5350 0%, #e53935 100%)',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            fontWeight: '500',
                                                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                                                            transition: 'all 0.2s ease'
                                                        }, children: "Delete" })] })] }, attachment.id))) }))] }), _jsxs("div", { style: { borderTop: '1px solid #ddd', paddingTop: '20px' }, children: [_jsxs("h3", { children: ["Comments (", selectedTicket.comments.length, ")"] }), _jsx("div", { style: { marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '15px' }, children: selectedTicket.comments.map((comment) => (_jsxs("div", { style: {
                                            padding: '12px',
                                            backgroundColor: '#f9f9f9',
                                            borderRadius: '6px',
                                            borderLeft: '3px solid #1e88e5',
                                        }, children: [_jsxs("div", { style: { fontSize: '0.85em', color: '#666', marginBottom: '8px' }, children: [_jsx("strong", { children: comment.user.email }), " \u2022", ' ', new Date(comment.createdAt).toLocaleString()] }), _jsx("div", { style: { whiteSpace: 'pre-wrap' }, children: comment.content })] }, comment.id))) }), _jsxs("form", { onSubmit: handleAddComment, style: { marginTop: '20px' }, children: [_jsx("textarea", { value: newComment, onChange: (e) => setNewComment(e.target.value), placeholder: "Add a comment...", rows: 3, style: { width: '100%', padding: '10px', marginBottom: '10px' }, required: true }), _jsx("button", { type: "submit", disabled: commentLoading, className: "btn-primary", children: commentLoading ? 'Adding...' : 'Add Comment' })] })] })] }) })), showNewTicket && (_jsx("div", { style: {
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
                }, onClick: () => setShowNewTicket(false), children: _jsxs("div", { style: {
                        backgroundColor: 'white',
                        padding: '30px',
                        borderRadius: '8px',
                        maxWidth: '600px',
                        width: '90%',
                        maxHeight: '80vh',
                        overflow: 'auto',
                    }, onClick: (e) => e.stopPropagation(), children: [_jsx("h2", { children: "New Ticket" }), _jsxs("form", { onSubmit: handleCreateTicket, children: [_jsxs("label", { children: ["Subject", _jsx("input", { type: "text", value: newTicket.subject, onChange: (e) => setNewTicket({ ...newTicket, subject: e.target.value }), required: true })] }), _jsxs("label", { children: ["Description", _jsx("textarea", { value: newTicket.description, onChange: (e) => setNewTicket({ ...newTicket, description: e.target.value }), rows: 5, required: true })] }), _jsxs("label", { children: ["Priority", _jsxs("select", { value: newTicket.priority, onChange: (e) => setNewTicket({ ...newTicket, priority: e.target.value }), children: [_jsx("option", { value: "LOW", children: "Low" }), _jsx("option", { value: "MEDIUM", children: "Medium" }), _jsx("option", { value: "HIGH", children: "High" }), _jsx("option", { value: "URGENT", children: "Urgent" })] })] }), _jsxs("label", { children: ["Assign to", _jsxs("select", { value: newTicket.assignedTo, onChange: (e) => setNewTicket({ ...newTicket, assignedTo: e.target.value }), children: [_jsx("option", { value: "", children: "No assignment" }), users.map((user) => (_jsx("option", { value: user.id, children: user.email }, user.id)))] })] }), _jsxs("label", { children: ["Related contact", _jsxs("select", { value: newTicket.contactId, onChange: (e) => setNewTicket({ ...newTicket, contactId: e.target.value }), children: [_jsx("option", { value: "", children: "No contact" }), contacts.map((contact) => (_jsx("option", { value: contact.id, children: contact.name }, contact.id)))] })] }), _jsxs("div", { className: "form-actions", children: [_jsx("button", { type: "button", onClick: () => setShowNewTicket(false), className: "btn-secondary", children: "Cancel" }), _jsx("button", { type: "submit", disabled: loading, className: "btn-primary", children: loading ? 'Creating...' : 'Create Ticket' })] })] })] }) }))] }));
}
