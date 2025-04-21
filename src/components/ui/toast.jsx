import React, { useState, useEffect, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import { XIcon } from 'lucide-react';

// Toast Context
const ToastContext = createContext(null);

// Toast Provider Component
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prevToasts) => [...prevToasts, { id, ...toast }]);

    // Auto dismiss
    if (toast.duration !== Infinity) {
      setTimeout(() => {
        dismissToast(id);
      }, toast.duration || 5000);
    }
    
    return id;
  };

  const dismissToast = (id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  useEffect(() => {
    // Expose toast function globally for use outside of React
    window.toast = addToast;
    
    return () => {
      delete window.toast;
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, dismissToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

// Custom Hook to use the toast
export const useToast = () => {
  const context = useContext(ToastContext);
  
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  return context;
};

// Simple toast function for components that don't have access to the context
export const toast = (props) => {
  if (typeof window !== 'undefined' && window.toast) {
    return window.toast(props);
  } else {
    console.warn('Toast provider not initialized yet');
  }
};

// Toast Container Component
const ToastContainer = () => {
  const { toasts, dismissToast } = useContext(ToastContext);
  
  if (typeof window === 'undefined') return null;
  
  return createPortal(
    <div className="fixed top-0 right-0 z-50 p-4 space-y-4 max-w-md">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={() => dismissToast(toast.id)} />
      ))}
    </div>,
    document.body
  );
};

// Individual Toast Component
const Toast = ({ toast, onDismiss }) => {
  const { title, description, variant = 'default' } = toast;
  
  // Determine the background color based on the variant
  const variantClasses = {
    default: 'bg-white text-gray-900 border-gray-200',
    success: 'bg-green-50 text-green-900 border-green-200',
    error: 'bg-red-50 text-red-900 border-red-200',
    warning: 'bg-yellow-50 text-yellow-900 border-yellow-200',
    destructive: 'bg-red-50 text-red-900 border-red-200',
    info: 'bg-blue-50 text-blue-900 border-blue-200'
  };

  return (
    <div 
      className={`rounded-lg shadow-lg border p-4 transform transition-all duration-300 animate-in slide-in-from-right-full ${variantClasses[variant]}`}
      role="alert"
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          {title && <h3 className="font-semibold text-sm">{title}</h3>}
          {description && <p className="text-sm mt-1">{description}</p>}
        </div>
        <button 
          onClick={onDismiss}
          className="ml-3 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <XIcon size={16} />
        </button>
      </div>
    </div>
  );
};

export default ToastProvider; 