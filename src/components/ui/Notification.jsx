import React, { useState } from 'react';
import { X } from 'lucide-react';

/**
 * A simple notification component that doesn't rely on context providers
 * 
 * @param {Object} props
 * @param {string} props.type - The type of notification (success, error, warning, info)
 * @param {string} props.message - The message to display
 * @param {Function} props.onClose - Function to call when notification is closed
 * @param {number} props.duration - Duration in ms before auto-closing (0 for no auto-close)
 */
const Notification = ({ type = 'info', message, onClose, duration = 5000 }) => {
  const [visible, setVisible] = useState(true);
  
  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);
  
  if (!visible) return null;
  
  // Define styles based on notification type
  const styles = {
    success: 'bg-green-50 border-green-500 text-green-800',
    error: 'bg-red-50 border-red-500 text-red-800',
    warning: 'bg-yellow-50 border-yellow-500 text-yellow-800',
    info: 'bg-blue-50 border-blue-500 text-blue-800',
  };
  
  const handleClose = () => {
    setVisible(false);
    if (onClose) onClose();
  };
  
  return (
    <div className={`fixed top-4 right-4 z-50 max-w-md border-l-4 rounded shadow-md p-4 ${styles[type] || styles.info}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1 mr-4">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <button 
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default Notification; 