import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { api } from '../services/api';
export default function ContactForm({ contact, tags, onClose, onSuccess, }) {
    const [name, setName] = useState('');
    const [contactPersonName, setContactPersonName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [company, setCompany] = useState('');
    const [notes, setNotes] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    useEffect(() => {
        if (contact) {
            setName(contact.name);
            setContactPersonName(contact.contactPersonName || '');
            setEmail(contact.email || '');
            setPhone(contact.phone || '');
            setCompany(contact.company || '');
            setNotes(contact.notes || '');
            setSelectedTags(contact.tags.map((t) => t.id));
        }
    }, [contact]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = { name, contactPersonName, email, phone, company, notes };
            if (contact) {
                await api.put(`/contacts/${contact.id}`, data);
                // Update tags
                const currentTagIds = contact.tags.map((t) => t.id);
                const tagsToAdd = selectedTags.filter((id) => !currentTagIds.includes(id));
                const tagsToRemove = currentTagIds.filter((id) => !selectedTags.includes(id));
                await Promise.all([
                    ...tagsToAdd.map((tagId) => api.post(`/tags/contact/${contact.id}/tag/${tagId}`)),
                    ...tagsToRemove.map((tagId) => api.delete(`/tags/contact/${contact.id}/tag/${tagId}`)),
                ]);
            }
            else {
                const response = await api.post('/contacts', data);
                const contactId = response.data.id;
                // Add tags
                await Promise.all(selectedTags.map((tagId) => api.post(`/tags/contact/${contactId}/tag/${tagId}`)));
            }
            onSuccess();
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to save contact');
        }
        finally {
            setLoading(false);
        }
    };
    const toggleTag = (tagId) => {
        setSelectedTags((prev) => prev.includes(tagId)
            ? prev.filter((id) => id !== tagId)
            : [...prev, tagId]);
    };
    return (_jsx("div", { className: "modal", children: _jsxs("div", { className: "modal-content", children: [_jsx("h2", { children: contact ? 'Edit Contact' : 'Add Contact' }), error && _jsx("div", { className: "error", children: error }), _jsxs("form", { onSubmit: handleSubmit, children: [_jsx("input", { type: "text", placeholder: "Nume Prenume *", value: name, onChange: (e) => setName(e.target.value), required: true }), _jsx("input", { type: "text", placeholder: "Nume Prenume persoana", value: contactPersonName, onChange: (e) => setContactPersonName(e.target.value) }), _jsx("input", { type: "email", placeholder: "Email", value: email, onChange: (e) => setEmail(e.target.value) }), _jsx("input", { type: "tel", placeholder: "Phone", value: phone, onChange: (e) => setPhone(e.target.value) }), _jsx("input", { type: "text", placeholder: "Company", value: company, onChange: (e) => setCompany(e.target.value) }), _jsx("textarea", { placeholder: "Notes", value: notes, onChange: (e) => setNotes(e.target.value), rows: 4 }), _jsxs("div", { className: "tag-selector", children: [_jsx("label", { children: "Tags:" }), _jsx("div", { className: "tag-list", children: tags.map((tag) => (_jsxs("label", { className: "tag-checkbox", children: [_jsx("input", { type: "checkbox", checked: selectedTags.includes(tag.id), onChange: () => toggleTag(tag.id) }), tag.name] }, tag.id))) })] }), _jsxs("div", { className: "form-actions", children: [_jsx("button", { type: "submit", disabled: loading, className: "btn-primary", children: loading ? 'Saving...' : 'Save' }), _jsx("button", { type: "button", onClick: onClose, className: "btn-secondary", children: "Cancel" })] })] })] }) }));
}
