import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { api } from '../services/api';
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
const getActionColor = (action) => {
    if (action.includes('CREATE'))
        return '#28a745';
    if (action.includes('UPDATE'))
        return '#ffc107';
    if (action.includes('DELETE'))
        return '#dc3545';
    if (action.includes('LOGIN'))
        return '#17a2b8';
    if (action.includes('LOGOUT'))
        return '#6c757d';
    if (action.includes('FAILED'))
        return '#dc3545';
    return '#007bff';
};
const getActionIcon = (action) => {
    if (action.includes('CREATE'))
        return '✓';
    if (action.includes('UPDATE'))
        return '✎';
    if (action.includes('DELETE'))
        return '✗';
    if (action.includes('LOGIN'))
        return '→';
    if (action.includes('LOGOUT'))
        return '←';
    if (action.includes('FAILED'))
        return '!';
    return '•';
};
export default function AuditLogViewer() {
    const [logs, setLogs] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalLogs, setTotalLogs] = useState(0);
    const [userFilter, setUserFilter] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [entityFilter, setEntityFilter] = useState('');
    const [selectedLog, setSelectedLog] = useState(null);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const fetchUsers = async () => {
        try {
            const response = await api.get('/users');
            setUsers(response.data || []);
        }
        catch (err) {
            console.error('Failed to load users:', err);
        }
    };
    const fetchLogs = async () => {
        setLoading(true);
        setError('');
        try {
            const params = {
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
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to load audit logs');
        }
        finally {
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
            if (logDate < fromDate)
                return false;
        }
        if (dateTo) {
            const logDate = new Date(log.createdAt);
            const toDate = new Date(dateTo);
            toDate.setHours(23, 59, 59, 999);
            if (logDate > toDate)
                return false;
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
            ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
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
    const actionTypes = Array.from(new Set(logs.map((log) => log.action).filter(Boolean))).sort();
    const entityTypes = Array.from(new Set(logs.map((log) => log.entity).filter((e) => Boolean(e)))).sort();
    return (_jsxs("div", { className: "container", children: [_jsxs("header", { children: [_jsx("h1", { children: "User Activity Log" }), _jsxs("div", { style: { display: 'flex', gap: '10px' }, children: [_jsx("a", { href: "/mini-crm/", className: "btn-secondary", children: "Back to Contacts" }), _jsx("a", { href: "/mini-crm/admin", className: "btn-secondary", children: "Admin Panel" })] })] }), error && _jsx("div", { className: "error", children: error }), _jsxs("div", { className: "tag-manager admin-logs", children: [_jsxs("div", { className: "admin-logs-header", style: { flexDirection: 'column', gap: '15px' }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }, children: [_jsxs("h3", { children: ["Activity Logs", totalLogs > 0 && _jsxs("span", { style: { fontSize: '0.9em', color: '#666', marginLeft: '10px' }, children: ["(", filteredLogs.length, " of ", totalLogs, " total)"] })] }), _jsx("button", { onClick: exportToCSV, className: "btn-secondary", disabled: filteredLogs.length === 0, children: "Export to CSV" })] }), _jsxs("div", { className: "admin-logs-filters", style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', width: '100%' }, children: [_jsxs("select", { value: userFilter, onChange: (e) => {
                                            setUserFilter(e.target.value);
                                            setPage(1);
                                        }, children: [_jsx("option", { value: "", children: "All users" }), users.map((user) => (_jsx("option", { value: user.id, children: user.email }, user.id)))] }), _jsxs("select", { value: actionFilter, onChange: (e) => {
                                            setActionFilter(e.target.value);
                                            setPage(1);
                                        }, children: [_jsx("option", { value: "", children: "All actions" }), actionTypes.map((action) => (_jsx("option", { value: action, children: formatAuditAction(action) }, action)))] }), _jsxs("select", { value: entityFilter, onChange: (e) => {
                                            setEntityFilter(e.target.value);
                                            setPage(1);
                                        }, children: [_jsx("option", { value: "", children: "All entities" }), entityTypes.map((entity) => (_jsx("option", { value: entity, children: entity }, entity)))] }), _jsx("input", { type: "date", value: dateFrom, onChange: (e) => setDateFrom(e.target.value), placeholder: "From date" }), _jsx("input", { type: "date", value: dateTo, onChange: (e) => setDateTo(e.target.value), placeholder: "To date" }), (userFilter || actionFilter || entityFilter || dateFrom || dateTo) && (_jsx("button", { onClick: () => {
                                            setUserFilter('');
                                            setActionFilter('');
                                            setEntityFilter('');
                                            setDateFrom('');
                                            setDateTo('');
                                            setPage(1);
                                        }, className: "btn-secondary", children: "Clear filters" }))] })] }), loading && _jsx("div", { className: "loading", children: "Loading..." }), !loading && filteredLogs.length === 0 && (_jsx("div", { className: "empty-state", children: "No audit logs found." })), !loading && filteredLogs.length > 0 && (_jsxs(_Fragment, { children: [_jsx("div", { style: { overflowX: 'auto' }, children: _jsxs("table", { className: "audit-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { style: { minWidth: '180px' }, children: "Date & time" }), _jsx("th", { style: { minWidth: '200px' }, children: "User" }), _jsx("th", { style: { minWidth: '200px' }, children: "Action" }), _jsx("th", { children: "Entity" }), _jsx("th", { children: "Entity ID" }), _jsx("th", { style: { minWidth: '250px' }, children: "Details" })] }) }), _jsx("tbody", { children: filteredLogs.map((log) => (_jsxs("tr", { onClick: () => setSelectedLog(log), style: { cursor: 'pointer' }, children: [_jsx("td", { children: new Date(log.createdAt).toLocaleString() }), _jsx("td", { children: log.user.email }), _jsx("td", { children: _jsxs("span", { style: {
                                                                color: getActionColor(log.action),
                                                                fontWeight: 'bold',
                                                            }, children: [getActionIcon(log.action), " ", formatAuditAction(log.action)] }) }), _jsx("td", { children: log.entity || '-' }), _jsx("td", { children: log.entityId || '-' }), _jsx("td", { style: { maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, children: formatAuditDetails(log.details) })] }, log.id))) })] }) }), totalPages > 1 && (_jsxs("div", { className: "pagination", children: [_jsx("button", { onClick: () => setPage((p) => Math.max(1, p - 1)), disabled: page === 1, children: "Previous" }), _jsxs("span", { children: ["Page ", page, " of ", totalPages] }), _jsx("button", { onClick: () => setPage((p) => Math.min(totalPages, p + 1)), disabled: page === totalPages, children: "Next" })] }))] }))] }), selectedLog && (_jsx("div", { style: {
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
                    }, onClick: (e) => e.stopPropagation(), children: [_jsx("h3", { children: "Audit Log Details" }), _jsxs("div", { style: { marginTop: '20px' }, children: [_jsxs("p", { children: [_jsx("strong", { children: "Action:" }), ' ', _jsxs("span", { style: { color: getActionColor(selectedLog.action) }, children: [getActionIcon(selectedLog.action), " ", formatAuditAction(selectedLog.action)] })] }), _jsxs("p", { children: [_jsx("strong", { children: "User:" }), " ", selectedLog.user.email] }), _jsxs("p", { children: [_jsx("strong", { children: "Entity:" }), " ", selectedLog.entity || '-'] }), _jsxs("p", { children: [_jsx("strong", { children: "Entity ID:" }), " ", selectedLog.entityId || '-'] }), _jsxs("p", { children: [_jsx("strong", { children: "Date & Time:" }), " ", new Date(selectedLog.createdAt).toLocaleString()] }), selectedLog.details && Object.keys(selectedLog.details).length > 0 && (_jsxs(_Fragment, { children: [_jsx("p", { children: _jsx("strong", { children: "Details:" }) }), _jsx("div", { style: {
                                                backgroundColor: '#f5f5f5',
                                                padding: '15px',
                                                borderRadius: '4px',
                                                maxHeight: '300px',
                                                overflow: 'auto',
                                            }, children: _jsx("pre", { style: { margin: 0, fontSize: '0.9em' }, children: JSON.stringify(selectedLog.details, null, 2) }) })] }))] }), _jsx("div", { style: { marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }, children: _jsx("button", { onClick: () => setSelectedLog(null), className: "btn-primary", children: "Close" }) })] }) }))] }));
}
