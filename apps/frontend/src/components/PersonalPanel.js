import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import i18n, { loadTranslations } from '../i18n';
const startOfDay = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
};
const endOfDay = (date) => {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
};
const startOfWeek = (date) => {
    const d = startOfDay(date);
    const day = d.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    d.setDate(d.getDate() + diff);
    return d;
};
const addDays = (date, days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
};
const toDateKey = (value) => {
    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
};
const formatDateTimeInput = (value) => {
    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');
    const hours = `${value.getHours()}`.padStart(2, '0');
    const minutes = `${value.getMinutes()}`.padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
};
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
export default function PersonalPanel() {
    const [events, setEvents] = useState([]);
    const [view, setView] = useState('month');
    const [anchorDate, setAnchorDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showEventModal, setShowEventModal] = useState(false);
    const [profile, setProfile] = useState(null);
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileMessage, setProfileMessage] = useState('');
    const [auditLogs, setAuditLogs] = useState([]);
    const [title, setTitle] = useState('');
    const [type, setType] = useState('TASK');
    const [notes, setNotes] = useState('');
    const [allDay, setAllDay] = useState(false);
    const [startAt, setStartAt] = useState(formatDateTimeInput(new Date()));
    const [endAt, setEndAt] = useState(formatDateTimeInput(addDays(new Date(), 0)));
    const [resendLoading, setResendLoading] = useState(false);
    const fetchProfile = async () => {
        try {
            const response = await api.get('/profile/me');
            setProfile(response.data);
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to load profile');
        }
    };
    const fetchMyLogs = async () => {
        try {
            const response = await api.get('/profile/me/audit-logs');
            setAuditLogs(response.data || []);
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to load activity');
        }
    };
    const range = useMemo(() => {
        if (view === 'week') {
            const start = startOfWeek(anchorDate);
            const end = endOfDay(addDays(start, 6));
            return { start, end };
        }
        const monthStart = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
        const gridStart = startOfWeek(monthStart);
        const gridEnd = endOfDay(addDays(gridStart, 41));
        return { start: gridStart, end: gridEnd };
    }, [anchorDate, view]);
    const fetchEvents = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await api.get('/calendar', {
                params: {
                    start: range.start.toISOString(),
                    end: range.end.toISOString(),
                },
            });
            setEvents(response.data || []);
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to load events');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchEvents();
    }, [range.start, range.end]);
    useEffect(() => {
        fetchProfile();
        fetchMyLogs();
    }, []);
    useEffect(() => {
        const nextStart = new Date(selectedDate);
        const nextEnd = addDays(nextStart, 0);
        setStartAt(formatDateTimeInput(nextStart));
        setEndAt(formatDateTimeInput(nextEnd));
    }, [selectedDate]);
    const days = useMemo(() => {
        const list = [];
        const count = view === 'week' ? 7 : 42;
        for (let i = 0; i < count; i += 1) {
            list.push(addDays(range.start, i));
        }
        return list;
    }, [range.start, view]);
    const eventsByDay = useMemo(() => {
        const map = {};
        for (const event of events) {
            const key = toDateKey(new Date(event.startAt));
            map[key] = map[key] || [];
            map[key].push(event);
        }
        return map;
    }, [events]);
    const handleCreate = async () => {
        setError('');
        try {
            const payload = {
                title: title.trim(),
                type,
                notes: notes.trim() || undefined,
                startAt: new Date(startAt).toISOString(),
                endAt: new Date(endAt).toISOString(),
                allDay,
            };
            await api.post('/calendar', payload);
            setTitle('');
            setNotes('');
            setShowEventModal(false);
            fetchEvents();
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to create event');
        }
    };
    const handleDelete = async (id) => {
        if (!confirm('Delete this event?'))
            return;
        try {
            await api.delete(`/calendar/${id}`);
            fetchEvents();
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to delete event');
        }
    };
    const handleExport = async () => {
        try {
            const response = await api.get('/calendar/export', {
                params: {
                    start: range.start.toISOString(),
                    end: range.end.toISOString(),
                },
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'calendar.ics');
            document.body.appendChild(link);
            link.click();
            link.remove();
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to export ICS');
        }
    };
    const handleAvatarChange = async (file) => {
        if (!file)
            return;
        const image = new Image();
        const reader = new FileReader();
        reader.onload = () => {
            image.onload = () => {
                if (image.width > 100 || image.height > 100) {
                    setError('Avatar must be максимум 100x100 px.');
                    return;
                }
                setProfile((prev) => prev ? { ...prev, avatarUrl: reader.result } : prev);
            };
            if (typeof reader.result === 'string') {
                image.src = reader.result;
            }
        };
        reader.readAsDataURL(file);
    };
    const handleSaveProfile = async () => {
        if (!profile)
            return;
        setProfileSaving(true);
        setProfileMessage('');
        setError('');
        try {
            const payload = {
                phone: profile.phone || '',
                avatarUrl: profile.avatarUrl || null,
                notificationPreference: profile.notificationPreference,
                timezone: profile.timezone || 'UTC',
                language: profile.language || 'en',
            };
            const response = await api.put('/profile/me', payload);
            setProfile(response.data);
            // Update i18n and localStorage when language changes
            const newLang = response.data.language || 'en';
            if (i18n.language !== newLang) {
                localStorage.setItem('language', newLang);
                await i18n.changeLanguage(newLang);
                await loadTranslations(newLang);
            }
            setProfileMessage('Profile saved.');
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to save profile');
        }
        finally {
            setProfileSaving(false);
        }
    };
    const handleResendVerification = async () => {
        setResendLoading(true);
        setError('');
        setProfileMessage('');
        try {
            const response = await api.post('/auth/resend-verification');
            setProfileMessage(response.data.message || 'Verification email sent. Please check your inbox.');
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to resend verification email');
        }
        finally {
            setResendLoading(false);
        }
    };
    const selectedKey = toDateKey(selectedDate);
    const selectedEvents = eventsByDay[selectedKey] || [];
    return (_jsxs("div", { className: "container", children: [_jsxs("header", { children: [_jsx("h1", { children: "Personal Panel" }), _jsx("div", { children: _jsx(Link, { to: "/", children: _jsx("button", { className: "btn-secondary", children: "Back to Contacts" }) }) })] }), error && (_jsxs("div", { className: "error", style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsx("span", { children: error }), error === 'Email not verified' && (_jsx("button", { className: "btn-secondary", onClick: handleResendVerification, disabled: resendLoading, style: { padding: '4px 12px', fontSize: '0.9rem', marginLeft: '12px' }, children: resendLoading ? 'Sending...' : 'Resend' }))] })), _jsxs("div", { className: "calendar-panel", children: [_jsxs("div", { className: "profile-section", children: [_jsxs("div", { className: "profile-card", children: [_jsx("h2", { children: "Profile" }), profileMessage && _jsx("div", { className: "success", children: profileMessage }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '150px 1fr', gap: '20px', marginBottom: '20px' }, children: [_jsxs("div", { className: "profile-avatar", style: { gridColumn: '1', gridRow: '1 / 3' }, children: [profile?.avatarUrl ? (_jsx("img", { src: profile.avatarUrl, alt: "Avatar" })) : (_jsx("div", { className: "avatar-placeholder", children: "No avatar" })), _jsx("input", { type: "file", accept: "image/*", onChange: (e) => handleAvatarChange(e.target.files?.[0]), style: { marginTop: '10px' } }), _jsx("small", { children: "Max 100x100 px" })] }), _jsx("div", { style: { gridColumn: '2', gridRow: '1' }, children: _jsxs("label", { style: { display: 'block', marginBottom: '10px' }, children: ["Phone", _jsx("input", { type: "text", value: profile?.phone || '', onChange: (e) => setProfile((prev) => prev ? { ...prev, phone: e.target.value } : prev), style: { width: '100%', marginTop: '5px' } })] }) }), _jsx("div", { style: { gridColumn: '2', gridRow: '2' }, children: _jsxs("label", { style: { display: 'block' }, children: ["Notification preference", _jsxs("select", { value: profile?.notificationPreference || 'NONE', onChange: (e) => setProfile((prev) => prev
                                                                ? {
                                                                    ...prev,
                                                                    notificationPreference: e.target
                                                                        .value,
                                                                }
                                                                : prev), style: { width: '100%', marginTop: '5px' }, children: [_jsx("option", { value: "PUSH", children: "Push" }), _jsx("option", { value: "EMAIL", children: "Email" }), _jsx("option", { value: "NONE", children: "None" })] })] }) })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }, children: [_jsxs("label", { children: ["Timezone", _jsxs("select", { value: profile?.timezone || 'UTC', onChange: (e) => setProfile((prev) => prev ? { ...prev, timezone: e.target.value } : prev), style: { width: '100%', marginTop: '5px' }, children: [_jsx("option", { value: "UTC", children: "UTC" }), _jsx("option", { value: "Europe/London", children: "London (GMT/BST)" }), _jsx("option", { value: "Europe/Paris", children: "Paris (CET/CEST)" }), _jsx("option", { value: "Europe/Bucharest", children: "Bucharest (EET/EEST)" }), _jsx("option", { value: "Europe/Moscow", children: "Moscow (MSK)" }), _jsx("option", { value: "America/New_York", children: "New York (EST/EDT)" }), _jsx("option", { value: "America/Chicago", children: "Chicago (CST/CDT)" }), _jsx("option", { value: "America/Los_Angeles", children: "Los Angeles (PST/PDT)" }), _jsx("option", { value: "Asia/Tokyo", children: "Tokyo (JST)" }), _jsx("option", { value: "Asia/Shanghai", children: "Shanghai (CST)" }), _jsx("option", { value: "Asia/Hong_Kong", children: "Hong Kong (HKT)" }), _jsx("option", { value: "Australia/Sydney", children: "Sydney (AEDT/AEST)" })] })] }), _jsxs("label", { children: ["Language", _jsxs("select", { value: profile?.language || 'en', onChange: (e) => setProfile((prev) => prev ? { ...prev, language: e.target.value } : prev), style: { width: '100%', marginTop: '5px' }, children: [_jsx("option", { value: "en", children: "English" }), _jsx("option", { value: "ro", children: "Rom\u00E2n\u0103" })] })] })] }), _jsx("div", { className: "form-actions", children: _jsx("button", { className: "btn-primary", onClick: handleSaveProfile, disabled: profileSaving, children: profileSaving ? 'Saving...' : 'Save profile' }) })] }), _jsxs("div", { className: "profile-card", children: [_jsx("h2", { children: "Recent activity (last 15)" }), auditLogs.length === 0 ? (_jsx("div", { className: "empty-state", children: "No activity yet." })) : (_jsxs("div", { className: "audit-table", children: [_jsxs("div", { className: "audit-row audit-header", children: [_jsx("span", { children: "Time" }), _jsx("span", { children: "Action" }), _jsx("span", { children: "Entity" }), _jsx("span", { children: "Details" })] }), auditLogs.map((log) => (_jsxs("div", { className: "audit-row", children: [_jsx("span", { children: new Date(log.createdAt).toLocaleString() }), _jsx("span", { children: formatAuditAction(log.action) }), _jsxs("span", { children: [log.entity || '-', log.entityId ? ` #${log.entityId}` : ''] }), _jsx("span", { className: "audit-details", children: formatAuditDetails(log.details) })] }, log.id)))] }))] })] }), _jsxs("div", { className: "calendar-controls", children: [_jsxs("div", { className: "calendar-view", children: [_jsx("button", { className: view === 'week' ? 'btn-primary' : 'btn-secondary', onClick: () => setView('week'), children: "Week" }), _jsx("button", { className: view === 'month' ? 'btn-primary' : 'btn-secondary', onClick: () => setView('month'), children: "Month" })] }), _jsxs("div", { className: "calendar-nav", children: [_jsx("button", { className: "btn-secondary", onClick: () => setAnchorDate(addDays(anchorDate, view === 'week' ? -7 : -30)), children: "Prev" }), _jsx("span", { children: anchorDate.toLocaleDateString(undefined, {
                                            month: 'long',
                                            year: 'numeric',
                                        }) }), _jsx("button", { className: "btn-secondary", onClick: () => setAnchorDate(addDays(anchorDate, view === 'week' ? 7 : 30)), children: "Next" })] }), _jsx("button", { className: "btn-secondary", onClick: handleExport, children: "Export ICS" })] }), _jsx("div", { className: `calendar-grid ${view}`, children: days.map((day) => {
                            const key = toDateKey(day);
                            const dayEvents = eventsByDay[key] || [];
                            const isSelected = key === selectedKey;
                            const isOutsideMonth = view === 'month' && day.getMonth() !== anchorDate.getMonth();
                            return (_jsxs("button", { type: "button", className: `calendar-cell ${isSelected ? 'selected' : ''} ${isOutsideMonth ? 'outside' : ''}`, onClick: () => {
                                    setSelectedDate(day);
                                    setShowEventModal(true);
                                }, children: [_jsx("div", { className: "calendar-cell-header", children: _jsx("span", { children: day.getDate() }) }), _jsxs("div", { className: "calendar-events", children: [dayEvents.slice(0, 3).map((event) => (_jsx("span", { className: `event-chip ${event.type.toLowerCase()}`, children: event.title }, event.id))), dayEvents.length > 3 && (_jsxs("span", { className: "event-more", children: ["+", dayEvents.length - 3, " more"] }))] })] }, key));
                        }) }), _jsx("div", { className: "calendar-details", children: _jsxs("div", { className: "calendar-list", children: [_jsxs("h3", { children: ["Events on ", selectedDate.toLocaleDateString()] }), selectedEvents.length === 0 ? (_jsx("div", { className: "empty-state", children: "No events for this date." })) : (selectedEvents.map((event) => (_jsxs("div", { className: "calendar-item", children: [_jsxs("div", { children: [_jsx("strong", { children: event.title }), _jsxs("div", { className: "calendar-item-meta", children: [event.type, " \u00B7", ' ', event.allDay
                                                            ? 'All day'
                                                            : `${new Date(event.startAt).toLocaleTimeString()} - ${new Date(event.endAt).toLocaleTimeString()}`] }), event.notes && _jsx("div", { className: "calendar-item-notes", children: event.notes })] }), _jsx("button", { className: "btn-delete", onClick: () => handleDelete(event.id), children: "Delete" })] }, event.id))))] }) }), loading && _jsx("div", { className: "loading", children: "Loading calendar..." })] }), showEventModal && (_jsx("div", { className: "modal", onClick: () => setShowEventModal(false), children: _jsxs("div", { className: "modal-content", onClick: (e) => e.stopPropagation(), children: [_jsxs("h2", { children: ["Add event on ", selectedDate.toLocaleDateString()] }), _jsxs("div", { className: "form-row", children: [_jsxs("label", { children: ["Title", _jsx("input", { type: "text", value: title, onChange: (e) => setTitle(e.target.value) })] }), _jsxs("label", { children: ["Type", _jsxs("select", { value: type, onChange: (e) => setType(e.target.value), children: [_jsx("option", { value: "TASK", children: "Task" }), _jsx("option", { value: "MEETING", children: "Meeting" })] })] })] }), _jsxs("div", { className: "form-row", children: [_jsxs("label", { children: ["Start", _jsx("input", { type: "datetime-local", value: startAt, onChange: (e) => setStartAt(e.target.value) })] }), _jsxs("label", { children: ["End", _jsx("input", { type: "datetime-local", value: endAt, onChange: (e) => setEndAt(e.target.value) })] })] }), _jsxs("label", { className: "checkbox", children: [_jsx("input", { type: "checkbox", checked: allDay, onChange: (e) => setAllDay(e.target.checked) }), "All day"] }), _jsxs("label", { children: ["Notes", _jsx("textarea", { value: notes, onChange: (e) => setNotes(e.target.value) })] }), _jsxs("div", { className: "form-actions", children: [_jsx("button", { className: "btn-secondary", onClick: () => setShowEventModal(false), children: "Cancel" }), _jsx("button", { className: "btn-primary", onClick: handleCreate, disabled: !title.trim(), children: "Add event" })] })] }) }))] }));
}
