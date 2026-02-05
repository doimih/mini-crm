import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { api } from '../services/api';
export default function TagManager({ tags, onTagsChange }) {
    const [newTagName, setNewTagName] = useState('');
    const [loading, setLoading] = useState(false);
    const handleAddTag = async (e) => {
        e.preventDefault();
        if (!newTagName.trim())
            return;
        setLoading(true);
        try {
            await api.post('/tags', { name: newTagName });
            setNewTagName('');
            onTagsChange();
        }
        catch (error) {
            console.error('Failed to add tag', error);
        }
        finally {
            setLoading(false);
        }
    };
    const handleDeleteTag = async (id) => {
        if (!confirm('Are you sure you want to delete this tag?'))
            return;
        try {
            await api.delete(`/tags/${id}`);
            onTagsChange();
        }
        catch (error) {
            console.error('Failed to delete tag', error);
        }
    };
    return (_jsxs("div", { className: "tag-manager", children: [_jsx("h3", { children: "Tags" }), _jsxs("form", { onSubmit: handleAddTag, className: "tag-form", children: [_jsx("input", { type: "text", placeholder: "New tag name", value: newTagName, onChange: (e) => setNewTagName(e.target.value) }), _jsx("button", { type: "submit", disabled: loading, children: "Add Tag" })] }), _jsx("div", { className: "tags", children: tags.map((tag) => (_jsxs("span", { className: "tag", children: [tag.name, _jsx("button", { onClick: () => handleDeleteTag(tag.id), className: "tag-delete", children: "\u00D7" })] }, tag.id))) })] }));
}
