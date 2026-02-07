import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import i18n, { loadTranslations } from '../i18n';

interface CalendarEvent {
  id: number;
  title: string;
  type: 'TASK' | 'MEETING';
  notes?: string | null;
  startAt: string;
  endAt: string;
  allDay: boolean;
}

interface Profile {
  id: number;
  email: string;
  role: string;
  status: string;
  phone?: string | null;
  avatarUrl?: string | null;
  notificationPreference: 'PUSH' | 'EMAIL' | 'NONE';
  timezone?: string;
  language?: string;
}

interface AuditLog {
  id: number;
  action: string;
  entity?: string | null;
  entityId?: number | null;
  details?: Record<string, unknown> | null;
  createdAt: string;
}

type ViewMode = 'week' | 'month';

const startOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const startOfWeek = (date: Date) => {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  return d;
};

const addDays = (date: Date, days: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const toDateKey = (value: Date) => {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateTimeInput = (value: Date) => {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  const hours = `${value.getHours()}`.padStart(2, '0');
  const minutes = `${value.getMinutes()}`.padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

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

export default function PersonalPanel() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [view, setView] = useState<ViewMode>('month');
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showEventModal, setShowEventModal] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [title, setTitle] = useState('');
  const [type, setType] = useState<CalendarEvent['type']>('TASK');
  const [notes, setNotes] = useState('');
  const [allDay, setAllDay] = useState(false);
  const [startAt, setStartAt] = useState(formatDateTimeInput(new Date()));
  const [endAt, setEndAt] = useState(formatDateTimeInput(addDays(new Date(), 0)));
  const [resendLoading, setResendLoading] = useState(false);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/profile/me');
      setProfile(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load profile');
    }
  };

  const fetchMyLogs = async () => {
    try {
      const response = await api.get('/profile/me/audit-logs');
      setAuditLogs(response.data || []);
    } catch (err: any) {
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
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load events');
    } finally {
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
    const list: Date[] = [];
    const count = view === 'week' ? 7 : 42;
    for (let i = 0; i < count; i += 1) {
      list.push(addDays(range.start, i));
    }
    return list;
  }, [range.start, view]);

  const eventsByDay = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
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
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create event');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this event?')) return;
    try {
      await api.delete(`/calendar/${id}`);
      fetchEvents();
    } catch (err: any) {
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
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to export ICS');
    }
  };

  const handleAvatarChange = async (file?: File) => {
    if (!file) return;
    const image = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      image.onload = () => {
        if (image.width > 100 || image.height > 100) {
          setError('Avatar must be максимум 100x100 px.');
          return;
        }
        setProfile((prev) =>
          prev ? { ...prev, avatarUrl: reader.result as string } : prev
        );
      };
      if (typeof reader.result === 'string') {
        image.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
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
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save profile');
    } finally {
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
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend verification email');
    } finally {
      setResendLoading(false);
    }
  };

  const selectedKey = toDateKey(selectedDate);
  const selectedEvents = eventsByDay[selectedKey] || [];

  return (
    <div className="container">
      <header>
        <h1>Personal Panel</h1>
        <div>
          <Link to="/">
            <button className="btn-secondary">
              Back to Contacts
            </button>
          </Link>
        </div>
      </header>

      {error && (
        <div className="error" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{error}</span>
          {error === 'Email not verified' && (
            <button
              className="btn-secondary"
              onClick={handleResendVerification}
              disabled={resendLoading}
              style={{ padding: '4px 12px', fontSize: '0.9rem', marginLeft: '12px' }}
            >
              {resendLoading ? 'Sending...' : 'Resend'}
            </button>
          )}
        </div>
      )}

      <div className="calendar-panel">
        <div className="profile-section">
          <div className="profile-card">
            <h2>Profile</h2>
            {profileMessage && <div className="success">{profileMessage}</div>}
            
            <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '20px', marginBottom: '20px' }}>
              {/* Left: Avatar */}
              <div className="profile-avatar" style={{ gridColumn: '1', gridRow: '1 / 3' }}>
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="Avatar" />
                ) : (
                  <div className="avatar-placeholder">No avatar</div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleAvatarChange(e.target.files?.[0])}
                  style={{ marginTop: '10px' }}
                />
                <small>Max 100x100 px</small>
              </div>

              {/* Right: Phone and Notification */}
              <div style={{ gridColumn: '2', gridRow: '1' }}>
                <label style={{ display: 'block', marginBottom: '10px' }}>
                  Phone
                  <input
                    type="text"
                    value={profile?.phone || ''}
                    onChange={(e) =>
                      setProfile((prev) =>
                        prev ? { ...prev, phone: e.target.value } : prev
                      )
                    }
                    style={{ width: '100%', marginTop: '5px' }}
                  />
                </label>
              </div>

              <div style={{ gridColumn: '2', gridRow: '2' }}>
                <label style={{ display: 'block' }}>
                  Notification preference
                  <select
                    value={profile?.notificationPreference || 'NONE'}
                    onChange={(e) =>
                      setProfile((prev) =>
                        prev
                          ? {
                              ...prev,
                              notificationPreference: e.target
                                .value as Profile['notificationPreference'],
                            }
                          : prev
                      )
                    }
                    style={{ width: '100%', marginTop: '5px' }}
                  >
                    <option value="PUSH">Push</option>
                    <option value="EMAIL">Email</option>
                    <option value="NONE">None</option>
                  </select>
                </label>
              </div>
            </div>

            {/* Below: Timezone and Language */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <label>
                Timezone
                <select
                  value={profile?.timezone || 'UTC'}
                  onChange={(e) =>
                    setProfile((prev) =>
                      prev ? { ...prev, timezone: e.target.value } : prev
                    )
                  }
                  style={{ width: '100%', marginTop: '5px' }}
                >
                  <option value="UTC">UTC</option>
                  <option value="Europe/London">London (GMT/BST)</option>
                  <option value="Europe/Paris">Paris (CET/CEST)</option>
                  <option value="Europe/Bucharest">Bucharest (EET/EEST)</option>
                  <option value="Europe/Moscow">Moscow (MSK)</option>
                  <option value="America/New_York">New York (EST/EDT)</option>
                  <option value="America/Chicago">Chicago (CST/CDT)</option>
                  <option value="America/Los_Angeles">Los Angeles (PST/PDT)</option>
                  <option value="Asia/Tokyo">Tokyo (JST)</option>
                  <option value="Asia/Shanghai">Shanghai (CST)</option>
                  <option value="Asia/Hong_Kong">Hong Kong (HKT)</option>
                  <option value="Australia/Sydney">Sydney (AEDT/AEST)</option>
                </select>
              </label>
              <label>
                Language
                <select
                  value={profile?.language || 'en'}
                  onChange={(e) =>
                    setProfile((prev) =>
                      prev ? { ...prev, language: e.target.value } : prev
                    )
                  }
                  style={{ width: '100%', marginTop: '5px' }}
                >
                  <option value="en">English</option>
                  <option value="ro">Română</option>
                </select>
              </label>
            </div>

            <div className="form-actions">
              <button
                className="btn-primary"
                onClick={handleSaveProfile}
                disabled={profileSaving}
              >
                {profileSaving ? 'Saving...' : 'Save profile'}
              </button>
            </div>
          </div>

          <div className="profile-card">
            <h2>Recent activity (last 15)</h2>
            {auditLogs.length === 0 ? (
              <div className="empty-state">No activity yet.</div>
            ) : (
              <div className="audit-table">
                <div className="audit-row audit-header">
                  <span>Time</span>
                  <span>Action</span>
                  <span>Entity</span>
                  <span>Details</span>
                </div>
                {auditLogs.map((log) => (
                  <div key={log.id} className="audit-row">
                    <span>{new Date(log.createdAt).toLocaleString()}</span>
                    <span>{formatAuditAction(log.action)}</span>
                    <span>
                      {log.entity || '-'}
                      {log.entityId ? ` #${log.entityId}` : ''}
                    </span>
                    <span className="audit-details">{formatAuditDetails(log.details)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="calendar-controls">
          <div className="calendar-view">
            <button
              className={view === 'week' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setView('week')}
            >
              Week
            </button>
            <button
              className={view === 'month' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setView('month')}
            >
              Month
            </button>
          </div>
          <div className="calendar-nav">
            <button
              className="btn-secondary"
              onClick={() =>
                setAnchorDate(
                  addDays(anchorDate, view === 'week' ? -7 : -30)
                )
              }
            >
              Prev
            </button>
            <span>
              {anchorDate.toLocaleDateString(undefined, {
                month: 'long',
                year: 'numeric',
              })}
            </span>
            <button
              className="btn-secondary"
              onClick={() =>
                setAnchorDate(
                  addDays(anchorDate, view === 'week' ? 7 : 30)
                )
              }
            >
              Next
            </button>
          </div>
          <button className="btn-secondary" onClick={handleExport}>
            Export ICS
          </button>
        </div>

        <div className={`calendar-grid ${view}`}>
          {days.map((day) => {
            const key = toDateKey(day);
            const dayEvents = eventsByDay[key] || [];
            const isSelected = key === selectedKey;
            const isOutsideMonth =
              view === 'month' && day.getMonth() !== anchorDate.getMonth();

            return (
              <button
                type="button"
                key={key}
                className={`calendar-cell ${
                  isSelected ? 'selected' : ''
                } ${isOutsideMonth ? 'outside' : ''}`}
                onClick={() => {
                  setSelectedDate(day);
                  setShowEventModal(true);
                }}
              >
                <div className="calendar-cell-header">
                  <span>{day.getDate()}</span>
                </div>
                <div className="calendar-events">
                  {dayEvents.slice(0, 3).map((event) => (
                    <span key={event.id} className={`event-chip ${event.type.toLowerCase()}`}>
                      {event.title}
                    </span>
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="event-more">+{dayEvents.length - 3} more</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="calendar-details">
          <div className="calendar-list">
            <h3>Events on {selectedDate.toLocaleDateString()}</h3>
            {selectedEvents.length === 0 ? (
              <div className="empty-state">No events for this date.</div>
            ) : (
              selectedEvents.map((event) => (
                <div key={event.id} className="calendar-item">
                  <div>
                    <strong>{event.title}</strong>
                    <div className="calendar-item-meta">
                      {event.type} ·{' '}
                      {event.allDay
                        ? 'All day'
                        : `${new Date(event.startAt).toLocaleTimeString()} - ${new Date(
                            event.endAt
                          ).toLocaleTimeString()}`}
                    </div>
                    {event.notes && <div className="calendar-item-notes">{event.notes}</div>}
                  </div>
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(event.id)}
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>

        </div>

        {loading && <div className="loading">Loading calendar...</div>}
      </div>

      {showEventModal && (
        <div className="modal" onClick={() => setShowEventModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add event on {selectedDate.toLocaleDateString()}</h2>
            <div className="form-row">
              <label>
                Title
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </label>
              <label>
                Type
                <select value={type} onChange={(e) => setType(e.target.value as CalendarEvent['type'])}>
                  <option value="TASK">Task</option>
                  <option value="MEETING">Meeting</option>
                </select>
              </label>
            </div>
            <div className="form-row">
              <label>
                Start
                <input
                  type="datetime-local"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                />
              </label>
              <label>
                End
                <input
                  type="datetime-local"
                  value={endAt}
                  onChange={(e) => setEndAt(e.target.value)}
                />
              </label>
            </div>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={allDay}
                onChange={(e) => setAllDay(e.target.checked)}
              />
              All day
            </label>
            <label>
              Notes
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
            </label>
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setShowEventModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleCreate} disabled={!title.trim()}>
                Add event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
