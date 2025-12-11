// src/components/EmergencyModal.tsx
import React from 'react';
import { CloseIcon } from './icons';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const emergencyNumbers = [
  { service: 'All-in-One Emergency', number: '112' },
  { service: 'Police (Direct)', number: '100' },
  { service: 'Fire (Direct)', number: '101' },
  { service: 'Ambulance (Direct)', number: '102' },
  { service: 'Disaster Management/Medical Emergency', number: '108' },
];

const helplineNumbers = [
  { service: 'Women Helpline (General)', number: '1091' },
  { service: 'Women Helpline (Domestic Abuse)', number: '181' },
  { service: 'Child Helpline', number: '1098' },
  { service: 'Senior Citizen Helpline', number: '14567' },
  { service: 'Cyber Crime Helpline', number: '1930' },
  { service: 'KIRAN Mental Health Helpline', number: '1800-599-0019' },
];

const EmergencyModal: React.FC<EmergencyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Emergency & Helpline Numbers</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-500 hover:bg-gray-100"
          >
            <CloseIcon className="h-6 w-6" />
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* Emergency Numbers */}
          <section>
            <h3 className="text-lg font-semibold text-red-600 mb-3">🚨 Emergency Services</h3>
            <div className="space-y-2">
              {emergencyNumbers.map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <span className="text-gray-800 font-medium">{item.service}</span>
                  <a
                    href={`tel:${item.number}`}
                    className="text-red-600 font-bold text-lg hover:underline"
                  >
                    {item.number}
                  </a>
                </div>
              ))}
            </div>
          </section>

          {/* Helpline Numbers */}
          <section>
            <h3 className="text-lg font-semibold text-blue-600 mb-3">📞 Support Helplines</h3>
            <div className="space-y-2">
              {helplineNumbers.map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <span className="text-gray-800 font-medium">{item.service}</span>
                  <a
                    href={`tel:${item.number}`}
                    className="text-blue-600 font-bold text-lg hover:underline"
                  >
                    {item.number}
                  </a>
                </div>
              ))}
            </div>
          </section>

          {/* Disclaimer */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 p-3 rounded-r-lg text-sm">
            <p>
              <strong>Note:</strong> For life-threatening emergencies, dial <strong>112</strong> immediately.
              These numbers are for India. Keep this list handy for quick access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyModal;
