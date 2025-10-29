import React, { useState } from 'react';
import { X, Printer } from 'lucide-react';

interface PrintOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (options: string[]) => void;
  title?: string;
  options: Array<{
    id: string;
    label: string;
    description?: string;
  }>;
}

export const PrintOptionsModal: React.FC<PrintOptionsModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Print Options',
  options,
}) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>(
    options.map(option => option.id) // Select all by default
  );

  const handleOptionToggle = (optionId: string) => {
    setSelectedOptions(prev =>
      prev.includes(optionId) ? prev.filter(id => id !== optionId) : [...prev, optionId]
    );
  };

  const handleConfirm = () => {
    onConfirm(selectedOptions);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          <p className="text-gray-600 mb-4">
            Select the sections you want to include in your quotation:
          </p>

          <div className="space-y-3">
            {options.map(option => (
              <label key={option.id} className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedOptions.includes(option.id)}
                  onChange={() => handleOptionToggle(option.id)}
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{option.label}</div>
                  {option.description && (
                    <div className="text-xs text-gray-500 mt-1">{option.description}</div>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-500">
            {selectedOptions.length} of {options.length} sections selected
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedOptions.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Printer size={16} />
              <span>Generate</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintOptionsModal;
