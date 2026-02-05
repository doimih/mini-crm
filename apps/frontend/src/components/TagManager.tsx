import { useState, FormEvent } from 'react';
import { api } from '../services/api';

interface Tag {
  id: number;
  name: string;
}

interface TagManagerProps {
  tags: Tag[];
  onTagsChange: () => void;
}

export default function TagManager({ tags, onTagsChange }: TagManagerProps) {
  const [newTagName, setNewTagName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddTag = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    setLoading(true);
    try {
      await api.post('/tags', { name: newTagName });
      setNewTagName('');
      onTagsChange();
    } catch (error) {
      console.error('Failed to add tag', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTag = async (id: number) => {
    if (!confirm('Are you sure you want to delete this tag?')) return;

    try {
      await api.delete(`/tags/${id}`);
      onTagsChange();
    } catch (error) {
      console.error('Failed to delete tag', error);
    }
  };

  return (
    <div className="tag-manager">
      <h3>Tags</h3>
      <form onSubmit={handleAddTag} className="tag-form">
        <input
          type="text"
          placeholder="New tag name"
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          Add Tag
        </button>
      </form>
      <div className="tags">
        {tags.map((tag) => (
          <span key={tag.id} className="tag">
            {tag.name}
            <button
              onClick={() => handleDeleteTag(tag.id)}
              className="tag-delete"
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
