import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error';
  duration?: number;
}

interface ToastProps {
  toast: ToastMessage;
  onRemove: (id: string) => void;
}

function Toast({ toast, onRemove }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, toast.duration || 3000);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  return (
    <div
      className={`
      fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg
      ${toast.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}
    `}
    >
      {toast.type === 'success' ? (
        <CheckCircle size={20} className="text-green-600" />
      ) : (
        <XCircle size={20} className="text-red-600" />
      )}

      <span
        className={`text-sm font-medium ${toast.type === 'success' ? 'text-green-800' : 'text-red-800'}`}
      >
        {toast.message}
      </span>

      <button
        onClick={() => onRemove(toast.id)}
        className={`ml-2 ${toast.type === 'success' ? 'text-green-600 hover:text-green-800' : 'text-red-600 hover:text-red-800'}`}
      >
        <X size={16} />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Expose global toast function
  useEffect(() => {
    (window as any).showToast = addToast;
  }, []);

  return (
    <div className="fixed top-0 right-0 z-50 space-y-2 p-4">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}
