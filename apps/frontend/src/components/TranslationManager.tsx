import { useEffect, useState, FormEvent } from 'react';
import { api } from '../services/api';

interface Translation {
  id: number;
  key: string;
  en: string;
  ro: string;
  createdAt: string;
  updatedAt: string;
}

function TranslationManager() {
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
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
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load translations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTranslations();
  }, []);

  const handleEdit = (translation: Translation) => {
    setEditingId(translation.id);
    setEditEn(translation.en);
    setEditRo(translation.ro);
  };

  const handleSaveEdit = async (id: number) => {
    if (!editEn.trim() || !editRo.trim()) {
      setError('Both translations are required');
      return;
    }

    try {
      const response = await api.put(`/translations/admin/${id}`, {
        en: editEn,
        ro: editRo,
      });
      setTranslations((prev) =>
        prev.map((t) => (t.id === id ? response.data : t))
      );
      setEditingId(null);
      setEditEn('');
      setEditRo('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save translation');
    }
  };

  const handleAddTranslation = async (e: FormEvent) => {
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
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create translation');
    }
  };

  const filteredTranslations = translations.filter(
    (t) =>
      t.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.ro.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="admin-section">
      <h2>Translation Manager</h2>

      {error && <div className="error">{error}</div>}

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search translations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            width: '100%',
            maxWidth: '400px',
            marginRight: '10px',
          }}
        />
        <button
          className="btn-primary"
          onClick={() => setShowAddForm(!showAddForm)}
          style={{ marginLeft: '10px' }}
        >
          {showAddForm ? 'Cancel' : 'Add Translation'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddTranslation} style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
          <div style={{ marginBottom: '10px' }}>
            <label>
              Key
              <input
                type="text"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="e.g., button.save"
                style={{ marginLeft: '10px', padding: '6px' }}
              />
            </label>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>
              English
              <input
                type="text"
                value={newEn}
                onChange={(e) => setNewEn(e.target.value)}
                placeholder="English translation"
                style={{ marginLeft: '10px', padding: '6px', width: '300px' }}
              />
            </label>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>
              Romanian
              <input
                type="text"
                value={newRo}
                onChange={(e) => setNewRo(e.target.value)}
                placeholder="Romanian translation"
                style={{ marginLeft: '10px', padding: '6px', width: '300px' }}
              />
            </label>
          </div>
          <button type="submit" className="btn-primary">
            Add Translation
          </button>
        </form>
      )}

      {loading ? (
        <p>Loading translations...</p>
      ) : filteredTranslations.length === 0 ? (
        <p>No translations found</p>
      ) : (
        <div className="translation-grid" style={{ marginTop: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr 3fr 150px', gap: '10px', marginBottom: '10px', fontWeight: 'bold', borderBottom: '2px solid #ddd', paddingBottom: '10px' }}>
            <span>Key</span>
            <span>English</span>
            <span>Romanian</span>
            <span>Actions</span>
          </div>
          {filteredTranslations.map((translation) => (
            <div key={translation.id} style={{ display: 'grid', gridTemplateColumns: '2fr 3fr 3fr 150px', gap: '10px', alignItems: 'start', padding: '10px', borderBottom: '1px solid #eee' }}>
              <span style={{ wordBreak: 'break-word' }}>{translation.key}</span>
              {editingId === translation.id ? (
                <>
                  <input
                    type="text"
                    value={editEn}
                    onChange={(e) => setEditEn(e.target.value)}
                    style={{ padding: '6px', width: '100%' }}
                  />
                  <input
                    type="text"
                    value={editRo}
                    onChange={(e) => setEditRo(e.target.value)}
                    style={{ padding: '6px', width: '100%' }}
                  />
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button
                      className="btn-primary"
                      onClick={() => handleSaveEdit(translation.id)}
                      style={{ padding: '4px 8px', fontSize: '0.9rem' }}
                    >
                      Save
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => setEditingId(null)}
                      style={{ padding: '4px 8px', fontSize: '0.9rem' }}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span style={{ wordBreak: 'break-word' }}>{translation.en}</span>
                  <span style={{ wordBreak: 'break-word' }}>{translation.ro}</span>
                  <button
                    className="btn-secondary"
                    onClick={() => handleEdit(translation)}
                    style={{ padding: '4px 8px', fontSize: '0.9rem' }}
                  >
                    Edit
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TranslationManager;
