import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { api } from '../services/api';
function TranslationManager() {
    const [translations, setTranslations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editEn, setEditEn] = useState('');
    const [editRo, setEditRo] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [newKey, setNewKey] = useState('');
    const [newEn, setNewEn] = useState('');
    const [newRo, setNewRo] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const fetchTranslations = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await api.get('/translations/admin/all');
            setTranslations(response.data);
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to load translations');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchTranslations();
    }, []);
    const handleEdit = (translation) => {
        setEditingId(translation.id);
        setEditEn(translation.en);
        setEditRo(translation.ro);
    };
    const handleSaveEdit = async (id) => {
        if (!editEn.trim() || !editRo.trim()) {
            setError('Both translations are required');
            return;
        }
        try {
            const response = await api.put(`/translations/admin/${id}`, {
                en: editEn,
                ro: editRo,
            });
            setTranslations((prev) => prev.map((t) => (t.id === id ? response.data : t)));
            setEditingId(null);
            setEditEn('');
            setEditRo('');
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to save translation');
        }
    };
    const handleAddTranslation = async (e) => {
        e.preventDefault();
        if (!newKey.trim() || !newEn.trim() || !newRo.trim()) {
            setError('Key and both translations are required');
            return;
        }
        try {
            const response = await api.post('/translations/admin/create', {
                key: newKey,
                en: newEn,
                ro: newRo,
            });
            setTranslations((prev) => [...prev, response.data]);
            setNewKey('');
            setNewEn('');
            setNewRo('');
            setShowAddForm(false);
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to create translation');
        }
    };
    const filteredTranslations = translations.filter((t) => t.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.ro.toLowerCase().includes(searchQuery.toLowerCase()));
    return (_jsxs("div", { className: "admin-section", children: [_jsx("h2", { children: "Translation Manager" }), error && _jsx("div", { className: "error", children: error }), _jsxs("div", { style: { marginBottom: '20px' }, children: [_jsx("input", { type: "text", placeholder: "Search translations...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), style: {
                            padding: '8px 12px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            width: '100%',
                            maxWidth: '400px',
                            marginRight: '10px',
                        } }), _jsx("button", { className: "btn-primary", onClick: () => setShowAddForm(!showAddForm), style: { marginLeft: '10px' }, children: showAddForm ? 'Cancel' : 'Add Translation' })] }), showAddForm && (_jsxs("form", { onSubmit: handleAddTranslation, style: { marginBottom: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '4px' }, children: [_jsx("div", { style: { marginBottom: '10px' }, children: _jsxs("label", { children: ["Key", _jsx("input", { type: "text", value: newKey, onChange: (e) => setNewKey(e.target.value), placeholder: "e.g., button.save", style: { marginLeft: '10px', padding: '6px' } })] }) }), _jsx("div", { style: { marginBottom: '10px' }, children: _jsxs("label", { children: ["English", _jsx("input", { type: "text", value: newEn, onChange: (e) => setNewEn(e.target.value), placeholder: "English translation", style: { marginLeft: '10px', padding: '6px', width: '300px' } })] }) }), _jsx("div", { style: { marginBottom: '10px' }, children: _jsxs("label", { children: ["Romanian", _jsx("input", { type: "text", value: newRo, onChange: (e) => setNewRo(e.target.value), placeholder: "Romanian translation", style: { marginLeft: '10px', padding: '6px', width: '300px' } })] }) }), _jsx("button", { type: "submit", className: "btn-primary", children: "Add Translation" })] })), loading ? (_jsx("p", { children: "Loading translations..." })) : filteredTranslations.length === 0 ? (_jsx("p", { children: "No translations found" })) : (_jsxs("div", { className: "translation-grid", style: { marginTop: '20px' }, children: [_jsxs("div", { style: { display: 'grid', gridTemplateColumns: '2fr 3fr 3fr 150px', gap: '10px', marginBottom: '10px', fontWeight: 'bold', borderBottom: '2px solid #ddd', paddingBottom: '10px' }, children: [_jsx("span", { children: "Key" }), _jsx("span", { children: "English" }), _jsx("span", { children: "Romanian" }), _jsx("span", { children: "Actions" })] }), filteredTranslations.map((translation) => (_jsxs("div", { style: { display: 'grid', gridTemplateColumns: '2fr 3fr 3fr 150px', gap: '10px', alignItems: 'start', padding: '10px', borderBottom: '1px solid #eee' }, children: [_jsx("span", { style: { wordBreak: 'break-word' }, children: translation.key }), editingId === translation.id ? (_jsxs(_Fragment, { children: [_jsx("input", { type: "text", value: editEn, onChange: (e) => setEditEn(e.target.value), style: { padding: '6px', width: '100%' } }), _jsx("input", { type: "text", value: editRo, onChange: (e) => setEditRo(e.target.value), style: { padding: '6px', width: '100%' } }), _jsxs("div", { style: { display: 'flex', gap: '5px' }, children: [_jsx("button", { className: "btn-primary", onClick: () => handleSaveEdit(translation.id), style: { padding: '4px 8px', fontSize: '0.9rem' }, children: "Save" }), _jsx("button", { className: "btn-secondary", onClick: () => setEditingId(null), style: { padding: '4px 8px', fontSize: '0.9rem' }, children: "Cancel" })] })] })) : (_jsxs(_Fragment, { children: [_jsx("span", { style: { wordBreak: 'break-word' }, children: translation.en }), _jsx("span", { style: { wordBreak: 'break-word' }, children: translation.ro }), _jsx("button", { className: "btn-secondary", onClick: () => handleEdit(translation), style: { padding: '4px 8px', fontSize: '0.9rem' }, children: "Edit" })] }))] }, translation.id)))] }))] }));
}
export default TranslationManager;
