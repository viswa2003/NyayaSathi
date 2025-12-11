// src/components/LawDetailModal.tsx
import React from 'react';

interface LawDetail {
  _id: string;
  category: string;
  act_name: string;
  law_code: string;
  section_number: string;
  title: string;
  description: string;
  simplified_description: string;
  punishment?: string;
  keywords?: string[];
  examples?: string[];
}

interface LawDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  law: LawDetail | null;
  token: string | null;
  categories: string[];
  onSuccess: () => void;
}

const LawDetailModal: React.FC<LawDetailModalProps> = ({ 
  isOpen, 
  onClose, 
  law, 
  token, 
  categories,
  onSuccess 
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [formData, setFormData] = React.useState<Partial<LawDetail>>({});
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  React.useEffect(() => {
    if (law) {
      setFormData({
        category: law.category,
        act_name: law.act_name,
        law_code: law.law_code,
        section_number: law.section_number,
        title: law.title,
        description: law.description,
        simplified_description: law.simplified_description,
        punishment: law.punishment || '',
        keywords: law.keywords || [],
        examples: law.examples || []
      });
      setIsEditing(false);
      setError(null);
      setShowDeleteConfirm(false);
    }
  }, [law]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    if (!law) return;

    try {
      setLoading(true);
      setError(null);

      const payload = {
        ...formData,
        keywords: typeof formData.keywords === 'string' 
          ? (formData.keywords as string).split(',').map(k => k.trim()).filter(Boolean)
          : formData.keywords,
        examples: typeof formData.examples === 'string'
          ? (formData.examples as string).split('\n').map(e => e.trim()).filter(Boolean)
          : formData.examples
      };

      const res = await fetch(`/api/laws/${law._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed (${res.status})`);
      }

      setIsEditing(false);
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Failed to update law');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!law) return;

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/laws/${law._id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed (${res.status})`);
      }

      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Failed to delete law');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !law) return null;

  const keywordsDisplay = Array.isArray(formData.keywords) 
    ? formData.keywords.join(', ') 
    : formData.keywords || '';
  
  const examplesDisplay = Array.isArray(formData.examples)
    ? formData.examples.join('\n')
    : formData.examples || '';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-800">Law Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            disabled={loading}
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded p-3">
              {error}
            </div>
          )}

          {showDeleteConfirm && (
            <div className="bg-rose-50 border border-rose-200 rounded p-4">
              <p className="text-rose-900 font-medium mb-3">Are you sure you want to delete this law?</p>
              <p className="text-sm text-rose-700 mb-4">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-4 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 disabled:bg-gray-400"
                >
                  {loading ? 'Deleting...' : 'Yes, Delete'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={loading}
                  className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              {isEditing ? (
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full border rounded-md px-3 py-2"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              ) : (
                <p className="text-gray-900">{law.category}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Act Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="act_name"
                  value={formData.act_name}
                  onChange={handleChange}
                  className="w-full border rounded-md px-3 py-2"
                />
              ) : (
                <p className="text-gray-900">{law.act_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Law Code</label>
              {isEditing ? (
                <input
                  type="text"
                  name="law_code"
                  value={formData.law_code}
                  onChange={handleChange}
                  className="w-full border rounded-md px-3 py-2"
                />
              ) : (
                <p className="text-gray-900">{law.law_code}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section Number</label>
              {isEditing ? (
                <input
                  type="text"
                  name="section_number"
                  value={formData.section_number}
                  onChange={handleChange}
                  className="w-full border rounded-md px-3 py-2"
                />
              ) : (
                <p className="text-gray-900">{law.section_number}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            {isEditing ? (
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2"
              />
            ) : (
              <p className="text-gray-900">{law.title}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Full Legal Text)</label>
            {isEditing ? (
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2"
                rows={4}
              />
            ) : (
              <p className="text-gray-900 whitespace-pre-wrap">{law.description}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Simplified Description</label>
            {isEditing ? (
              <textarea
                name="simplified_description"
                value={formData.simplified_description}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2"
                rows={3}
              />
            ) : (
              <p className="text-gray-900 whitespace-pre-wrap">{law.simplified_description}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Punishment</label>
            {isEditing ? (
              <input
                type="text"
                name="punishment"
                value={formData.punishment}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2"
              />
            ) : (
              <p className="text-gray-900">{law.punishment || '—'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Keywords</label>
            {isEditing ? (
              <input
                type="text"
                name="keywords"
                value={keywordsDisplay}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2"
                placeholder="Comma-separated"
              />
            ) : (
              <p className="text-gray-900">{keywordsDisplay || '—'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Examples</label>
            {isEditing ? (
              <textarea
                name="examples"
                value={examplesDisplay}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2"
                rows={3}
                placeholder="One per line"
              />
            ) : (
              <div className="text-gray-900">
                {law.examples && law.examples.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1">
                    {law.examples.map((ex, i) => (
                      <li key={i}>{ex}</li>
                    ))}
                  </ul>
                ) : (
                  '—'
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            {!isEditing && !showDeleteConfirm && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Update
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700"
                >
                  Delete
                </button>
              </>
            )}
            {isEditing && (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  disabled={loading}
                  className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LawDetailModal;
