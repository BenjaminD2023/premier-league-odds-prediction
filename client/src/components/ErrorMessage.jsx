import React, { useEffect } from 'react';

export default function ErrorMessage({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="error-message" onClick={onClose}>
      <strong>Error:</strong> {message}
    </div>
  );
}
