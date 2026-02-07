import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import ContactForm from './ContactForm';
export default function ContactList({ onLogout, user }) {
    const [contacts, setContacts] = useState([]);
    const [tags, setTags] = useState([]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedContact, setSelectedContact] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showAdminMenu, setShowAdminMenu] = useState(false);
    useEffect(() => {
        fetchContacts();
        fetchTags();
    }, [page, search]);
    useEffect(() => {
        const handleClickOutside = (event) => {
            const target = event.target;
            if (!target.closest('.admin-dropdown')) {
                setShowAdminMenu(false);
            }
        };
        if (showAdminMenu) {
            document.addEventListener('click', handleClickOutside);
        }
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [showAdminMenu]);
    const fetchContacts = async () => {
        setLoading(true);
        try {
            const response = await api.get('/contacts', {
                params: { page, limit: 10, search },
            });
            setContacts(response.data.contacts);
            setTotalPages(response.data.pagination.pages);
        }
        catch (error) {
            console.error('Failed to fetch contacts', error);
        }
        finally {
            setLoading(false);
        }
    };
    const fetchTags = async () => {
        try {
            const response = await api.get('/tags');
            setTags(response.data);
        }
        catch (error) {
            console.error('Failed to fetch tags', error);
        }
    };
    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this contact?'))
            return;
        try {
            await api.delete(`/contacts/${id}`);
            fetchContacts();
        }
        catch (error) {
            console.error('Failed to delete contact', error);
        }
    };
    const handleExport = async () => {
        try {
            const response = await api.get('/contacts/export', {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'contacts.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
        }
        catch (error) {
            console.error('Failed to export contacts', error);
        }
    };
    const handleFormSuccess = () => {
        setShowForm(false);
        setSelectedContact(null);
        fetchContacts();
    };
    return (_jsxs("div", { className: "container", children: [_jsxs("header", { children: [_jsx("h1", { children: "Contact Mini CRM" }), _jsxs("div", { style: { display: 'flex', gap: '10px', alignItems: 'center', position: 'relative' }, children: [_jsx(Link, { to: "/inbox", children: _jsx("button", { className: "btn-primary", children: "Inbox" }) }), user?.role === 'SUPERADMIN' && (_jsxs("div", { style: { position: 'relative' }, className: "admin-dropdown", children: [_jsxs("button", { className: "btn-secondary", onClick: () => setShowAdminMenu(!showAdminMenu), style: { display: 'flex', alignItems: 'center', gap: '5px' }, children: ["Admin", _jsx("span", { style: { fontSize: '10px' }, children: "\u25BC" })] }), showAdminMenu && (_jsxs("div", { style: {
                                            position: 'absolute',
                                            top: '100%',
                                            left: 0,
                                            marginTop: '5px',
                                            background: 'white',
                                            border: '1px solid #ddd',
                                            borderRadius: '6px',
                                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                                            minWidth: '180px',
                                            zIndex: 1000,
                                            overflow: 'hidden'
                                        }, children: [_jsx(Link, { to: "/me", style: {
                                                    display: 'block',
                                                    padding: '12px 16px',
                                                    color: '#333',
                                                    textDecoration: 'none',
                                                    transition: 'background 0.2s',
                                                    borderBottom: '1px solid #eee'
                                                }, onMouseEnter: (e) => e.currentTarget.style.background = '#f0f7ff', onMouseLeave: (e) => e.currentTarget.style.background = 'transparent', onClick: () => setShowAdminMenu(false), children: "Personal Panel" }), _jsx(Link, { to: "/audit-logs", style: {
                                                    display: 'block',
                                                    padding: '12px 16px',
                                                    color: '#333',
                                                    textDecoration: 'none',
                                                    transition: 'background 0.2s'
                                                }, onMouseEnter: (e) => e.currentTarget.style.background = '#f0f7ff', onMouseLeave: (e) => e.currentTarget.style.background = 'transparent', onClick: () => setShowAdminMenu(false), children: "Activity Log" }), _jsx(Link, { to: "/admin", style: {
                                                    display: 'block',
                                                    padding: '12px 16px',
                                                    color: '#333',
                                                    textDecoration: 'none',
                                                    transition: 'background 0.2s',
                                                    borderTop: '1px solid #eee'
                                                }, onMouseEnter: (e) => e.currentTarget.style.background = '#f0f7ff', onMouseLeave: (e) => e.currentTarget.style.background = 'transparent', onClick: () => setShowAdminMenu(false), children: "User Management" })] }))] })), _jsx("button", { onClick: onLogout, className: "btn-secondary", children: "Logout" })] })] }), user?.emailVerified === false && (_jsx("div", { className: "warning", children: _jsx("div", { children: "Account not activated. Please check your email to verify your account." }) })), _jsxs("div", { className: "activation-row", children: [_jsx("input", { type: "text", placeholder: "Search contacts...", value: search, onChange: (e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }, className: "search-input" }), _jsx("div", { className: "activation-status", children: _jsx("span", { className: `status-dot ${user?.emailVerified === false
                                ? 'status-dot--inactive'
                                : 'status-dot--active'}`, title: user?.emailVerified === false
                                ? 'Account not activated'
                                : 'Account activated' }) })] }), _jsx("div", { className: "toolbar", children: _jsxs("div", { children: [_jsx("button", { onClick: () => setShowForm(true), className: "btn-primary", children: "Add Contact" }), _jsx("button", { onClick: handleExport, className: "btn-secondary", children: "Export CSV" })] }) }), showForm && (_jsx(ContactForm, { contact: selectedContact, tags: tags, onClose: () => {
                    setShowForm(false);
                    setSelectedContact(null);
                }, onSuccess: handleFormSuccess })), loading ? (_jsx("div", { className: "loading", children: "Loading..." })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "contacts-grid", children: contacts.map((contact) => (_jsxs("div", { className: "contact-card", children: [_jsx("h3", { children: contact.name }), contact.contactPersonName && (_jsxs("p", { children: ["\uD83D\uDC64 ", contact.contactPersonName] })), contact.email && _jsxs("p", { children: ["\uD83D\uDCE7 ", contact.email] }), contact.phone && _jsxs("p", { children: ["\uD83D\uDCF1 ", contact.phone] }), contact.company && _jsxs("p", { children: ["\uD83C\uDFE2 ", contact.company] }), contact.notes && _jsx("p", { className: "notes", children: contact.notes }), contact.tags.length > 0 && (_jsx("div", { className: "tags", children: contact.tags.map((tag) => (_jsx("span", { className: "tag", children: tag.name }, tag.id))) })), _jsxs("div", { className: "card-actions", children: [_jsx("button", { onClick: () => {
                                                setSelectedContact(contact);
                                                setShowForm(true);
                                            }, className: "btn-edit", children: "Edit" }), _jsx("button", { onClick: () => handleDelete(contact.id), className: "btn-delete", children: "Delete" })] })] }, contact.id))) }), totalPages > 1 && (_jsxs("div", { className: "pagination", children: [_jsx("button", { onClick: () => setPage((p) => Math.max(1, p - 1)), disabled: page === 1, children: "Previous" }), _jsxs("span", { children: ["Page ", page, " of ", totalPages] }), _jsx("button", { onClick: () => setPage((p) => Math.min(totalPages, p + 1)), disabled: page === totalPages, children: "Next" })] }))] }))] }));
}
