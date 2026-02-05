import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import ContactForm from './ContactForm';

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

interface ContactListProps {
  onLogout: () => void;
  user: {
    role: string;
    email?: string;
    emailVerified?: boolean;
  } | null;
}

export default function ContactList({ onLogout, user }: ContactListProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchContacts();
    fetchTags();
  }, [page, search]);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/contacts', {
        params: { page, limit: 10, search },
      });
      setContacts(response.data.contacts);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      console.error('Failed to fetch contacts', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await api.get('/tags');
      setTags(response.data);
    } catch (error) {
      console.error('Failed to fetch tags', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;

    try {
      await api.delete(`/contacts/${id}`);
      fetchContacts();
    } catch (error) {
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
    } catch (error) {
      console.error('Failed to export contacts', error);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedContact(null);
    fetchContacts();
  };


  return (
    <div className="container">
      <header>
        <h1>Contact Mini CRM</h1>
        <div>
          <Link to="/inbox" className="btn-secondary">
            Inbox
          </Link>
          <Link to="/me" className="btn-secondary">
            Personal Panel
          </Link>
          {user?.role === 'SUPERADMIN' && (
            <>
              <Link to="/admin" className="btn-secondary">
                Admin
              </Link>
              <Link to="/audit-logs" className="btn-secondary">
                Activity Log
              </Link>
            </>
          )}
          <button onClick={onLogout} className="btn-secondary">
            Logout
          </button>
        </div>
      </header>

      {user?.emailVerified === false && (
        <div className="warning">
          <div>
            Account not activated. Please check your email to verify your account.
          </div>
        </div>
      )}

      <div className="activation-row">
        <input
          type="text"
          placeholder="Search contacts..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="search-input"
        />
        <div className="activation-status">
          <span
            className={`status-dot ${
              user?.emailVerified === false
                ? 'status-dot--inactive'
                : 'status-dot--active'
            }`}
            title={
              user?.emailVerified === false
                ? 'Account not activated'
                : 'Account activated'
            }
          />
        </div>
      </div>

      <div className="toolbar">
        <div>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            Add Contact
          </button>
          <button onClick={handleExport} className="btn-secondary">
            Export CSV
          </button>
        </div>
      </div>

      {showForm && (
        <ContactForm
          contact={selectedContact}
          tags={tags}
          onClose={() => {
            setShowForm(false);
            setSelectedContact(null);
          }}
          onSuccess={handleFormSuccess}
        />
      )}

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <>
          <div className="contacts-grid">
            {contacts.map((contact) => (
              <div key={contact.id} className="contact-card">
                <h3>{contact.name}</h3>
                {contact.contactPersonName && (
                  <p>👤 {contact.contactPersonName}</p>
                )}
                {contact.email && <p>📧 {contact.email}</p>}
                {contact.phone && <p>📱 {contact.phone}</p>}
                {contact.company && <p>🏢 {contact.company}</p>}
                {contact.notes && <p className="notes">{contact.notes}</p>}
                {contact.tags.length > 0 && (
                  <div className="tags">
                    {contact.tags.map((tag) => (
                      <span key={tag.id} className="tag">
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
                <div className="card-actions">
                  <button
                    onClick={() => {
                      setSelectedContact(contact);
                      setShowForm(true);
                    }}
                    className="btn-edit"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(contact.id)}
                    className="btn-delete"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
