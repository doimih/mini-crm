import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { api } from '../services/api';
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
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedLog, setSelectedLog] = useState(null);
    const fetchLogs = async () => {
        setLoading(true);
        setError('');
        try {
            const params = {
                page,
                limit: 50,
            };
            if (statusFilter) {
                params.status = statusFilter;
            }
            const response = await api.get('/email-logs', { params });
            setLogs(response.data.logs || []);
            setTotalPages(response.data.pagination?.totalPages || 1);
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to load email logs');
        }
        finally {
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
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to clear logs');
        }
    };
    const handleDeleteLog = async (id) => {
        if (!confirm('Are you sure you want to delete this log?')) {
            return;
        }
        try {
            await api.delete(`/email-logs/${id}`);
            await fetchLogs();
            setSelectedLog(null);
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to delete log');
        }
    };
    return (_jsxs("div", { className: "tag-manager admin-logs", children: [_jsxs("div", { className: "admin-logs-header", children: [_jsx("h3", { children: "Email Logs" }), _jsxs("div", { className: "admin-logs-filters", style: { display: 'flex', gap: '10px', alignItems: 'center' }, children: [_jsxs("select", { value: statusFilter, onChange: (e) => {
                                    setStatusFilter(e.target.value);
                                    setPage(1);
                                }, children: [_jsx("option", { value: "", children: "All statuses" }), _jsx("option", { value: "PENDING", children: "Pending" }), _jsx("option", { value: "SENT", children: "Sent" }), _jsx("option", { value: "FAILED", children: "Failed" })] }), _jsx("button", { onClick: handleClearLogs, className: "btn-secondary", children: "Clear all logs" })] })] }), error && _jsx("div", { className: "error", children: error }), loading && _jsx("div", { className: "loading", children: "Loading..." }), !loading && logs.length === 0 && (_jsx("div", { className: "empty-state", children: "No email logs found." })), !loading && logs.length > 0 && (_jsxs(_Fragment, { children: [_jsxs("table", { className: "audit-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Date & time" }), _jsx("th", { children: "Status" }), _jsx("th", { children: "Recipient" }), _jsx("th", { children: "Subject" }), _jsx("th", { children: "Sent by" }), _jsx("th", { children: "Actions" })] }) }), _jsx("tbody", { children: logs.map((log) => (_jsxs("tr", { onClick: () => setSelectedLog(log), style: { cursor: 'pointer' }, children: [_jsx("td", { children: new Date(log.createdAt).toLocaleString() }), _jsx("td", { children: _jsxs("span", { style: {
                                                    color: statusColors[log.status],
                                                    fontWeight: 'bold',
                                                }, children: [statusIcons[log.status], " ", log.status] }) }), _jsx("td", { children: log.recipient }), _jsx("td", { children: log.subject }), _jsx("td", { children: log.user?.email || '-' }), _jsx("td", { children: _jsx("button", { onClick: (e) => {
                                                    e.stopPropagation();
                                                    handleDeleteLog(log.id);
                                                }, className: "btn-secondary", style: { padding: '4px 8px', fontSize: '0.9em' }, children: "Delete" }) })] }, log.id))) })] }), totalPages > 1 && (_jsxs("div", { className: "pagination", children: [_jsx("button", { onClick: () => setPage((p) => Math.max(1, p - 1)), disabled: page === 1, children: "Previous" }), _jsxs("span", { children: ["Page ", page, " of ", totalPages] }), _jsx("button", { onClick: () => setPage((p) => Math.min(totalPages, p + 1)), disabled: page === totalPages, children: "Next" })] }))] })), selectedLog && (_jsx("div", { style: {
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
                }, onClick: () => setSelectedLog(null), children: _jsxs("div", { style: {
                        backgroundColor: 'white',
                        padding: '30px',
                        borderRadius: '8px',
                        maxWidth: '600px',
                        width: '90%',
                        maxHeight: '80vh',
                        overflow: 'auto',
                    }, onClick: (e) => e.stopPropagation(), children: [_jsx("h3", { children: "Email Log Details" }), _jsxs("div", { style: { marginTop: '20px' }, children: [_jsxs("p", { children: [_jsx("strong", { children: "Status:" }), ' ', _jsxs("span", { style: { color: statusColors[selectedLog.status] }, children: [statusIcons[selectedLog.status], " ", selectedLog.status] })] }), _jsxs("p", { children: [_jsx("strong", { children: "Recipient:" }), " ", selectedLog.recipient] }), _jsxs("p", { children: [_jsx("strong", { children: "Subject:" }), " ", selectedLog.subject] }), _jsxs("p", { children: [_jsx("strong", { children: "Sent by:" }), " ", selectedLog.user?.email || 'System'] }), _jsxs("p", { children: [_jsx("strong", { children: "Created:" }), " ", new Date(selectedLog.createdAt).toLocaleString()] }), selectedLog.sentAt && (_jsxs("p", { children: [_jsx("strong", { children: "Sent:" }), " ", new Date(selectedLog.sentAt).toLocaleString()] })), selectedLog.errorMessage && (_jsxs("p", { children: [_jsx("strong", { children: "Error:" }), ' ', _jsx("span", { style: { color: '#dc3545' }, children: selectedLog.errorMessage })] }))] }), _jsxs("div", { style: { marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }, children: [_jsx("button", { onClick: () => setSelectedLog(null), className: "btn-secondary", children: "Close" }), _jsx("button", { onClick: () => handleDeleteLog(selectedLog.id), className: "btn-secondary", style: { backgroundColor: '#dc3545', color: 'white' }, children: "Delete" })] })] }) }))] }));
}
