// src/components/AddLawModal.tsx
import React from 'react';

interface AddLawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  token: string | null;
  categories: string[];
}

const AddLawModal: React.FC<AddLawModalProps> = ({ isOpen, onClose, onSuccess, token, categories }) => {
  const [formData, setFormData] = React.useState({
    category: '',
    act_name: '',
    law_code: '',
    section_number: '',
    title: '',
    description: '',
    simplified_description: '',
    punishment: '',
    keywords: '',
    examples: ''
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.category || !formData.act_name || !formData.law_code || 
        !formData.section_number || !formData.title || !formData.description || 
        !formData.simplified_description) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Process keywords and examples
      const payload = {
        ...formData,
        keywords: formData.keywords ? formData.keywords.split(',').map(k => k.trim()).filter(Boolean) : [],
        examples: formData.examples ? formData.examples.split('\n').map(e => e.trim()).filter(Boolean) : []
      };

      const res = await fetch('/api/laws', {
        method: 'POST',
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

      // Success
      setFormData({
        category: '',
        act_name: '',
        law_code: '',
        section_number: '',
        title: '',
        description: '',
        simplified_description: '',
        punishment: '',
        keywords: '',
        examples: ''
      });
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Failed to create law');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-800">Add New Law</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            disabled={loading}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded p-3">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2"
                required
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Act Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Act Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="act_name"
                value={formData.act_name}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2"
                placeholder="e.g., Bharatiya Nyaya Sanhita"
                required
              />
            </div>

            {/* Law Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Law Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="law_code"
                value={formData.law_code}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2"
                placeholder="e.g., BNS"
                required
              />
            </div>

            {/* Section Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Section Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="section_number"
                value={formData.section_number}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2"
                placeholder="e.g., 302"
                required
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2"
              placeholder="e.g., Punishment for murder"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Full Legal Text) <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2"
              rows={4}
              placeholder="Full legal text of the section..."
              required
            />
          </div>

          {/* Simplified Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Simplified Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="simplified_description"
              value={formData.simplified_description}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2"
              rows={3}
              placeholder="Simplified explanation for general understanding..."
              required
            />
          </div>

          {/* Punishment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Punishment
            </label>
            <input
              type="text"
              name="punishment"
              value={formData.punishment}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2"
              placeholder="e.g., Imprisonment for life or death penalty"
            />
          </div>

          {/* Keywords */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Keywords <span className="text-gray-500 text-xs">(comma-separated)</span>
            </label>
            <input
              type="text"
              name="keywords"
              value={formData.keywords}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2"
              placeholder="e.g., murder, homicide, culpable"
            />
          </div>

          {/* Examples */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Examples <span className="text-gray-500 text-xs">(one per line)</span>
            </label>
            <textarea
              name="examples"
              value={formData.examples}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2"
              rows={3}
              placeholder="Example 1: A shoots Z with the intention of killing him...&#10;Example 2: ..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Law'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLawModal;
