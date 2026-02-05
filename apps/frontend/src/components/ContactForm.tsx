import { useState, FormEvent, useEffect } from 'react';
import { api } from '../services/api';

interface Contact {
  id: number;
  name: string;
  contactPersonName?: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
  tags: Tag[];
}

interface Tag {
  id: number;
  name: string;
}

interface ContactFormProps {
  contact: Contact | null;
  tags: Tag[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function ContactForm({
  contact,
  tags,
  onClose,
  onSuccess,
}: ContactFormProps) {
  const [name, setName] = useState('');
  const [contactPersonName, setContactPersonName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
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

  const handleSubmit = async (e: FormEvent) => {
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
          ...tagsToAdd.map((tagId) =>
            api.post(`/tags/contact/${contact.id}/tag/${tagId}`)
          ),
          ...tagsToRemove.map((tagId) =>
            api.delete(`/tags/contact/${contact.id}/tag/${tagId}`)
          ),
        ]);
      } else {
        const response = await api.post('/contacts', data);
        const contactId = response.data.id;

        // Add tags
        await Promise.all(
          selectedTags.map((tagId) =>
            api.post(`/tags/contact/${contactId}/tag/${tagId}`)
          )
        );
      }

      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save contact');
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tagId: number) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>{contact ? 'Edit Contact' : 'Add Contact'}</h2>
        
        {error && <div className="error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Nume Prenume *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Nume Prenume persoana"
            value={contactPersonName}
            onChange={(e) => setContactPersonName(e.target.value)}
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="tel"
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <input
            type="text"
            placeholder="Company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
          <textarea
            placeholder="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
          />

          <div className="tag-selector">
            <label>Tags:</label>
            <div className="tag-list">
              {tags.map((tag) => (
                <label key={tag.id} className="tag-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedTags.includes(tag.id)}
                    onChange={() => toggleTag(tag.id)}
                  />
                  {tag.name}
                </label>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
