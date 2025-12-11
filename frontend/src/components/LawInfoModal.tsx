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

interface LawInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  law: LawDetail | null;
  loading?: boolean;
  error?: string | null;
}

const LawInfoModal: React.FC<LawInfoModalProps> = ({ isOpen, onClose, law, loading, error }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-800">Law Details</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">×</button>
        </div>
        <div className="p-6 space-y-4">
          {loading && <div className="text-gray-600">Loading law details…</div>}
          {error && <div className="text-rose-700 bg-rose-50 border border-rose-200 rounded p-3 text-sm">{error}</div>}
          {!loading && !error && law && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Act</div>
                  <div className="font-medium text-gray-900">{law.act_name}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Section</div>
                  <div className="font-medium text-gray-900">{law.law_code} {law.section_number}</div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-sm text-gray-500">Title</div>
                  <div className="font-medium text-gray-900">{law.title}</div>
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-500 mb-1">Simplified Description</div>
                <div className="text-gray-900 whitespace-pre-wrap">{law.simplified_description}</div>
              </div>

              <div>
                <div className="text-sm text-gray-500 mb-1">Full Legal Text</div>
                <div className="text-gray-900 whitespace-pre-wrap">{law.description}</div>
              </div>

              <div>
                <div className="text-sm text-gray-500 mb-1">Punishment</div>
                <div className="text-gray-900">{law.punishment || '—'}</div>
              </div>

              {(law.keywords && law.keywords.length > 0) && (
                <div>
                  <div className="text-sm text-gray-500 mb-1">Keywords</div>
                  <div className="text-gray-900">{law.keywords.join(', ')}</div>
                </div>
              )}

              {(law.examples && law.examples.length > 0) && (
                <div>
                  <div className="text-sm text-gray-500 mb-1">Examples</div>
                  <ul className="list-disc list-inside text-gray-900 space-y-1">
                    {law.examples.map((ex, i) => (<li key={i}>{ex}</li>))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LawInfoModal;
